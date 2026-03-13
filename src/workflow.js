const github = require("./github");
const ai = require("./ai");

async function runWorkflow(issueNumber) {
  console.log("\n🚀 Starting Issue-to-PR Workflow");
  console.log("=".repeat(50));

  try {
    // STEP 1: Read the GitHub Issue
    console.log(`\n📋 STEP 1: Reading issue #${issueNumber}...`);
    const issue = await github.getIssue(issueNumber);
    console.log(`   Title: ${issue.title}`);
    console.log(`   Body: ${issue.body?.substring(0, 100)}...`);

    // STEP 2: Scan the codebase
    console.log("\n📁 STEP 2: Scanning repository files...");
    const repoFiles = await github.getRepoFiles();
    console.log(`   Found ${repoFiles.length} relevant files`);
    repoFiles.forEach((f) => console.log(`   - ${f.path}`));

    // STEP 3: Generate code fixes using AI
    console.log("\n🤖 STEP 3: Generating code fixes with AI...");
    const proposedChanges = await ai.generateCodeFix(issue, repoFiles);

    if (proposedChanges.length === 0) {
      console.log("⚠️  AI found no changes needed. Exiting.");
      return;
    }

    proposedChanges.forEach((c) => {
      console.log(`   - ${c.path}: ${c.explanation}`);
    });

    // STEP 4: AI reviews its own changes
    console.log("\n🔍 STEP 4: Running automated code review...");
    const reviewFeedback = await ai.reviewChanges(issue, repoFiles, proposedChanges);
    console.log("\n📝 Review Feedback:");
    console.log(reviewFeedback);

    // STEP 5: Create a new branch and push changes
    console.log("\n🌿 STEP 5: Creating branch and pushing changes...");
    const branchName = `auto-fix/issue-${issueNumber}-${Date.now()}`;
    await github.createBranch(branchName);
    await github.pushFiles(branchName, proposedChanges);

    // STEP 6: Create Pull Request
    console.log("\n📬 STEP 6: Creating Pull Request...");
    const prUrl = await github.createPullRequest(branchName, issue, reviewFeedback);

    // Done!
    console.log("\n" + "=".repeat(50));
    console.log("🎉 WORKFLOW COMPLETE!");
    console.log(`✅ Pull Request: ${prUrl}`);
    console.log("=".repeat(50));

    return { prUrl, reviewFeedback, changedFiles: proposedChanges };
  } catch (error) {
    console.error("\n❌ Workflow failed:", error.message);
    throw error;
  }
}

module.exports = { runWorkflow };
