require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001; // React runs on 3000, backend on 3001

const server = http.createServer(async (req, res) => {

  // CORS for React dev server
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── POST /api/run ──
  if (req.method === "POST" && req.url === "/api/run") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {

      const { repo, issueNumber } = JSON.parse(body);
      const [owner, repoName] = repo.split("/");

      // Set env vars from request
      process.env.GITHUB_OWNER = owner;
      process.env.GITHUB_REPO = repoName;

      // SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      const send = (data) => {
        res.write(`data:${JSON.stringify(data)}\n\n`);
      };

      // Override console.log to stream steps to frontend
      const originalLog = console.log;
      console.log = (...args) => {
        const msg = args.join(" ").trim();
        originalLog(...args);

        // Map log messages to SSE step events
        if (msg.includes("Fetching all open issues") || msg.includes("STEP 1"))
          send({ step: 1, msg: "Fetching open issues from GitHub..." });

        else if (msg.includes("Found") && msg.includes("open issues"))
          send({ done: 1, msg });

        else if (msg.includes("Prioritizing") || msg.includes("STEP 2"))
          send({ step: 2, msg: "AI ranking issues by priority..." });

        else if (msg.includes("Priority Queue") || msg.includes("🗂️"))
          send({ priority: msg });

        else if (msg.includes("Agent starting") || msg.includes("STEP 3"))
          send({ step: 3, msg: "Agent exploring codebase..." });

        else if (msg.includes("read_file") || msg.includes("search_code"))
          send({ step: 3, msg });

        else if (msg.includes("Agent proposed") || msg.includes("fix(es)"))
          send({ done: 3, msg });

        else if (msg.includes("reviewing") || msg.includes("STEP 4"))
          send({ step: 4, msg: "AI reviewing code changes..." });

        else if (msg.includes("Review complete"))
          send({ done: 4, msg: "Review complete" });

        else if (msg.includes("Creating branch") || msg.includes("STEP 5"))
          send({ step: 5, msg: "Creating branch and pushing files..." });

        else if (msg.includes("STEP 6") || msg.includes("Creating Pull Request"))
          send({ step: 6, msg: "Opening pull request..." });
      };

      try {
        // Import workflow dynamically so env vars are set first
        const { runWorkflow, runPrioritizedWorkflow } = require("./src/workflow");

        let result;

        if (issueNumber) {
          // Single issue mode
          result = await runWorkflow(issueNumber);
          if (result) {
            // Build simple diff from changes
            const diff = buildDiff(result.changedFiles);
            send({ done: 6, msg: "Pull request created!" });
            send({ prUrl: result.prUrl });
            send({ review: result.reviewFeedback });
            send({ diff });
            send({ complete: true });
          }
        } else {
          // Auto prioritize mode
          const results = await runPrioritizedWorkflow();
          if (results && results.length > 0) {
            send({ done: 6, msg: `Created ${results.length} PR(s)` });
            send({ prUrl: results[0].prUrl });
            send({ complete: true });
          } else {
            send({ complete: true });
          }
        }

      } catch (err) {
        send({ error: true, msg: err.message });
      } finally {
        console.log = originalLog;
        res.end();
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end("Not found");
});

// Build a simple diff array from agent's proposed changes
function buildDiff(changedFiles) {
  if (!changedFiles || changedFiles.length === 0) return [];
  const diff = [];
  changedFiles.forEach(f => {
    diff.push({ type: "added", text: `// ${f.path} — ${f.explanation}` });
    const lines = f.newContent.split("\n").slice(0, 20); // first 20 lines
    lines.forEach(line => diff.push({ type: "added", text: line }));
  });
  return diff;
}

server.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`👉 Make sure React frontend runs on http://localhost:3000\n`);
});