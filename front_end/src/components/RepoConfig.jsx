import { useState } from "react";

function RepoConfig() {

  const [owner,setOwner] = useState("");
  const [repo,setRepo] = useState("");
  const [issue,setIssue] = useState("");

  const handleRun = () => {
    console.log(owner, repo, issue);
  };

  return (

    <div>
      <div className="slabel">Repository</div>

      <div className="config">

        <div className="config-body">

          <div className="fields">

            <div className="frow">

              <div className="f">
                <label>Owner</label>
                <input
                  value={owner}
                  onChange={(e)=>setOwner(e.target.value)}
                  placeholder="octocat"
                />
              </div>

              <div className="f">
                <label>Repository</label>
                <input
                  value={repo}
                  onChange={(e)=>setRepo(e.target.value)}
                  placeholder="hello-world"
                />
              </div>

            </div>

            <div className="f">
              <label>Issue number</label>
              <input
                value={issue}
                onChange={(e)=>setIssue(e.target.value)}
                placeholder="Leave blank for all open issues"
              />
            </div>

            <button className="run-btn" onClick={handleRun}>
              Run Automation
            </button>

          </div>

        </div>

      </div>
    </div>

  );
}

export default RepoConfig;