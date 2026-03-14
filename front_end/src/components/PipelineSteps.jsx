const STEPS = [
  { label: "Fetch Issues",       icon: "📥" },
  { label: "Prioritize Issues",  icon: "🧠" },
  { label: "Explore Codebase",   icon: "🔍" },
  { label: "Generate Code Fix",  icon: "⚡" },
  { label: "AI Code Review",     icon: "🔎" },
  { label: "Create Branch",      icon: "🌿" },
  { label: "Open Pull Request",  icon: "🚀" },
];

function PipelineSteps({ stepIndex, stepMsgs, status }) {

  return (
    <div>
      <div className="slabel">Pipeline</div>
      <div className="pipe-card">
        {STEPS.map((step, i) => {

          let state = "pending";
          if (i < stepIndex)  state = "done";
          if (i === stepIndex) state = status === "running" ? "running" : "done";

          return (
            <div key={i} className={`step step-${state}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-body">
                <span className="step-label">{step.label}</span>
                {stepMsgs[i] && (
                  <span className="step-msg">{stepMsgs[i]}</span>
                )}
              </div>
              <div className="step-status">
                {state === "done"    && <span className="check">✓</span>}
                {state === "running" && <span className="spinner"></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineSteps;