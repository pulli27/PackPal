import React, { useEffect, useMemo, useRef, useState } from "react";

import Chart from "chart.js/auto";
import "./FinancialReport.css";
import Sidebar from "../Sidebar/Sidebar"; // keep or remove if you don't use it

function FinancialReport() {
  // ---------- Refs ----------
  const revenueRef = useRef(null);
  const expenseRef = useRef(null);
  const profitRef  = useRef(null);
  const budgetRef  = useRef(null);
  const dateFromRef = useRef(null);
  const dateToRef   = useRef(null);


  // ---------- State ----------
  const [reportType, setReportType] = useState("All Reports");
  const [department, setDepartment] = useState("All Departments");
  const [generating, setGenerating] = useState(false);
  const [rows, setRows] = useState(() => [
    { name: "Q3 Income Statement",   type: "Income Statement", generated: "2024-08-28", period: "Q3 2024",    status: "Completed" },
    { name: "August Cash Flow",      type: "Cash Flow",        generated: "2024-08-25", period: "August 2024",status: "Completed" },
    { name: "Budget Analysis Report",type: "Budget Analysis",  generated: "2024-08-20", period: "YTD 2024",   status: "Processing" },
    { name: "Monthly Balance Sheet", type: "Balance Sheet",    generated: "2024-08-15", period: "July 2024",  status: "Completed" },
    { name: "Quarterly Tax Report",  type: "Tax Report",       generated: "2024-08-10", period: "Q2 2024",    status: "Pending" },
  ]);

  // ---------- Utils ----------
  const fmtDate = (d) => new Date(d).toISOString().split("T")[0];

  const showNotification = (message, type = "info") => {
    document.querySelectorAll(".notification").forEach((n) => n.remove());
    const colors = { success:"#10B981", error:"#EF4444", warning:"#F59E0B", info:"#3B82F6" };
    const icons  = { success:"fa-check-circle", error:"fa-exclamation-circle", warning:"fa-exclamation-triangle", info:"fa-info-circle" };
    const n = document.createElement("div");
    n.className = "notification";
    n.style.cssText = `
      position:fixed; top:20px; right:20px; background:#fff; color:${colors[type]};
      padding:15px 20px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.15);
      border-left:4px solid ${colors[type]}; z-index:10000; display:flex; align-items:center; gap:10px;
      max-width:400px; animation:slideIn .3s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    `;
    n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to{ transform:translateX(0); opacity:1; } }
        @keyframes slideOut { from { transform:translateX(0); opacity:1; } to{ transform:translateX(100%); opacity:0; } }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(n);
    setTimeout(() => { n.style.animation = "slideOut .3s ease"; setTimeout(() => n.remove(), 300); }, 3000);
  };

  // ---------- Default dates on mount ----------
  useEffect(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    if (dateFromRef.current) dateFromRef.current.valueAsDate = first;
    if (dateToRef.current) dateToRef.current.valueAsDate = today;
    setTimeout(() => showNotification("Welcome to Financial Reports! Generate and download your reports here.", "success"), 400);
  }, []);

  // ---------- Charts ----------
  const charts = useRef({});

  useEffect(() => {
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = "#374151";

    // clean previous
    Object.values(charts.current).forEach((c) => c?.destroy());
    charts.current = {};

    if (revenueRef.current) {
      charts.current.revenue = new Chart(revenueRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
          datasets: [{
            label: "Revenue",
            data: [65000,72000,68000,85000,91000,88000,95000,102000],
            borderColor: "#667eea",
            backgroundColor: "rgba(102,126,234,0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => "$" + v/1000 + "K" } } }
        }
      });
    }

    if (expenseRef.current) {
      charts.current.expense = new Chart(expenseRef.current.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Salaries","Marketing","Operations","Technology","Other"],
          datasets: [{
            data: [35000,12000,8000,5000,2000],
            backgroundColor: ["#8B5CF6","#06D6A0","#FFB703","#FB8500","#8ECAE6"],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, font: { size: 10 } } } }
        }
      });
    }

    if (profitRef.current) {
      charts.current.profit = new Chart(profitRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Jan","Feb","Mar","Apr","May","Jun"],
          datasets: [{ label: "Profit Margin %", data: [35.4,36.1,38.2,37.8,36.5,36.8], backgroundColor: "#10B981", borderRadius: 6 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + "%" } } }
        }
      });
    }

    if (budgetRef.current) {
      charts.current.budget = new Chart(budgetRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Sales","Marketing","Operations","HR","IT"],
          datasets: [
            { label: "Budget", data: [150000,80000,60000,45000,35000], backgroundColor: "#E5E7EB", borderRadius: 4 },
            { label: "Actual", data: [165000,92000,58000,43000,38000], backgroundColor: "#667eea", borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 15, font: { size: 11 } } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => "$" + v/1000 + "K" } } }
        }
      });
    }

    return () => { Object.values(charts.current).forEach((c) => c?.destroy()); };
  }, []);

  // ---------- Report HTML + actions ----------
  const inferType = (name) =>
    /income/i.test(name) ? "Income Statement" :
    /balance/i.test(name) ? "Balance Sheet" :
    /cash/i.test(name)   ? "Cash Flow" :
    /budget/i.test(name) ? "Budget Analysis" : "Report";

  const buildReportHTML = (name, period, generated, type, withChart = true) => {
    const chartBlock = withChart ? `
      <div style="margin-top:20px;"><canvas id="reportChart" style="max-height:280px;"></canvas></div>
      <script>
        (function(){
          const ctx = document.getElementById('reportChart').getContext('2d');
          new Chart(ctx, {
            type: '${type.includes("Budget") ? "bar" : type.includes("Cash") ? "doughnut" : "line"}',
            data: {
              labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
              datasets: [{
                label: '${name}',
                data: [12,14,11,16,18,17,19,21].map(n => n * 1000),
                ${type.includes("Cash")
                  ? "backgroundColor:['#8B5CF6','#06D6A0','#FFB703','#FB8500','#8ECAE6','#10B981','#22D3EE','#F43F5E'], borderWidth:0"
                  : "borderColor:'#667eea', backgroundColor:'rgba(102,126,234,.12)', fill:true, tension:.35, borderWidth:3"}
              }]
            },
            options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:${type.includes("Cash") ? "false":"true"} } } }
          });
        })();
      <\/script>` : "";

    return `<!doctype html>
    <html lang="en"><head>
      <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>${name} – Report</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"><\/script>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7ff;margin:0;padding:24px;color:#111827;}
        .wrap{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.1);padding:24px;}
        .header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px;}
        .title{font-size:20px;font-weight:800;}
        .meta{color:#6b7280;font-size:13px;}
        table{width:100%;border-collapse:collapse;margin-top:10px;}
        th,td{border:1px solid #e5e7eb;padding:10px;font-size:14px;text-align:left;} th{background:#f9fafb;}
        .btn{display:inline-block;margin-top:14px;background:#667eea;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;}
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header">
          <div class="title">${name}</div>
          <div class="meta">Type: ${type} &nbsp;•&nbsp; Generated: ${generated} &nbsp;•&nbsp; Period: ${period}</div>
        </div>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Revenue / Inflow</td><td>$847,000</td></tr>
          <tr><td>Total Expenses / Outflow</td><td>$535,000</td></tr>
          <tr><td>Net</td><td>$312,000</td></tr>
        </table>
        ${chartBlock}
        <a class="btn" href="javascript:window.print()">🖨️ Print</a>
      </div>
    </body></html>`;
  };

  const handleView = (name, periodOverride) => {
    const type = inferType(name);
    const period = periodOverride || `${dateFromRef.current?.value || fmtDate(new Date())} to ${dateToRef.current?.value || fmtDate(new Date())}`;
    const html = buildReportHTML(name, period, fmtDate(new Date()), type, true);
    const w = window.open("", "_blank");
    if (w && !w.closed) { w.document.write(html); w.document.close(); }
    else {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${name.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  };

  const handleDownload = (name, periodOverride) => {
    const type = inferType(name);
    const period = periodOverride || `${dateFromRef.current?.value || fmtDate(new Date())} to ${dateToRef.current?.value || fmtDate(new Date())}`;
    const html = buildReportHTML(name, period, fmtDate(new Date()), type, true);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showNotification(`${name} downloaded successfully!`, "success");
  };

  const handleGenerate = () => {
    setGenerating(true);
    const from = dateFromRef.current?.value || fmtDate(new Date());
    const to   = dateToRef.current?.value   || fmtDate(new Date());
    setTimeout(() => {
      setGenerating(false);
      showNotification(`${reportType} generated successfully for ${from} to ${to}`, "success");
      const reportName = `${reportType} - ${department}`;
      const newRow = { name: reportName, type: reportType, generated: fmtDate(new Date()), period: `${from} to ${to}`, status: "Completed" };
      setRows((r) => [newRow, ...r]);
    }, 800);
  };

  const onLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      showNotification("Logging out...", "info");
      setTimeout(() => { alert("You have been logged out successfully!"); }, 600);
    }
  };

  // ---------- Cards ----------
  const quickCards = useMemo(() => ([
    { title: "Income Statement",   subtitle: "Profit & Loss Analysis",   stats: [{label:"Revenue",value:"$847K"},{label:"Expenses",value:"$535K"},{label:"Net Profit",value:"$312K"}] },
    { title: "Cash Flow Statement",subtitle: "Cash Movement Analysis",    stats: [{label:"Net Flow",value:"+$312K"},{label:"Inflow",value:"$529K"},{label:"Outflow",value:"$217K"}] },
    { title: "Balance Sheet",      subtitle: "Assets & Liabilities",      stats: [{label:"Assets",value:"$1.2M"},{label:"Liabilities",value:"$380K"},{label:"Equity",value:"$820K"}] },
    { title: "Budget Analysis",    subtitle: "Budget vs Actual",          stats: [{label:"Budget",value:"$750K"},{label:"Actual",value:"$847K"},{label:"Variance",value:"+13%"}] },
  ]), []);

  return (
    <div className="financial-report-page">
      <Sidebar />

      <main className="main-content">
        <div className="content-header">
          <h1> Financial Reports</h1>
          <p>Comprehensive financial analysis and reporting</p>
          
        </div>

        {/* Filters */}
        <section className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Report Type</label>
              <select className="filter-input" value={reportType} onChange={(e)=>setReportType(e.target.value)}>
                <option>All Reports</option>
                <option>Income Statement</option>
                <option>Balance Sheet</option>
                <option>Cash Flow</option>
                <option>Budget Analysis</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Date From</label>
              <input type="date" className="filter-input" ref={dateFromRef}/>
            </div>
            <div className="filter-group">
              <label className="filter-label">Date To</label>
              <input type="date" className="filter-input" ref={dateToRef}/>
            </div>
            <div className="filter-group">
              <label className="filter-label">Department</label>
              <select className="filter-input" value={department} onChange={(e)=>setDepartment(e.target.value)}>
                <option>All Departments</option>
                <option>Sales</option>
                <option>Marketing</option>
                <option>Operations</option>
                <option>HR</option>
              </select>
            </div>
            <div className="filter-group">
              <button className="generate-btn" onClick={handleGenerate} disabled={generating}>
                {generating ? (<><i className="fas fa-spinner fa-spin"/> Generating...</>) : (<><i className="fas fa-chart-bar"/> Generate Reports</>)}
              </button>
            </div>
          </div>
        </section>

        {/* Quick Cards */}
        <section className="reports-grid">
          {quickCards.map((card) => (
            <article className="report-card" key={card.title}>
              <div className="report-header">
                <div className="report-title">
                  {card.title.includes("Income")  && <i className="fas fa-file-invoice-dollar" />}
                  {card.title.includes("Cash")    && <i className="fas fa-chart-line" />}
                  {card.title.includes("Balance") && <i className="fas fa-balance-scale" />}
                  {card.title.includes("Budget")  && <i className="fas fa-chart-pie" />}
                  {card.title}
                </div>
                <div className="report-subtitle">{card.subtitle}</div>
              </div>
              <div className="report-body">
                <div className="report-summary">
                  {card.stats.map((s)=>(
                    <div className="summary-item" key={s.label}>
                      <div className="summary-value">{s.value}</div>
                      <div className="summary-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="report-actions">
                  <button className="action-btn btn-primary" onClick={()=>handleView(card.title)}><i className="fas fa-eye"/> View</button>
                  <button className="action-btn btn-secondary" onClick={()=>handleDownload(card.title)}><i className="fas fa-download"/> Download</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Charts */}
        <section className="chart-section">
          <h2 className="section-title">📈 Financial Performance Analytics</h2>
          <div className="charts-row">
            <div className="chart-container">
              <div className="chart-title">Monthly Revenue Trend</div>
              <canvas ref={revenueRef}/>
            </div>
            <div className="chart-container">
              <div className="chart-title">Expense Categories</div>
              <canvas ref={expenseRef}/>
            </div>
          </div>
          <div className="charts-row">
            <div className="chart-container">
              <div className="chart-title">Profit Margin Analysis</div>
              <canvas ref={profitRef}/>
            </div>
            <div className="chart-container">
              <div className="chart-title">Budget vs Actual</div>
              <canvas ref={budgetRef}/>
            </div>
          </div>
        </section>

        {/* Recent Reports Table */}
        <section className="recent-reports">
          <h2 className="section-title">📋 Recent Report History</h2>
          <div className="table-container">
            <table className="reports-table">
              <thead>
              <tr>
                <th>Report Name</th><th>Type</th><th>Generated Date</th><th>Period</th><th>Status</th><th>Actions</th>
              </tr>
              </thead>
              <tbody>
              {rows.map((r)=>(
                <tr key={`${r.name}-${r.generated}`}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.generated}</td>
                  <td>{r.period}</td>
                  <td>
                    <span className={`status-badge ${
                      r.status==="Completed" ? "status-completed" :
                      r.status==="Pending"   ? "status-pending" : "status-processing"
                    }`}>{r.status}</span>
                  </td>
                  <td style={{display:"flex",gap:8}}>
                    <button className="action-btn btn-primary"  style={{padding:"6px 12px",fontSize:".8rem"}} onClick={()=>handleDownload(r.name, r.period)}><i className="fas fa-download"/></button>
                    <button className="action-btn btn-secondary" style={{padding:"6px 12px",fontSize:".8rem"}} onClick={()=>handleView(r.name, r.period)}><i className="fas fa-eye"/></button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </section>

        
      </main>
    </div>
  );
}

export default FinancialReport;
