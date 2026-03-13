require("dotenv").config();
const { runWorkflow } = require("./workflow");

// Get issue number from command line: node index.js 5
const issueNumber = parseInt(process.argv[2]);

if (!issueNumber) {
  console.error("❌ Please provide an issue number!");
  console.error("   Usage: node src/index.js <issue_number>");
  console.error("   Example: node src/index.js 1");
  process.exit(1);
}

// Validate environment variables
const required = ["GITHUB_TOKEN", "GEMINI_API_KEY", "GITHUB_OWNER", "GITHUB_REPO"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
  console.error("   Please check your .env file");
  process.exit(1);
}

console.log(`🔧 Config: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);

runWorkflow(issueNumber)
  .then((result) => {
    if (result) {
      console.log("\n✅ Done! Check your GitHub repo for the new PR.");
    }
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
