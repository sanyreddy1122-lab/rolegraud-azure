import { useMemo, useState } from "react";
import { ShieldCheck, Sparkles, Copy, Download, AlertTriangle, CheckCircle2, LockKeyhole, Github, ExternalLink } from "lucide-react";
import { scenarios } from "./data/scenarios";
import { analyzeScenario } from "./engine/analyzer";
import PermissionTable from "./components/PermissionTable";
import Metric from "./components/Metric";

function App() {
  const [selectedId, setSelectedId] = useState("backup");
  const [task, setTask] = useState(scenarios[0].task);
  const [generated, setGenerated] = useState(true);
  const [copied, setCopied] = useState(false);

  const scenario = useMemo(
    () => scenarios.find(s => s.id === selectedId) ?? scenarios[0],
    [selectedId]
  );

  const analysis = useMemo(() => analyzeScenario(scenario), [scenario]);

  function chooseScenario(id: string) {
    const next = scenarios.find(s => s.id === id) ?? scenarios[0];
    setSelectedId(next.id);
    setTask(next.task);
    setGenerated(false);
    setCopied(false);
  }

  function generate() {
    setGenerated(true);
    setCopied(false);
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(analysis.role, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(analysis.role, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.id}-role.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const savings = Math.max(0, scenario.permissions.length - analysis.permissionCount);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <div className="brand-name">RoleGuard</div>
            <div className="brand-tag">Azure least-privilege role builder</div>
          </div>
        </div>
        <div className="top-actions">
          <a href="https://learn.microsoft.com/azure/role-based-access-control/custom-roles" target="_blank" rel="noreferrer">
            Azure RBAC docs <ExternalLink size={14} />
          </a>
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            <Github size={17} /> GitHub
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> HACKATHON MVP</div>
            <h1>From operational task to a <span>minimal Azure role.</span></h1>
            <p>
              Describe what an operator needs to do. RoleGuard maps the scenario to
              specific permissions, separates control-plane and data-plane access,
              flags broad permissions, and exports an Azure custom-role definition.
            </p>
          </div>
          <div className="hero-card">
            <div className="hero-card-title"><LockKeyhole size={17} /> Security boundary</div>
            <div className="hero-card-value">Least privilege</div>
            <div className="hero-card-note">Explain every permission before deployment.</div>
          </div>
        </section>

        <section className="workspace">
          <aside className="sidebar panel">
            <div className="panel-title">Demo scenarios</div>
            <div className="scenario-list">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  className={`scenario ${selectedId === s.id ? "active" : ""}`}
                  onClick={() => chooseScenario(s.id)}
                >
                  <span className="scenario-dot" />
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.scope} scope</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="sidebar-tip">
              <AlertTriangle size={16} />
              <span>Demo data is intentionally conservative. Validate exact permissions against Microsoft's current RBAC permission catalog before production use.</span>
            </div>
          </aside>

          <section className="content">
            <div className="panel task-panel">
              <div className="section-heading">
                <div>
                  <div className="kicker">01 · DESCRIBE</div>
                  <h2>What should this operator be able to do?</h2>
                </div>
                <span className="live-pill"><span /> Local engine</span>
              </div>
              <textarea
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Example: allow backup and restore but not deletion..."
              />
              <div className="task-footer">
                <span>Natural-language input → deterministic demo mapping</span>
                <button className="primary" onClick={generate}><Sparkles size={17} /> Generate role</button>
              </div>
            </div>

            {generated && (
              <>
                <div className="metrics">
                  <Metric label="Required control actions" value={analysis.actions.length} tone="good" sub="Management plane" />
                  <Metric label="Data actions" value={analysis.dataActions.length} tone={analysis.dataActions.length ? "warn" : "good"} sub="Data plane" />
                  <Metric label="Excluded actions" value={analysis.notActions.length + analysis.notDataActions.length} tone="neutral" sub="Explicit boundary" />
                  <Metric label="Risk score" value={`${analysis.riskScore}/100`} tone={analysis.riskScore >= 50 ? "danger" : analysis.riskScore >= 25 ? "warn" : "good"} sub="Heuristic for demo" />
                </div>

                <div className="grid-two">
                  <div className="panel">
                    <div className="section-heading compact">
                      <div>
                        <div className="kicker">02 · ANALYZE</div>
                        <h2>Permission boundary</h2>
                      </div>
                      <span className="count-pill">{analysis.permissionCount} required</span>
                    </div>
                    <PermissionTable permissions={scenario.permissions} />
                  </div>

                  <div className="panel">
                    <div className="section-heading compact">
                      <div>
                        <div className="kicker">03 · FINDINGS</div>
                        <h2>Security review</h2>
                      </div>
                    </div>
                    <div className="findings">
                      {analysis.findings.map((f, i) => (
                        <div className={`finding ${f.severity}`} key={i}>
                          <div className="finding-icon">
                            {f.severity === "high" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                          </div>
                          <div>
                            <strong>{f.title}</strong>
                            <p>{f.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="scope-box">
                      <div>
                        <span className="kicker">RECOMMENDED SCOPE</span>
                        <strong>{scenario.scope}</strong>
                      </div>
                      <span className="scope-badge">{scenario.scope === "Resource" ? "Narrowest demo scope" : "Scoped access"}</span>
                    </div>

                    <div className="broad-box">
                      <div className="kicker">BROAD PERMISSIONS TO REVIEW</div>
                      {scenario.broadPermissions.map(p => <code key={p}>{p}</code>)}
                    </div>
                  </div>
                </div>

                <div className="panel json-panel">
                  <div className="section-heading compact">
                    <div>
                      <div className="kicker">04 · EXPORT</div>
                      <h2>Azure custom-role definition</h2>
                    </div>
                    <div className="button-row">
                      <button className="secondary" onClick={copyJson}><Copy size={16} /> {copied ? "Copied" : "Copy JSON"}</button>
                      <button className="secondary" onClick={downloadJson}><Download size={16} /> Download</button>
                    </div>
                  </div>
                  <pre><code>{JSON.stringify(analysis.role, null, 2)}</code></pre>
                  <div className="json-note">
                    <ShieldCheck size={16} />
                    <span>Use this as a starting point. Verify operation names, scope, and required data-plane access against your exact Azure workload before assigning the role.</span>
                  </div>
                </div>

                <div className="panel next-panel">
                  <div>
                    <div className="kicker">NEXT STEP FOR THE HACKATHON</div>
                    <h2>Connect this UI to Azure</h2>
                    <p>Add an Azure Function that receives the task, queries a curated permission catalog, and optionally creates the custom role through Azure RBAC APIs/CLI after explicit confirmation.</p>
                  </div>
                  <div className="architecture">
                    <span>UI</span><b>→</b><span>Function</span><b>→</b><span>Permission catalog</span><b>→</b><span>RBAC JSON</span>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      </main>

      <footer>
        <span>RoleGuard · Hackathon starter</span>
        <span>Built with React + TypeScript + Vite · Deployable to Azure Static Web Apps</span>
      </footer>
    </div>
  );
}

export default App;