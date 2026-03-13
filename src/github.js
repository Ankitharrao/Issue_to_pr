require("dotenv").config();
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

//getIssue()
async function getIssue(issueNumber) {
  const issue = await octokit.issues.get({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    issue_number: issueNumber
  });

  return {
    title: issue.data.title,
    body: issue.data.body
  };
}


//getRepoFiles()
async function getRepoFiles() {
  const { data } = await octokit.repos.getContent({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    path: ""
  });

  const files = [];

  for (const file of data) {
    if (file.type === "file") {
      const fileData = await octokit.repos.getContent({
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: file.path
      });

      const content = Buffer.from(fileData.data.content, "base64").toString();

      files.push({
        path: file.path,
        content
      });
    }
  }

  return files;
}


//createBranch()
async function createBranch(branchName) {

  // Step 1: get main branch reference
  const { data } = await octokit.git.getRef({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    ref: "heads/main"
  });

  // Step 2: extract SHA
  const sha = data.object.sha;

  // Step 3: create new branch
  await octokit.git.createRef({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: sha
  });

  console.log("Branch created:", branchName);
}


//pushFiles()
async function pushFiles(filePath, newContent, branchName) {

  const { data: fileData } = await octokit.repos.getContent({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    path: filePath,
    ref: branchName
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
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
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    title: title,
    head: branchName,
    base: "main",
    body: body
  });

  return data.html_url;
}


module.exports = {
  getIssue,
  getRepoFiles,
  createBranch,
  pushFiles,
  createPullRequest
};