function TopBar({ status }) {

  const statusLabel = {
    idle:    "Idle",
    running: "Running",
    done:    "Done",
    error:   "Error",
  }[status] || "Idle";

  const statusClass = {
    idle:    "pill",
    running: "pill pill-running",
    done:    "pill pill-done",
    error:   "pill pill-error",
  }[status] || "pill";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo"></div>
        <span className="brand">AutoPR</span>
        <span className="ver">v2.0</span>
      </div>
      <div className="topbar-right">
        <div className={statusClass}>
          <span className={status === "running" ? "blink" : "dot"}></span>
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

export default TopBar;