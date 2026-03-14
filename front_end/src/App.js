import { useState, useRef } from "react";
import TopBar from "./components/TopBar";
import RepoConfig from "./components/RepoConfig";
import PipelineSteps from "./components/PipelineSteps";
import ResultsPanel from "./components/ResultsPanel";
import StatsPanel from "./components/StatsPanel";
import "./App.css";
import "./styles/autoRn.css";
function App() {
  // ── shared state ──
  const [status, setStatus]       = useState("idle");    // idle | running | done | error
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepMsgs, setStepMsgs]   = useState({});
  const [prUrl, setPrUrl]         = useState("");
  const [review, setReview]       = useState("");
  const [diff, setDiff]           = useState([]);
  const [error, setError]         = useState("");
  const [stats, setStats]         = useState({ runs: 0, prs: 0, failed: 0 });

  const readerRef = useRef(null);

  // ── map log messages to step index ──
  function msgToStep(data) {
    if (data.step === 1 || data.done === 1) return 0;
    if (data.priority !== undefined)        return 1;
    if (data.step === 2 || data.done === 2) return 1;
    if (data.step === 3 || data.done === 3) return 2;
    if (data.step === 4 || data.done === 4) return 3;
    if (data.step === 5 || data.done === 5) return 4;
    if (data.step === 6 || data.done === 6) return 5;
    if (data.prUrl)                         return 6;
    return -1;
  }

  // ── run pipeline ──
  async function handleRun(owner, repo, issueNum) {
    if (status === "running") return;

    // reset
    setStatus("running");
    setStepIndex(0);
    setStepMsgs({});
    setPrUrl("");
    setReview("");
    setDiff([]);
    setError("");
    setStats(s => ({ ...s, runs: s.runs + 1 }));

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: `${owner}/${repo}`,
          issueNumber: issueNum ? parseInt(issueNum) : null,
        }),
      });

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data:"));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace("data:", "").trim());

            const idx = msgToStep(data);
            if (idx >= 0) {
              setStepIndex(idx);
              if (data.msg) {
                setStepMsgs(prev => ({ ...prev, [idx]: data.msg }));
              }
            }

            if (data.prUrl)   { setPrUrl(data.prUrl); }
            if (data.review)  { setReview(data.review); }
            if (data.diff)    { setDiff(data.diff); }

            if (data.complete) {
              setStatus("done");
              setStepIndex(7);
              setStats(s => ({ ...s, prs: s.prs + 1 }));
            }

            if (data.error) {
              setError(data.msg || "Something went wrong");
              setStatus("error");
              setStats(s => ({ ...s, failed: s.failed + 1 }));
            }

          } catch (e) { /* skip malformed */ }
        }
      }
    } catch (err) {
      setError(err.message);
      setStatus("error");
      setStats(s => ({ ...s, failed: s.failed + 1 }));
    }
  }

  function handleStop() {
    if (readerRef.current) readerRef.current.cancel();
    setStatus("idle");
  }

  return (
    <div className="wrap">
      <TopBar status={status} />
      <div className="main container">
        <div className="left-col">
          <StatsPanel stats={stats} />
          <RepoConfig
            status={status}
            onRun={handleRun}
            onStop={handleStop}
          />
          <PipelineSteps
            stepIndex={stepIndex}
            stepMsgs={stepMsgs}
            status={status}
          />
        </div>
        <div className="right-col">
          <ResultsPanel
            status={status}
            prUrl={prUrl}
            review={review}
            diff={diff}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

export default App;