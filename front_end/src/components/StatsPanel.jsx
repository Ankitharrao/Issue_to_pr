function StatsPanel({ stats }) {
  return (
    <div className="stats-row">
      <div className="stat stat-0">
        <div className="stat-n">{stats.runs}</div>
        <div className="stat-l">Total Runs</div>
      </div>
      <div className="stat stat-1">
        <div className="stat-n">{stats.prs}</div>
        <div className="stat-l">PRs Created</div>
      </div>
      <div className="stat stat-2">
        <div className="stat-n">{stats.failed}</div>
        <div className="stat-l">Failed</div>
      </div>
    </div>
  );
}
 
export default StatsPanel;
 