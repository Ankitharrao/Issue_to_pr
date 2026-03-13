function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-left">

        <div className="logo"></div>

        <span className="brand">AutoPR</span>

        <span className="ver">v2.0</span>

      </div>

      <div className="topbar-right">
        <div className="pill">
          <span className="blink"></span> Idle
        </div>
      </div>
    </div>
  );
}

export default TopBar;