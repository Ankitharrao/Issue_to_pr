function ResultsPanel({ status, prUrl, review, diff, error }) {

  // Empty state
  if (status === "idle") {
    return (
      <div className="results-panel">
        <div className="empty">
          <p>Configure a repository and run the automation to see pull requests here.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="results-panel">
        <div className="error-box">
          <span>❌</span>
          <p>{error || "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  const isRunning = status === "running";

  return (
    <div className="results-panel">

      {/* PR Link */}
      <div className="result-section">
        <div className="slabel">Pull Request</div>
        {prUrl ? (
          <a className="pr-link" href={prUrl} target="_blank" rel="noreferrer">
            <span>🔗</span>
            <span className="pr-url">{prUrl}</span>
            <span className="pr-arrow">↗</span>
          </a>
        ) : (
          <div className="loading-row">
            {isRunning && <span className="mini-spinner"></span>}
            <span className="loading-text">
              {isRunning ? "Waiting for pull request..." : "No pull request yet"}
            </span>
          </div>
        )}
      </div>

      {/* AI Review */}
      <div className="result-section">
        <div className="slabel">AI Code Review</div>
        <div className="review-box">
          {review ? (
            <pre className="review-text">{review}</pre>
          ) : (
            <div className="loading-row">
              {isRunning && <span className="mini-spinner"></span>}
              <span className="loading-text">
                {isRunning ? "Waiting for AI review..." : "No review yet"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Code Diff */}
      <div className="result-section">
        <div className="slabel">Code Diff</div>
        <div className="diff-view">
          {diff && diff.length > 0 ? (
            diff.map((line, i) => (
              <div key={i} className={`diff-line ${line.type}`}>
                {line.type === "added" ? "+ " : "- "}{line.text}
              </div>
            ))
          ) : (
            <div className="loading-row">
              {isRunning && <span className="mini-spinner"></span>}
              <span className="loading-text" style={{ color: "#8b949e" }}>
                {isRunning ? "Waiting for code diff..." : "No diff yet"}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default ResultsPanel;