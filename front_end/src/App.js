import { useState, useEffect } from "react";
import "./styles/autopR.css";

const steps = [
  "Fetch Issues",
  "Analyze Repository",
  "Generate Code Fix",
  "Create Branch",
  "Commit Fix",
  "Open Pull Request"
];

function App() {

  const [running,setRunning] = useState(false);
  const [step,setStep] = useState(-1);

  const [dark,setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  /* ---------- PIPELINE ---------- */

  function startPipeline(){

    if(running) return;

    setRunning(true);
    setStep(0);

    steps.forEach((_,i)=>{
      setTimeout(()=>{
        setStep(i);
        if(i === steps.length-1) setRunning(false);
      }, i*1200);
    });

  }


  /* ---------- THEME TOGGLE ---------- */

  function toggleTheme(){

    const newTheme = !dark;

    setDark(newTheme);

    if(newTheme){
      document.body.classList.add("dark");
      localStorage.setItem("theme","dark");
    }else{
      document.body.classList.remove("dark");
      localStorage.setItem("theme","light");
    }

  }

  /* apply theme on reload */

  useEffect(() => {
    if(dark){
      document.body.classList.add("dark");
    }
  }, []);



  return (

    <div className="wrap">

      {/* TOP BAR */}

      <div className="topbar">

        <div className="topbar-left">
          <div className="brand-icon"></div>
          <span className="brand-name">Bug2PR</span>
        </div>

        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? "☀️" : "🌙"}
        </button>

      </div>


      {/* HERO */}

      <div className="hero">

        <div className="hero-tag">
          AUTONOMOUS DEVELOPMENT SYSTEM
        </div>

        <h1>
          From <span>issue</span> to pull request,
          <br/>
          fully automated
        </h1>

        <p>
          AI agents interpret, analyze, generate and review code —
          then open a pull request on GitHub automatically.
        </p>

      </div>


      {/* MAIN DASHBOARD */}

      <div className="dashboard container">


        {/* REPOSITORY CONFIG */}

        <div className="config-card">

          <div className="config-card-top">
            Repository Configuration
          </div>

          <div className="config-card-body">

            <div className="field-row">

              <div className="field">
                <label>Owner</label>
                <input placeholder="octocat"/>
              </div>

              <div className="field">
                <label>Repository</label>
                <input placeholder="hello-world"/>
              </div>

            </div>

            <div className="field">
              <label>Issue Number (optional)</label>
              <input placeholder="Leave blank for all issues"/>
            </div>

            <button className="run-btn" onClick={startPipeline}>
              {running ? "Running..." : "Run Automation"}
            </button>

          </div>

        </div>



        {/* PIPELINE */}

        <div className="pipeline-card">

          <h3>Automation Pipeline</h3>

          <div className="pipeline-steps">

            {steps.map((s,i)=>{

              let status="pending";

              if(i < step) status="done";
              if(i === step) status="running";

              const icons = ["📥","🧠","⚡","🌿","💾","🚀"];

              return(

                <div key={i} className={`pipe-step ${status}`}>

                  <div className="pipe-icon">
                    {icons[i]}
                  </div>

                  <span className="pipe-text">{s}</span>

                </div>

              );

            })}

          </div>

        </div>

      </div>



      {/* AI REVIEW + DIFF */}

      <div className="analysis-section container">

        <div className="review-panel">

          <h3>AI Code Review</h3>

          <div className="review-item">
            <span className="review-tag bug">BUG</span>
            Missing divide by zero check
          </div>

          <div className="review-item">
            <span className="review-tag improvement">IMPROVEMENT</span>
            Add input validation
          </div>

          <div className="review-item">
            <span className="review-tag pass">VERDICT</span>
            Changes look safe to merge
          </div>

        </div>


        <div className="diff-panel">

          <h3>Code Diff</h3>

          <div className="diff-view">

            <div className="diff-line removed">
              - function divide(a,b) &#123; return a/b; &#125;
            </div>

            <div className="diff-line added">
              + function divide(a,b) &#123;
            </div>

            <div className="diff-line added">
              + if(b === 0) throw new Error("Cannot divide by zero");
            </div>

            <div className="diff-line added">
              + return a/b;
            </div>

            <div className="diff-line added">
              + &#125;
            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default App;