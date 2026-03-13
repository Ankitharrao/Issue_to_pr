const Groq = require("groq-sdk");
const { Octokit } = require("@octokit/rest");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────
// 🔧 TOOL DEFINITIONS (what the agent can call)
// ─────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all source code files in the repository.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full content of a specific file. Only read files relevant to the issue.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path e.g. calculator.js" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_code",
      description: "Search for a keyword across all files to find relevant code.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Keyword or function name to search for" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_fix",
      description: "Propose a fix for a file. Call this when you know what needs to change.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to modify" },
          newContent: { type: "string", description: "Complete new content of the file" },
          explanation: { type: "string", description: "What was changed and why" },
        },
        required: ["path", "newContent", "explanation"],
      },
    },
  },
];

// ─────────────────────────────────────────────────────
// 🛠️ TOOL IMPLEMENTATIONS
// ─────────────────────────────────────────────────────
async function executeTool(name, args) {
  switch (name) {

    case "list_files": {
      console.log("   🔧 Agent: listing files...");
      const { data: tree } = await octokit.git.getTree({
        owner: OWNER, repo: REPO, tree_sha: "HEAD", recursive: "true",
      });
      const files = tree.tree
        .filter(f => f.type === "blob" &&
          !f.path.includes("node_modules") &&
          (f.path.endsWith(".js") || f.path.endsWith(".ts") ||
           f.path.endsWith(".py") || f.path.endsWith(".md")))
        .map(f => f.path);
      return `Files:\n${files.join("\n")}`;
    }

    case "read_file": {
      console.log(`   🔧 Agent: reading → ${args.path}`);
      try {
        const { data: tree } = await octokit.git.getTree({
          owner: OWNER, repo: REPO, tree_sha: "HEAD", recursive: "true",
        });
        const file = tree.tree.find(f => f.path === args.path);
        if (!file) return `File not found: ${args.path}`;
        const { data: blob } = await octokit.git.getBlob({
          owner: OWNER, repo: REPO, file_sha: file.sha,
        });
        return Buffer.from(blob.content, "base64").toString("utf-8");
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }

    case "search_code": {
      console.log(`   🔧 Agent: searching "${args.keyword}"...`);
      const { data: tree } = await octokit.git.getTree({
        owner: OWNER, repo: REPO, tree_sha: "HEAD", recursive: "true",
      });
      const codeFiles = tree.tree.filter(f =>
        f.type === "blob" && !f.path.includes("node_modules") &&
        (f.path.endsWith(".js") || f.path.endsWith(".ts") || f.path.endsWith(".py"))
      );
      const results = [];
      for (const file of codeFiles) {
        const { data: blob } = await octokit.git.getBlob({
          owner: OWNER, repo: REPO, file_sha: file.sha,
        });
        const content = Buffer.from(blob.content, "base64").toString("utf-8");
        if (content.toLowerCase().includes(args.keyword.toLowerCase())) {
          const lines = content.split("\n")
            .map((l, i) => ({ l, i: i + 1 }))
            .filter(x => x.l.toLowerCase().includes(args.keyword.toLowerCase()))
            .map(x => `  Line ${x.i}: ${x.l.trim()}`)
            .slice(0, 5)
            .join("\n");
          results.push(`${file.path}:\n${lines}`);
        }
      }
      return results.length ? results.join("\n\n") : `No results for "${args.keyword}"`;
    }

    case "propose_fix": {
      console.log(`   🔧 Agent: proposing fix → ${args.path}`);
      global.agentFixes = global.agentFixes || [];
      const idx = global.agentFixes.findIndex(f => f.path === args.path);
      if (idx >= 0) global.agentFixes[idx] = args;
      else global.agentFixes.push(args);
      return `Fix saved for ${args.path}`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// ─────────────────────────────────────────────────────
// 🤖 AGENT LOOP (pure Groq — no LangChain needed)
// ─────────────────────────────────────────────────────
async function generateCodeFix(issue) {
  console.log("\n🤖 Agent starting (pure Groq tool-calling)...\n");
  global.agentFixes = [];

  const messages = [
    {
      role: "system",
      content: `You are an expert software engineer agent. Fix GitHub issues step by step.

STRICT WORKFLOW — follow this exact order:
1. Call list_files ONCE to see available files
2. Call search_code to find the relevant function/code
3. Call read_file on the specific file that needs fixing
4. Call propose_fix with the complete corrected file

RULES:
- Never call list_files more than once
- Always call read_file before propose_fix
- Always call propose_fix at the end
- Do not repeat the same tool call twice`,
    },
    {
      role: "user",
      content: `Fix this GitHub issue:\n\nTitle: ${issue.title}\nDescription: ${issue.body || "No description"}`,
    },
  ];

  const MAX_ITERATIONS = 10;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    await sleep(2000);

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.1,
      max_tokens: 4000,
    });

    const msg = response.choices[0].message;
    const finish = response.choices[0].finish_reason;

    messages.push(msg);

    // No tool calls = agent is done
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log("   ✅ Agent finished");
      break;
    }

    // Execute each tool call
    for (const call of msg.tool_calls) {
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments || "{}");
      const result = await executeTool(name, args);

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: String(result),
      });
    }

    if (finish === "stop" && global.agentFixes.length > 0) break;
  }

  const fixes = global.agentFixes || [];
  console.log(`\n✅ Agent proposed ${fixes.length} fix(es)`);
  fixes.forEach(f => console.log(`   - ${f.path}: ${f.explanation}`));
  return fixes;
}

// ─────────────────────────────────────────────────────
// 🧠 ISSUE PRIORITIZATION
// ─────────────────────────────────────────────────────
async function prioritizeIssues(issues) {
  console.log(`\n📊 Prioritizing ${issues.length} issues...`);

  const issueList = issues
    .map(i => `Issue #${i.number}: ${i.title}\nDescription: ${i.body || "No description"}`)
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a senior engineering manager. Respond ONLY with a valid JSON array, no markdown, no explanation.
Priority: CRITICAL (crashes/security), HIGH (major broken), MEDIUM (minor bugs), LOW (typos/docs).
Format: [{"number":1,"title":"...","priority":"CRITICAL","reason":"one sentence","score":95}]
Sort by score descending.`,
      },
      {
        role: "user",
        content: `Prioritize these issues:\n\n${issueList}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  try {
    const text = response.choices[0].message.content
      .replace(/```json/g, "").replace(/```/g, "").trim();
    const prioritized = JSON.parse(text);

    console.log("\n🗂️  Priority Queue:");
    prioritized.forEach(issue => {
      const emoji = issue.priority === "CRITICAL" ? "🔴" :
                    issue.priority === "HIGH"     ? "🟠" :
                    issue.priority === "MEDIUM"   ? "🟡" : "🟢";
      console.log(`   ${emoji} #${issue.number} [${issue.priority}] ${issue.title}`);
      console.log(`      → ${issue.reason}`);
    });

    return prioritized;
  } catch (e) {
    console.error("Priority parsing failed, using original order");
    return issues.map((i, idx) => ({
      number: i.number, title: i.title,
      priority: "MEDIUM", reason: "Could not analyze",
      score: issues.length - idx,
    }));
  }
}

// ─────────────────────────────────────────────────────
// 🔍 CODE REVIEW
// ─────────────────────────────────────────────────────
async function reviewChanges(issue, originalFiles, changedFiles) {
  console.log("🔍 AI reviewing changes...");
  await sleep(8000);

  const originalContext = originalFiles
    .filter(f => changedFiles.some(c => c.path === f.path))
    .map(f => `### Original: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const newContext = changedFiles
    .map(f => `### Modified: ${f.path}\nChange: ${f.explanation}\n\`\`\`\n${f.newContent}\n\`\`\``)
    .join("\n\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a senior engineer doing a concise code review. Use bullet points.",
      },
      {
        role: "user",
        content: `Issue: ${issue.title}\n\n${originalContext}\n\nProposed:\n${newContext}\n\nReview: correctness, edge cases, security, quality. End with APPROVE or REQUEST CHANGES.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  console.log("✅ Review complete");
  return response.choices[0].message.content;
}

module.exports = { generateCodeFix, reviewChanges, prioritizeIssues };
