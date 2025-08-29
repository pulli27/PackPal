import React, { useMemo, useState } from "react";
import Sidebar from "../Sidebar/Sidebar"; 
import "./Pdashboard.css";


export default function Pdashboard() {
  // ----- Mock data (replace with API calls) -----
  const [instructions] = useState([
    { bag: "Leather Handbag", details: "Brown leather, gold hardware,…", person: "Maria Santos", deadline: "2025-08-25", priority: "High" },
    { bag: "Canvas Tote", details: "Navy canvas, cotton straps,…", person: "John Chen", deadline: "2025-08-23", priority: "Medium" },
    { bag: "Crossbody Purse", details: "Black synthetic leather, adjustable…", person: "Lisa Rodriguez", deadline: "2025-08-22", priority: "High" },
  ]);

  const [qualityQueue] = useState([
    { bag: "Evening Clutch", person: "Sarah Kim",  status: "Passed" },
    { bag: "Backpack",       person: "Mike Johnson", status: "Failed" },
    { bag: "Wallet",         person: "Anna Park",    status: "Pending Review" },
  ]);

  const [query, setQuery] = useState("");

  // KPIs
  const kpis = useMemo(() => ({
    active: instructions.length,
    passed: qualityQueue.filter(x => x.status === "Passed").length,
    failed: qualityQueue.filter(x => x.status === "Failed").length,
    ready:  qualityQueue.filter(x => x.status === "Passed").length,
  }), [instructions, qualityQueue]);

  // Filtered rows
  const { instFiltered, queueFiltered } = useMemo(() => {
    const q = query.trim().toLowerCase();
    return {
      instFiltered: instructions.filter(x =>
        x.bag.toLowerCase().includes(q) || x.person.toLowerCase().includes(q)
      ),
      queueFiltered: qualityQueue.filter(x =>
        x.bag.toLowerCase().includes(q) || x.person.toLowerCase().includes(q)
      ),
    };
  }, [query, instructions, qualityQueue]);

  // CSV export
  const downloadCSV = () => {
    const header1 = ["Bag","Person","Deadline","Priority"];
    const rows1 = instructions.map(i => [i.bag, i.person, i.deadline, i.priority]);

    const header2 = ["Bag","Person","Status"];
    const rows2 = qualityQueue.map(r => [r.bag, r.person, r.status]);

    const toCSV = (rows) =>
      rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");

    const csv =
`Sewing Instructions
${toCSV([header1, ...rows1])}

Quality Queue
${toCSV([header2, ...rows2])}
`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "production_report.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const BadgePriority = ({ p }) => {
    const cls = p === "High" ? "high" : p === "Medium" ? "medium" : "";
    return <span className={`badge ${cls}`}>{p}</span>;
  };
  const BadgeStatus = ({ s }) => {
    const map = { "Passed":"passed", "Failed":"failed", "Pending Review":"pending" };
    return <span className={`badge ${map[s] || ""}`}>{s}</span>;
  };

  return (
    <div>
      
<Sidebar/>
      <header className="topbar">
        <h1 className="title">Dashboard</h1>

        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={downloadCSV}>
            <span className="icon">📄</span> Generate Report
          </button>
          <button className="avatar" title="Profile">👤</button>
        </div>
      </header>

      <main className="container">
        {/* KPIs */}
        <section className="kpi-grid">
          <article className="kpi">
            <div className="kpi-icon clock">🕒</div>
            <div className="kpi-body">
              <p className="kpi-title">Active Instructions</p>
              <p className="kpi-value" id="kpiActive">{kpis.active}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon passed">✅</div>
            <div className="kpi-body">
              <p className="kpi-title">Quality Passed</p>
              <p className="kpi-value" id="kpiPassed">{kpis.passed}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon failed">❌</div>
            <div className="kpi-body">
              <p className="kpi-title">Quality Failed</p>
              <p className="kpi-value" id="kpiFailed">{kpis.failed}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon inventory">📦</div>
            <div className="kpi-body">
              <p className="kpi-title">Ready for Inventory</p>
              <p className="kpi-value" id="kpiReady">{kpis.ready}</p>
            </div>
          </article>
        </section>

        {/* Toolbar */}
        <section className="toolbar card">
          <p className="muted">
            Welcome back! Track production, run quality checks, and export reports.
          </p>

          <div className="toolbar-right">
            <div className="search">
              <span className="icon">🔎</span>
              <input
                type="search"
                placeholder="Search by bag or person…"
                aria-label="Search by bag or person"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button className="btn btn-ghost" onClick={() => alert("Manage Instructions")}>
              ✂️ <span className="hide-sm">Manage Instructions</span>
            </button>

            <button className="btn btn-ghost" onClick={() => alert("Quality Queue")}>
              🧪 <span className="hide-sm">Quality Queue</span>
            </button>

            <button className="btn btn-primary" onClick={() => alert("Add Instruction")}>
              ➕ Add Instruction
            </button>
          </div>
        </section>

        <section className="grid-2">
          {/* Sewing Instructions */}
          <article className="card">
            <header className="card-header">
              <h2>Sewing Instructions (Top 5)</h2>
              <span className="muted">{instructions.length} total</span>
            </header>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bag</th>
                    <th>Person</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {instFiltered.map((row) => (
                    <tr key={row.bag}>
                      <td>
                        <p className="bag-title">{row.bag}</p>
                        <p className="bag-sub">{row.details}</p>
                      </td>
                      <td>{row.person}</td>
                      <td className="nowrap">{row.deadline}</td>
                      <td><BadgePriority p={row.priority} /></td>
                      <td>
                        <button className="link" onClick={() => alert(`Open Instruction: ${row.bag}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Quality Queue */}
          <article className="card">
            <header className="card-header">
              <h2>Quality Queue</h2>
              <span className="muted">{qualityQueue.length} total</span>
            </header>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bag</th>
                    <th>Person</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {queueFiltered.map((row) => (
                    <tr key={row.bag}>
                      <td>{row.bag}</td>
                      <td>{row.person}</td>
                      <td><BadgeStatus s={row.status} /></td>
                      <td>
                        <button className="link" onClick={() => alert(`Open Quality Review: ${row.bag}`)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
