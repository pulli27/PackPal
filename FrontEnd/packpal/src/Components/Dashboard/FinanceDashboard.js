import React, { useEffect, useRef, useMemo } from "react";
import Chart from "chart.js/auto";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./FinanceDashboard.css";
import Sidebar from "../Sidebar/Sidebar";

/* ===== Toast helper (matches your other pages) ===== */
const showNotification = (message, type = "info") => {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const colors = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  const icons  = { success:"fa-check-circle", error:"fa-exclamation-circle", warning:"fa-exclamation-triangle", info:"fa-info-circle" };
  const n = document.createElement("div");
  n.className = "notification";
  n.style.cssText = `
    position:fixed; top:20px; right:20px; background:#fff; color:${colors[type]};
    padding:15px 20px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.15);
    border-left:4px solid ${colors[type]}; z-index:10000; display:flex; align-items:center; gap:10px;
    max-width:420px; animation:fd-slideIn .3s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  `;
  n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  if (!document.querySelector("#fd-toast-anim")) {
    const style = document.createElement("style");
    style.id = "fd-toast-anim";
    style.textContent = `
      @keyframes fd-slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
      @keyframes fd-slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = "fd-slideOut .3s ease";
    setTimeout(() => n.remove(), 300);
  }, 3000);
};

export default function FinanceDashboard() {
  const revenueRef = useRef(null);
  const expenseRef = useRef(null);
  const cashFlowRef = useRef(null);

  const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    // Chart defaults
    Chart.defaults.font.family =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = "#374151";

    // Revenue vs Expenses
    const revenueChart = new Chart(revenueRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
        datasets: [
          {
            label: "Revenue",
            data: [65000, 72000, 68000, 85000, 91000, 88000, 95000, 102000],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59,130,246,0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
          {
            label: "Expenses",
            data: [42000, 45000, 41000, 52000, 55000, 53000, 58000, 62000],
            borderColor: "#EF4444",
            backgroundColor: "rgba(239,68,68,0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 20 } } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => "$" + v/1000 + "K" } } },
      },
    });

    // Expense Breakdown
    const expenseChart = new Chart(expenseRef.current.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Salaries", "Marketing", "Operations", "Technology", "Other"],
        datasets: [{
          data: [35000, 12000, 8000, 5000, 2000],
          backgroundColor: ["#8B5CF6", "#06D6A0", "#FFB703", "#FB8500", "#8ECAE6"],
          borderWidth: 0,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 20, usePointStyle: true } } },
      },
    });

    // Cash Flow
    const cashFlowChart = new Chart(cashFlowRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
        datasets: [
          { label: "Cash Inflow",  data: [75000,82000,78000,95000,101000,98000], backgroundColor: "#22C55E", borderRadius: 6 },
          { label: "Cash Outflow", data: [-42000,-45000,-41000,-52000,-55000,-53000], backgroundColor: "#EF4444", borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 20 } } },
        scales: { y: { ticks: { callback: v => "$" + Math.abs(v)/1000 + "K" } } },
      },
    });

    // Welcome toast
    const toastTimer = setTimeout(() => {
      showNotification("Welcome to the Finance Dashboard! Real-time revenue, expenses and cash flow at a glance.", "success");
    }, 400);

    return () => {
      clearTimeout(toastTimer);
      revenueChart.destroy();
      expenseChart.destroy();
      cashFlowChart.destroy();
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <div className="content-header">
          <h1>Finance Dashboard</h1>
          <p>Real-time financial insights and analytics</p>
        </div>

        {/* KPI Cards */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">Total Revenue</div>
            <div className="kpi-value">LKR 847,000</div>
            <div className="kpi-change positive">↗ +12.5% from last month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Total Expenses</div>
            <div className="kpi-value">LKR 535,000</div>
            <div className="kpi-change negative">↗ +15.2% from last month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Net Profit</div>
            <div className="kpi-value">LKR 312,000</div>
            <div className="kpi-change positive">↗ +8.7% from last month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Inventory Value</div>
            <div className="kpi-value">LKR 350,000</div>
            <div className="kpi-change positive">↗ +2.1% from last month</div>
          </div>
        </section>

        {/* Top Charts */}
        <section className="top-charts">
          <div className="chart-card">
            <div className="chart-title">📈 Revenue vs Expenses Trend</div>
            <div className="chart-container"><canvas ref={revenueRef} /></div>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-label">Avg Monthly Revenue</div>
                <div className="metric-value">LKR105.9K</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Avg Monthly Expenses</div>
                <div className="metric-value">LKR66.9K</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">🥧 Expense Breakdown</div>
            <div className="chart-container"><canvas ref={expenseRef} /></div>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-label">Largest Expense</div>
                <div className="metric-value">Salaries</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">% of Total</div>
                <div className="metric-value">56.5%</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Charts */}
        <section className="bottom-charts">
          <div className="chart-card">
            <div className="chart-title">💰 Monthly Cash Flow</div>
            <div className="chart-container"><canvas ref={cashFlowRef} /></div>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-label">Net Cash Flow</div>
                <div className="metric-value">+LKR312K</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Burn Rate</div>
                <div className="metric-value">LKR66.9K/mo</div>
              </div>
            </div>
          </div>

          <div className="notifications-card">
            <div className="chart-title">🔔 Recent Notifications</div>

            <div className="notification-item">
              <div className="notification-icon"><i className="fa-solid fa-exclamation" /></div>
              <div className="notification-content">
                <h4>Budget Alert</h4>
                <p>Marketing expenses exceeded budget by 15% this month</p>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon"><i className="fa-solid fa-check" /></div>
              <div className="notification-content">
                <h4>Payment Received</h4>
                <p>Large client payment of LKR45K received successfully</p>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon"><i className="fa-solid fa-clock" /></div>
              <div className="notification-content">
                <h4>Report Due</h4>
                <p>Monthly financial report due in 3 days</p>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon"><i className="fa-solid fa-chart-line" /></div>
              <div className="notification-content">
                <h4>Revenue Milestone</h4>
                <p>Congratulations! Monthly revenue target achieved</p>
              </div>
            </div>
          </div>
        </section>

        <div className="footer">
          Last updated: <span>{lastUpdated}</span> • Dashboard refreshed automatically every 15 minutes
        </div>
      </main>
    </div>
  );
}
