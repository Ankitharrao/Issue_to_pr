require("dotenv").config();
const { runWorkflow, runPrioritizedWorkflow } = require("./workflow");

const arg = process.argv[2];

// Validate environment variables
const required = ["GITHUB_TOKEN", "GROQ_API_KEY", "GITHUB_OWNER", "GITHUB_REPO"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`🔧 Config: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);

// MODE 1: Auto prioritize all issues
// Usage: node src/index.js --auto
if (arg === "--auto") {
  console.log("🧠 Mode: AUTO PRIORITIZATION — processing all open issues by priority");
  runPrioritizedWorkflow()
    .then(() => console.log("\n✅ Done!"))
    .catch((err) => { console.error("Fatal error:", err); process.exit(1); });
}

// MODE 2: Specific issue number
// Usage: node src/index.js 1
else if (arg && !isNaN(parseInt(arg))) {
  const issueNumber = parseInt(arg);
  console.log(`🎯 Mode: SINGLE ISSUE — processing issue #${issueNumber}`);
  runWorkflow(issueNumber)
    .then(() => console.log("\n✅ Done!"))
    .catch((err) => { console.error("Fatal error:", err); process.exit(1); });
}

// No argument
else {
  console.log("Usage:");
  console.log("  node src/index.js 1        ← fix specific issue #1");
  console.log("  node src/index.js --auto   ← auto-prioritize all issues");
  process.exit(1);
}