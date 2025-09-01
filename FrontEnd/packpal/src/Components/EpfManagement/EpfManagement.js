import React, { useEffect, useMemo, useState } from "react";
import "./EpfManagement.css";
import Sidebar from "../Sidebar/Sidebar";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

/** Money helpers */
const fmtMoney = (n) =>
  "LKR " + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

/* --- Simple toast helper --- */
const showNotification = (message, type = "info") => {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const colors = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };
  const n = document.createElement("div");
  n.className = "notification";
  n.style.cssText = `
    position:fixed; top:20px; right:20px; background:#fff; color:${colors[type]};
    padding:15px 20px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.15);
    border-left:4px solid ${colors[type]}; z-index:10000; display:flex; align-items:center; gap:10px;
    max-width:420px; animation:epf-slideIn .3s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  `;
  n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  if (!document.querySelector("#epf-toast-anim")) {
    const style = document.createElement("style");
    style.id = "epf-toast-anim";
    style.textContent = `
      @keyframes epf-slideIn { from { transform:translateX(100%); opacity:0; } to{ transform:translateX(0); opacity:1; } }
      @keyframes epf-slideOut { from { transform:translateX(0); opacity:1; } to{ transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = "epf-slideOut .3s ease";
    setTimeout(() => n.remove(), 300);
  }, 3000);
};

/** Seed rows */
const initialRows = [
  { periodLabel: "December 2024",  periodKey: "Dec 2024", epf: 12450, etf: 4670, total: 17120, due: "Jan 18, 2025", status: "Pending" },
  { periodLabel: "November 2024",  periodKey: "Nov 2024", epf: 11850, etf: 4440, total: 16290, due: "Dec 15, 2024", status: "Paid" },
  { periodLabel: "October 2024",   periodKey: "Oct 2024", epf: 11200, etf: 4200, total: 15400, due: "Nov 15, 2024", status: "Paid" },
  { periodLabel: "September 2024", periodKey: "Sep 2024", epf: 10950, etf: 4100, total: 15050, due: "Oct 15, 2024", status: "Paid" },
  { periodLabel: "January 2025",   periodKey: "Jan 2025", epf: 13200, etf: 4950, total: 18150, due: "Feb 15, 2025", status: "Upcoming" },
];

export default function EpfManagement() {
  const [rows, setRows] = useState(initialRows);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);

  // New payment form state
  const [npPeriod, setNpPeriod] = useState("2025-02");
  const [npBase, setNpBase] = useState("");
  const [npEpf, setNpEpf] = useState(8);
  const [npEtf, setNpEtf] = useState(3);

  const navigate = useNavigate();

  // Welcome toast
  useEffect(() => {
    const t = setTimeout(() => {
      showNotification(
        "Welcome to EPF/ETF Management! Track, pay, and export your contributions.",
        "success"
      );
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const headerAlertText = useMemo(
    () =>
      "EPF contributions for December 2024 are due in 3 days (January 18, 2025). Total amount due: LKR 17,120",
    []
  );

  const openPayModal = (row) => {
    setPayTarget(row);
    setShowPayModal(true);
  };

  const confirmPayment = () => {
    if (!payTarget) return;
    setRows((old) =>
      old.map((r) => (r.periodKey === payTarget.periodKey ? { ...r, status: "Paid" } : r))
    );
    setShowPayModal(false);
    showNotification(`Payment recorded for ${payTarget.periodLabel}.`, "success");
    setPayTarget(null);
  };

  const bulkPay = () => {
    if (!window.confirm("Pay ALL outstanding (Pending) items?")) return;
    setRows((old) => old.map((r) => (r.status === "Pending" ? { ...r, status: "Paid" } : r)));
    showNotification("All pending items marked as Paid.", "success");
  };

  const viewDetails = (row) => {
    const { periodLabel, epf, etf, total, due, status } = row;
    window.alert(
      `Details for ${periodLabel}\n\nEPF: ${fmtMoney(epf)}\nETF: ${fmtMoney(etf)}\nTotal: ${fmtMoney(
        total
      )}\nDue: ${due}\nStatus: ${status}`
    );
  };

  const addNewPayment = () => {
    if (!npPeriod) return;
    const d = new Date(`${npPeriod}-01`);
    const periodLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const periodKey = d.toLocaleString("en-US", { month: "short", year: "numeric" });

    const base = parseFloat(npBase) || 0;
    const epf = base * (parseFloat(npEpf) / 100 || 0);
    const etf = base * (parseFloat(npEtf) / 100 || 0);
    const total = epf + etf;

    // Assume due on the 15th of next month
    const due = `${d.toLocaleString("en-US", { month: "short" })} 15, ${d.getFullYear()}`;

    const newRow = { periodLabel, periodKey, epf, etf, total, due, status: "Pending" };

    setRows((old) => [newRow, ...old]);
    setShowNewModal(false);
    setNpBase("");
    showNotification(`Added ${periodLabel}: ${fmtMoney(total)}`, "success");
  };

  return (
    <div className="epf">
      <Sidebar />

      <div className="container">
        {/* Header */}
        <div className="content-header epf-header">
          <h1> EPF/ETF Management</h1>
          <p>Manage Employee Provident Fund and Employee Trust Fund contributions</p>
          <div className="header-actions">
            <button className="btn btn-pay cta-new" onClick={() => setShowNewModal(true)}>
              + New Payment
            </button>
          </div>
        </div>

        {/* Alert */}
        <div className="alert alert-warning">
          <div className="alert-icon">⚠️</div>
          <div>
            <strong>Action Required:</strong> {headerAlertText}
          </div>
        </div>

        {/* KPI cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div
                className="stat-icon"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                🏦
              </div>
              <div className="stat-info">
                <h3>EPF Contributions (8%)</h3>
                <p>Employee Provident Fund</p>
              </div>
            </div>
            <div className="stat-value">LKR124,500</div>
            <div className="stat-details">
              <span className="neutral">December 2024</span>
              <span className="stat-change positive">↗ +5.2%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div
                className="stat-icon"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                🏛️
              </div>
              <div className="stat-info">
                <h3>ETF Contributions (3%)</h3>
                <p>Employee Trust Fund</p>
              </div>
            </div>
            <div className="stat-value">LKR46,700</div>
            <div className="stat-details">
              <span className="neutral">December 2024</span>
              <span className="stat-change positive">↗ +3.8%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div
                className="stat-icon"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                📊
              </div>
              <div className="stat-info">
                <h3>Total Annual (2024)</h3>
                <p>Combined EPF & ETF</p>
              </div>
            </div>
            <div className="stat-value">LKR205,440</div>
            <div className="stat-details">
              <span className="neutral">January - December</span>
              <span className="stat-change positive">↗ +7.1%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div
                className="stat-icon"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                ⏰
              </div>
              <div className="stat-info">
                <h3>Pending Payments</h3>
                <p>Requires attention</p>
              </div>
            </div>
            <div className="stat-value">
              {rows.filter((r) => r.status === "Pending").length}
            </div>
            <div className="stat-details">
              <span className="neutral">Outstanding</span>
              <span className="stat-change negative">Due soon</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="main-content">
          <div className="contributions-table">
            <div className="table-header">
              <div className="table-header-icon">📋</div>
              Contribution History &amp; Payments
            </div>
            <div className="table-content">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>EPF Amount</th>
                    <th>ETF Amount</th>
                    <th>Total</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.periodKey}>
                      <td>
                        <strong>{r.periodLabel}</strong>
                      </td>
                      <td>{fmtMoney(r.epf)}</td>
                      <td>{fmtMoney(r.etf)}</td>
                      <td>
                        <strong>{fmtMoney(r.total)}</strong>
                      </td>
                      <td>
                        <span className={`due ${r.status === "Pending" ? "danger" : "warn"}`}>
                          {r.due}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "status-badge " +
                            (r.status === "Paid"
                              ? "status-paid"
                              : r.status === "Pending"
                              ? "status-pending"
                              : "status-overdue")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {r.status === "Pending" ? (
                            <button className="btn btn-pay" onClick={() => openPayModal(r)}>
                              Pay Now
                            </button>
                          ) : null}
                          <button className="btn btn-view" onClick={() => viewDetails(r)}>
                            {r.status === "Upcoming" ? "Preview" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="sidebar-content">
            <div className="quick-actions">
              <h3>Quick Actions</h3>

              <button className="action-btn action-btn-primary" onClick={bulkPay}>
                💳 Pay Outstanding Amount
              </button>

              <button
                className="action-btn action-btn-secondary"
                onClick={() => {
                  const header = ["Period", "EPF Amount", "ETF Amount", "Total", "Due Date", "Status"];
                  const lines = [
                    header.join(","),
                    ...rows.map((r) =>
                      [r.periodLabel, r.epf, r.etf, r.total, r.due, r.status]
                        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                        .join(",")
                    ),
                  ].join("\n");
                  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "epf-etf-annual-report.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showNotification("Annual report generated.", "success");
                }}
              >
                📊 Generate Annual Report
              </button>

              <button
                className="action-btn action-btn-secondary"
                onClick={() => {
                  const header = ["Period", "EPF Amount", "ETF Amount", "Total", "Due Date", "Status"];
                  const lines = [
                    header.join(","),
                    ...rows.map((r) =>
                      [r.periodLabel, r.epf, r.etf, r.total, r.due, r.status]
                        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                        .join(",")
                    ),
                  ].join("\n");
                  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "epf-etf-records.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showNotification("Records downloaded.", "success");
                }}
              >
                📥 Download Records
              </button>

              <button
                className="action-btn action-btn-secondary"
                onClick={() => navigate("/salarycal")} // change to "/finance/employees" if that's your route
              >
                👥 View Employee Details
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && payTarget && (
        <div className="modal active" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Process Payment</div>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>
                &times;
              </button>
            </div>
            <div>
              <p className="mb">You are about to process payment for:</p>
              <div className="summary-box">
                <div className="row">
                  <span>
                    <strong>Period:</strong>
                  </span>
                  <span>{payTarget.periodLabel}</span>
                </div>
                <div className="row">
                  <span>
                    <strong>EPF Amount:</strong>
                  </span>
                  <span>{fmtMoney(payTarget.epf)}</span>
                </div>
                <div className="row">
                  <span>
                    <strong>ETF Amount:</strong>
                  </span>
                  <span>{fmtMoney(payTarget.etf)}</span>
                </div>
                <div className="row total">
                  <span>Total Amount:</span>
                  <span className="ok">{fmtMoney(payTarget.total)}</span>
                </div>
              </div>
              <div className="dual">
                <button className="btn btn-pay big" onClick={confirmPayment}>
                  Confirm Payment
                </button>
                <button className="btn btn-secondary big" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {showNewModal && (
        <div className="modal active" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Add New Payment</div>
              <button className="close-btn" onClick={() => setShowNewModal(false)}>
                &times;
              </button>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <input
                  type="month"
                  className="form-input"
                  value={npPeriod}
                  onChange={(e) => setNpPeriod(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Salary Base</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter total salary amount"
                  value={npBase}
                  onChange={(e) => setNpBase(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">EPF Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={npEpf}
                  step="0.1"
                  onChange={(e) => setNpEpf(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ETF Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={npEtf}
                  step="0.1"
                  onChange={(e) => setNpEtf(e.target.value)}
                />
              </div>
              <div className="dual mt">
                <button className="btn btn-pay big" onClick={addNewPayment}>
                  Add Payment
                </button>
                <button className="btn btn-secondary big" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
