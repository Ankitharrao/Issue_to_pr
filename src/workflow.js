const github = require("./github");
const ai = require("./ai");

// ─────────────────────────────────────────────────────
// Run workflow for a SINGLE issue
// ─────────────────────────────────────────────────────
async function runWorkflow(issueNumber) {
  console.log("\n🚀 Starting Issue-to-PR Workflow");
  console.log("=".repeat(50));

  try {
    // STEP 1: Read the GitHub Issue
    console.log(`\n📋 STEP 1: Reading issue #${issueNumber}...`);
    const issue = await github.getIssue(issueNumber);
    console.log(`   Title: ${issue.title}`);
    console.log(`   Body: ${issue.body?.substring(0, 100)}...`);

    // STEP 2: Agent explores repo and generates fixes autonomously
console.log("\n🤖 STEP 2 & 3: Agent analyzing issue and codebase...");
const proposedChanges = await ai.generateCodeFix(issue);  // ← no repoFiles argument

    if (proposedChanges.length === 0) {
      console.log("⚠️  Agent found no changes needed. Exiting.");
      return;
    }

    // STEP 4: AI reviews the changes
    console.log("\n🔍 STEP 4: Running automated code review...");
    const reviewFeedback = await ai.reviewChanges(issue, [], proposedChanges);
    console.log("\n📝 Review Feedback:");
    console.log(reviewFeedback);

    // STEP 5: Create branch and push
    console.log("\n🌿 STEP 5: Creating branch and pushing changes...");
    const branchName = `auto-fix/issue-${issueNumber}-${Date.now()}`;
    await github.createBranch(branchName);
    for (const fix of proposedChanges) {
  await github.pushFiles(fix.path, fix.newContent, branchName);
}
    // STEP 6: Create Pull Request
    console.log("\n📬 STEP 6: Creating Pull Request...");
    const prUrl = await github.createPullRequest(
  branchName,
  `Fix: ${issue.title}`,
  `## AI Generated Fix\n\nCloses #${issueNumber}\n\n## AI Review\n\n${reviewFeedback}`
);
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

// ─────────────────────────────────────────────────────
// Run workflow for ALL open issues with PRIORITIZATION
// ─────────────────────────────────────────────────────
async function runPrioritizedWorkflow() {
  console.log("\n🚀 Starting Prioritized Issue-to-PR Workflow");
  console.log("=".repeat(50));

  try {    // STEP 1: Get all open issues
    console.log("\n📋 STEP 1: Fetching all open issues...");
    const allIssues = await github.getAllIssues();
    console.log(`   Found ${allIssues.length} open issues`);

    if (allIssues.length === 0) {
      console.log("⚠️  No open issues found!");
      return;
    }

    // STEP 2: AI prioritizes issues
    console.log("\n🧠 STEP 2: AI prioritizing issues...");
    const prioritized = await ai.prioritizeIssues(allIssues);

    // STEP 3: Filter to only CRITICAL and HIGH
    let toProcess = prioritized.filter(
      (i) => i.priority === "CRITICAL" || i.priority === "HIGH"
    );

    // If none are critical/high, just take top 2
    if (toProcess.length === 0) {
      console.log("\n⚠️  No CRITICAL/HIGH issues. Taking top 2...");
      toProcess = prioritized.slice(0, 2);
    }

    console.log(`\n🎯 Will process ${toProcess.length} issue(s) in priority order`);

    const results = [];

    for (let i = 0; i < toProcess.length; i++) {
      const priorityIssue = toProcess[i];

      console.log(`\n${"─".repeat(50)}`);
      const emoji =
        priorityIssue.priority === "CRITICAL" ? "🔴" :
        priorityIssue.priority === "HIGH"     ? "🟠" :
        priorityIssue.priority === "MEDIUM"   ? "🟡" : "🟢";

      console.log(`${emoji} Processing issue #${priorityIssue.number} [${priorityIssue.priority}]`);
      console.log(`   "${priorityIssue.title}"`);
      console.log(`   Reason: ${priorityIssue.reason}`);

      try {
        const result = await runWorkflow(priorityIssue.number);
        if (result) {
          results.push({
            issue: priorityIssue,
            prUrl: result.prUrl,
          });
        }
      } catch (err) {
        console.error(`❌ Failed to process issue #${priorityIssue.number}:`, err.message);
      }

      // Wait between issues to avoid rate limits
      if (i < toProcess.length - 1) {
        console.log("\n⏳ Waiting 15s before next issue...");
        await new Promise((r) => setTimeout(r, 15000));
      }
    }

    // Final summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ALL WORKFLOWS COMPLETE!");
    console.log(`✅ Created ${results.length} Pull Request(s):\n`);
    results.forEach((r) => {
      const emoji =
        r.issue.priority === "CRITICAL" ? "🔴" :
        r.issue.priority === "HIGH"     ? "🟠" :
        r.issue.priority === "MEDIUM"   ? "🟡" : "🟢";
      console.log(`   ${emoji} #${r.issue.number} [${r.issue.priority}] → ${r.prUrl}`);
    });
    console.log("=".repeat(50));

    return results;

  } catch (error) {
    console.error("\n❌ Prioritized workflow failed:", error.message);
    throw error;
  }
}

module.exports = { runWorkflow, runPrioritizedWorkflow };