import React, { useMemo, useState, useRef } from "react";
import "./Pdashboard.css";
import Sidebar from "../Sidebar/Sidebar";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export default function Pdashboard() {
  // ----- Mock data -----
  const initialInstructions = [
    {
      id: uid(),
      bag: "Leather Handbag",
      details: "Brown leather, gold hardware,…",
      person: "Maria Santos",
      deadline: "2025-08-25",
      priority: "High",
    },
    {
      id: uid(),
      bag: "Canvas Tote",
      details: "Navy canvas, cotton straps,…",
      person: "John Chen",
      deadline: "2025-08-23",
      priority: "Medium",
    },
    {
      id: uid(),
      bag: "Crossbody Purse",
      details: "Black synthetic leather, adjustable…",
      person: "Lisa Rodriguez",
      deadline: "2025-08-22",
      priority: "High",
    },
  ];

  const initialQueue = [
    { id: uid(), bag: "Evening Clutch", person: "Sarah Kim", status: "Passed" },
    { id: uid(), bag: "Backpack", person: "Mike Johnson", status: "Failed" },
    { id: uid(), bag: "Wallet", person: "Anna Park", status: "Pending Review" },
  ];

  const [instructions, setInstructions] = useState(initialInstructions);
  const [qualityQueue] = useState(initialQueue);
  const [query, setQuery] = useState("");

  // ----- Form state -----
  const [fBag, setFBag] = useState("");
  const [fPerson, setFPerson] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [fPriority, setFPriority] = useState("High");
  const [fDetails, setFDetails] = useState("");

  // Dialog
  const dialogRef = useRef(null);
  const openAdd = () => {
    setFBag("");
    setFPerson("");
    setFDeadline("");
    setFPriority("High");
    setFDetails("");
    dialogRef.current?.showModal?.();
  };
  const closeModal = () => dialogRef.current?.close?.();

  // ----- Derived -----
  const filteredInst = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return instructions;
    return instructions.filter(
      (x) => x.bag.toLowerCase().includes(q) || x.person.toLowerCase().includes(q)
    );
  }, [instructions, query]);

  const filteredQueue = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return qualityQueue;
    return qualityQueue.filter(
      (x) => x.bag.toLowerCase().includes(q) || x.person.toLowerCase().includes(q)
    );
  }, [qualityQueue, query]);

  const kpi = useMemo(() => {
    const passed = qualityQueue.filter((x) => x.status === "Passed").length;
    const failed = qualityQueue.filter((x) => x.status === "Failed").length;
    return { active: instructions.length, passed, failed, ready: passed };
  }, [instructions, qualityQueue]);

  // ----- Helpers -----
  const badgePriority = (p) => {
    const cls = p === "High" ? "high" : p === "Medium" ? "medium" : "low";
    return <span className={`badge ${cls}`}>{p}</span>;
  };

  const badgeStatus = (s) => {
    const map = { Passed: "passed", Failed: "failed", "Pending Review": "pending" };
    return <span className={`badge ${map[s] || ""}`}>{s}</span>;
  };

  const onGenerateReport = () => {
    const header1 = ["Bag", "Person", "Deadline", "Priority", "Details"];
    const rows1 = instructions.map((i) => [
      i.bag,
      i.person,
      i.deadline,
      i.priority,
      i.details || "",
    ]);

    const header2 = ["Bag", "Person", "Status"];
    const rows2 = qualityQueue.map((q) => [q.bag, q.person, q.status]);

    const toCSV = (rows) =>
      rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");

    const csv =
      `Sewing Instructions\n${toCSV([header1, ...rows1])}\n\n` +
      `Quality Queue\n${toCSV([header2, ...rows2])}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard_report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!fBag || !fPerson || !fDeadline) return;

    const newItem = {
      id: uid(),
      bag: fBag,
      details: fDetails,
      person: fPerson,
      deadline: fDeadline,
      priority: fPriority,
    };
    setInstructions((prev) => [newItem, ...prev]);
    closeModal();
  };

  return (
    <div className="pd">
      <Sidebar />

      <header className="topbar">
        <h1 className="title">Dashboard</h1>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={onGenerateReport}>
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
              <p className="kpi-value">{kpi.active}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon passed">✅</div>
            <div className="kpi-body">
              <p className="kpi-title">Quality Passed</p>
              <p className="kpi-value">{kpi.passed}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon failed">❌</div>
            <div className="kpi-body">
              <p className="kpi-title">Quality Failed</p>
              <p className="kpi-value">{kpi.failed}</p>
            </div>
          </article>

          <article className="kpi">
            <div className="kpi-icon inventory">📦</div>
            <div className="kpi-body">
              <p className="kpi-title">Ready for Inventory</p>
              <p className="kpi-value">{kpi.ready}</p>
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

            <button className="btn btn-ghost" onClick={() => alert("Go to Manage Instructions")}>
              ✂️ <span className="hide-sm">Manage Instructions</span>
            </button>

            <button className="btn btn-ghost" onClick={() => alert("Go to Quality Queue")}>
              🧪 <span className="hide-sm">Quality Queue</span>
            </button>

            <button className="btn btn-primary" onClick={openAdd}>
              ➕ Add Instruction
            </button>
          </div>
        </section>

        {/* Tables */}
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
                  {filteredInst.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="bag-title">{row.bag}</p>
                        <p className="bag-sub">{row.details || ""}</p>
                      </td>
                      <td>{row.person}</td>
                      <td className="nowrap">{row.deadline}</td>
                      <td>{badgePriority(row.priority)}</td>
                      <td>
                        <button
                          className="link"
                          onClick={() => alert(`Open Instruction: ${row.bag}`)}
                        >
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
                  {filteredQueue.map((row) => (
                    <tr key={row.id}>
                      <td>{row.bag}</td>
                      <td>{row.person}</td>
                      <td>{badgeStatus(row.status)}</td>
                      <td>
                        <button
                          className="link"
                          onClick={() => alert(`Open Quality Review: ${row.bag}`)}
                        >
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

      {/* Modal */}
      <dialog ref={dialogRef} className="modal" onClose={closeModal}>
        <form className="modal-card" onSubmit={onSubmit} method="dialog">
          <h3 id="formTitle">Add Instruction</h3>

          <div className="grid">
            <label>
              Bag
              <input value={fBag} onChange={(e) => setFBag(e.target.value)} required />
            </label>

            <label>
              Person
              <input value={fPerson} onChange={(e) => setFPerson(e.target.value)} required />
            </label>

            <label>
              Deadline
              <input
                type="date"
                value={fDeadline}
                onChange={(e) => setFDeadline(e.target.value)}
                required
              />
            </label>

            <label>
              Priority
              <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} required>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>

            <label className="span-2">
              Details
              <textarea
                rows={3}
                placeholder="materials, size, notes"
                value={fDetails}
                onChange={(e) => setFDetails(e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
