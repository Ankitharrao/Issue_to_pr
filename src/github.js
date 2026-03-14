require("dotenv").config();
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Helper — always reads fresh from env (set by server.js from form)
const OWNER = () => process.env.GITHUB_OWNER;
const REPO  = () => process.env.GITHUB_REPO;

//getIssue()
async function getIssue(issueNumber) {
  try {
    const issue = await octokit.issues.get({
      owner: OWNER(),
      repo: REPO(),
      issue_number: issueNumber
    });
    return {
      title: issue.data.title,
      body: issue.data.body
    };
  } catch (error) {
    console.error("Error fetching issue:", error.message);
  }
}

//getAllIssues()
async function getAllIssues() {
  const { data } = await octokit.issues.listForRepo({
    owner: OWNER(),
    repo: REPO(),
    state: "open"
  });
  return data.map(issue => ({
    number: issue.number,
    title: issue.title,
    body: issue.body
  }));
}

//getRepoFiles()
async function getRepoFiles() {
  const { data } = await octokit.repos.getContent({
    owner: OWNER(),
    repo: REPO(),
    path: ""
  });

  const files = [];
  for (const file of data) {
    if (file.type === "file") {
      const fileData = await octokit.repos.getContent({
        owner: OWNER(),
        repo: REPO(),
        path: file.path
      });
      const content = Buffer.from(fileData.data.content, "base64").toString();
      files.push({ path: file.path, content });
    }
  }
  return files;
}

//createBranch()
async function createBranch(branchName) {
  const { data } = await octokit.git.getRef({
    owner: OWNER(),
    repo: REPO(),
    ref: "heads/main"
  });
  const sha = data.object.sha;
  await octokit.git.createRef({
    owner: OWNER(),
    repo: REPO(),
    ref: `refs/heads/${branchName}`,
    sha: sha
  });
  console.log("Branch created:", branchName);
}

//pushFiles()
async function pushFiles(filePath, newContent, branchName) {
  const { data: fileData } = await octokit.repos.getContent({
    owner: OWNER(),
    repo: REPO(),
    path: filePath,
    ref: branchName
  });
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER(),
    repo: REPO(),
    path: filePath,
    message: "AI generated fix",
    content: Buffer.from(newContent).toString("base64"),
    sha: fileData.sha,
    branch: branchName
  });
}

//createPullRequest()
async function createPullRequest(branchName, title, body) {
  const { data } = await octokit.pulls.create({
    owner: OWNER(),
    repo: REPO(),
    title: title,
    head: branchName,
    base: "main",
    body: body
  });
  return data.html_url;
}

module.exports = {
  getIssue,
  getAllIssues,
  getRepoFiles,
  createBranch,
  pushFiles,
  createPullRequest
};