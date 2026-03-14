import { useState } from "react";

function RepoConfig({ status, onRun, onStop }) {

  const [owner, setOwner] = useState("");
  const [repo,  setRepo]  = useState("");
  const [issue, setIssue] = useState("");

  const running = status === "running";

  function handleRun() {
    if (!owner || !repo) {
      alert("Please enter owner and repository");
      return;
    }
    onRun(owner, repo, issue);
  }

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
                  onChange={e => setOwner(e.target.value)}
                  placeholder="Ankitharrao"
                  disabled={running}
                />
              </div>
              <div className="f">
                <label>Repository</label>
                <input
                  value={repo}
                  onChange={e => setRepo(e.target.value)}
                  placeholder="test_repo"
                  disabled={running}
                />
              </div>
            </div>

            <div className="f">
              <label>Issue number</label>
              <input
                value={issue}
                onChange={e => setIssue(e.target.value)}
                placeholder="Leave blank for all open issues (--auto)"
                type="number"
                disabled={running}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="run-btn"
                onClick={handleRun}
                disabled={running}
              >
                {running ? "Running..." : "Run Automation"}
              </button>

              {running && (
                <button
                  className="run-btn stop-btn"
                  onClick={onStop}
                >
                  Stop
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default RepoConfig;