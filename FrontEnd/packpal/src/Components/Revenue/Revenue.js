import React, { useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import "./Revenue.css";
import Sidebar from "../Sidebar/Sidebar";
import "@fortawesome/fontawesome-free/css/all.min.css";

function Revenue() {
  // ---------- Refs ----------
  const revenueRef = useRef(null);
  const productRef = useRef(null);
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);
  const deptRef = useRef(null);
  const channelRef = useRef(null);

  // Keep chart instances so we can clean them up
  const chartsRef = useRef({});

  // ---------- Toast helper (same pattern as FinancialReport) ----------
  const showNotification = (message, type = "info") => {
    // remove existing toasts
    document.querySelectorAll(".notification").forEach((n) => n.remove());
    const colors = {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    };
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
      max-width:420px; animation:slideIn .3s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
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
    setTimeout(() => {
      n.style.animation = "slideOut .3s ease";
      setTimeout(() => n.remove(), 300);
    }, 3000);
  };

  // ---------- Data ----------
  const monthlyRevenueData = useMemo(
    () => ({
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "2024 Revenue",
          data: [
            180000, 195000, 210000, 205000, 225000, 240000, 235000, 250000,
            245000, 260000, 255000, 270000,
          ],
          borderColor: "#6d28d9",
          backgroundColor: "rgba(125, 86, 250, .10)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
        },
        {
          label: "2023 Revenue",
          data: [
            165000, 170000, 185000, 180000, 190000, 200000, 195000, 210000,
            205000, 220000, 215000, 230000,
          ],
          borderColor: "#9ca3af",
          backgroundColor: "rgba(156, 163, 175, .08)",
          borderWidth: 2,
          fill: false,
          tension: 0.35,
        },
      ],
    }),
    []
  );

  const productData = useMemo(
    () => ({
      labels: [
        "Handbags",
        "Backpacks",
        "Travel Bags",
        "Luxury",
        "Laptop Bags",
        "Wallets",
      ],
      datasets: [
        {
          label: "Sales ($000s)",
          data: [680, 520, 420, 380, 340, 260],
          backgroundColor: [
            "#e91e63",
            "#6d28d9",
            "#10b981",
            "#8b5cf6",
            "#f59e0b",
            "#06b6d4",
          ],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    }),
    []
  );

  const baseOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { usePointStyle: true, color: "#111827" } } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#e9ebf2" },
          ticks: { color: "#6b7280" },
        },
        x: { grid: { color: "#e9ebf2" }, ticks: { color: "#6b7280" } },
      },
    }),
    []
  );

  // ---------- Welcome toast on mount ----------
  useEffect(() => {
    const t = setTimeout(
      () =>
        showNotification(
          "Welcome to Sales & Revenue! Explore trends, filter views, and export data.",
          "success"
        ),
      400
    );
    return () => clearTimeout(t);
  }, []);

  // ---------- Init Charts ----------
  useEffect(() => {
    // Revenue line
    if (revenueRef.current) {
      chartsRef.current.revenue = new Chart(
        revenueRef.current.getContext("2d"),
        {
          type: "line",
          data: monthlyRevenueData,
          options: {
            ...baseOptions,
            interaction: { intersect: false, mode: "index" },
            scales: {
              ...baseOptions.scales,
              y: {
                ...baseOptions.scales.y,
                ticks: {
                  ...baseOptions.scales.y.ticks,
                  callback: (v) => "$" + (v / 1000).toFixed(0) + "K",
                },
              },
            },
          },
        }
      );
    }

    // Product bar
    if (productRef.current) {
      chartsRef.current.product = new Chart(
        productRef.current.getContext("2d"),
        {
          type: "bar",
          data: productData,
          options: {
            ...baseOptions,
            onClick: (_evt, els) => {
              if (els.length) {
                const idx = els[0].index;
                showNotification(
                  `Drill-down: ${productData.labels[idx]}`,
                  "info"
                );
              }
            },
            scales: {
              ...baseOptions.scales,
              y: {
                ...baseOptions.scales.y,
                ticks: {
                  ...baseOptions.scales.y.ticks,
                  callback: (v) => v + "K",
                },
              },
            },
          },
        }
      );
    }

    // Cleanup on unmount
    return () => {
      Object.values(chartsRef.current).forEach((c) => c?.destroy());
      chartsRef.current = {};
    };
  }, [monthlyRevenueData, productData, baseOptions]);

  // ---------- Handlers ----------
  const applyFilters = () => {
    const f = dateFromRef.current?.value || "";
    const t = dateToRef.current?.value || "";
    const d = deptRef.current?.value || "All";
    const c = channelRef.current?.value || "All";
    showNotification(
      `Filters applied: ${f || "—"} → ${t || "—"} • Category: ${d} • Channel: ${c}`,
      "info"
    );
  };

  const exportData = (type) => {
    const texts = {
      pdf: "Generating PDF…",
      excel: "Exporting to Excel…",
      csv: "Downloading CSV…",
    };
    showNotification(texts[type] || "Export in progress…", "success");
  };

  const viewOrder = (id) =>
    showNotification(`Opening details for ${id}…`, "info");

  const generateInvoice = (id) =>
    showNotification(`Generating invoice for ${id}…`, "info");

  // ---------- Static rows ----------
  const rows = [
    {
      id: "BAG-2024-1247",
      customer: "Emma Williams",
      date: "2024-08-30",
      value: "$459.99",
      channel: "Online",
      status: "Shipped",
      statusClass: "rev-ok",
    },
    {
      id: "BAG-2024-1246",
      customer: "Marcus Johnson",
      date: "2024-08-30",
      value: "$189.99",
      channel: "Retail",
      status: "Packing",
      statusClass: "rev-proc",
    },
    {
      id: "BAG-2024-1245",
      customer: "Sophia Chen",
      date: "2024-08-29",
      value: "$899.00",
      channel: "Wholesale",
      status: "Delivered",
      statusClass: "rev-ok",
    },
    {
      id: "BAG-2024-1244",
      customer: "Alex Rodriguez",
      date: "2024-08-29",
      value: "$329.50",
      channel: "Online",
      status: "Pending Payment",
      statusClass: "rev-pend",
    },
  ];

  return (
    <div className="rev">
      <Sidebar />
      <main className="rev-container">
        <div className="content-header">
          <h1>Sales & Revenue </h1>
          <p>Clean, professional view of sales performance, trends and targets</p>
        </div>

        {/* Filters */}
        <section className="rev-filters rev-fade-in">
          <div className="rev-filter-grid">
            <div className="rev-filter-group">
              <label>Date From</label>
              <input
                type="date"
                className="rev-filter-input"
                defaultValue="2024-01-01"
                ref={dateFromRef}
              />
            </div>
            <div className="rev-filter-group">
              <label>Date To</label>
              <input
                type="date"
                className="rev-filter-input"
                defaultValue="2024-12-31"
                ref={dateToRef}
              />
            </div>
            <div className="rev-filter-group">
              <label>Category</label>
              <select className="rev-filter-input" ref={deptRef}>
                <option value="">All</option>
                <option>Handbags</option>
                <option>Backpacks</option>
                <option>Travel Bags</option>
                <option>Luxury</option>
                <option>Laptop Bags</option>
                <option>Wallets & Accessories</option>
              </select>
            </div>
            <div className="rev-filter-group">
              <label>Channel</label>
              <select className="rev-filter-input" ref={channelRef}>
                <option value="">All</option>
                <option>Online</option>
                <option>Retail</option>
                <option>Wholesale</option>
              </select>
            </div>
            <div className="rev-filter-group">
              <button className="rev-apply-btn" onClick={applyFilters}>
                <i className="fas fa-search" /> Apply Filters
              </button>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="rev-kpi-grid rev-fade-in">
          <article className="rev-kpi">
            <div className="rev-kpi-head">
              <div className="rev-kpi-icon">
                <i className="fas fa-building-columns" />
              </div>
              <div>
                <div className="rev-kpi-title">Revenue</div>
                <div className="rev-kpi-sub">Total Sales</div>
              </div>
            </div>
            <div className="rev-kpi-value">$2,400,000</div>
            <div className="rev-kpi-meta">
              <span>December 2024</span>
              <span className="rev-kpi-change">
                <i className="fas fa-arrow-up" /> +12.0%
              </span>
            </div>
          </article>

          <article className="rev-kpi">
            <div className="rev-kpi-head">
              <div className="rev-kpi-icon">
                <i className="fas fa-credit-card" />
              </div>
              <div>
                <div className="rev-kpi-title">Orders</div>
                <div className="rev-kpi-sub">Units Sold</div>
              </div>
            </div>
            <div className="rev-kpi-value">15,847</div>
            <div className="rev-kpi-meta">
              <span>December 2024</span>
              <span className="rev-kpi-change">
                <i className="fas fa-arrow-up" /> +8.0%
              </span>
            </div>
          </article>

          <article className="rev-kpi">
            <div className="rev-kpi-head">
              <div className="rev-kpi-icon">
                <i className="fas fa-percentage" />
              </div>
              <div>
                <div className="rev-kpi-title">Profit Margin</div>
                <div className="rev-kpi-sub">Net</div>
              </div>
            </div>
            <div className="rev-kpi-value">24.8%</div>
            <div className="rev-kpi-meta">
              <span>December 2024</span>
              <span className="rev-kpi-change rev-neg">
                <i className="fas fa-arrow-down" /> -2.1%
              </span>
            </div>
          </article>
        </section>

        {/* Charts */}
        <section className="rev-charts rev-fade-in">
          <div className="rev-card">
            <h3>
              <i className="fas fa-chart-area" /> Monthly Revenue Trends
            </h3>
            <div className="rev-canvas-wrap">
              <canvas ref={revenueRef} />
            </div>
          </div>
          <div className="rev-card">
            <h3>
              <i className="fas fa-chart-bar" /> Sales by Category
            </h3>
            <div className="rev-canvas-wrap">
              <canvas ref={productRef} />
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className="rev-table-section rev-fade-in">
          <div className="rev-section-head">
            <h3>
              <i className="fas fa-table" /> Recent Transactions
            </h3>
          </div>
          <div className="rev-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Value</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.customer}</td>
                    <td>{r.date}</td>
                    <td>{r.value}</td>
                    <td>{r.channel}</td>
                    <td>
                      <span className={`rev-status ${r.statusClass}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="rev-btn rev-btn-primary rev-btn-sm"
                        onClick={() => viewOrder(r.id)}
                      >
                        View
                      </button>{" "}
                      <button
                        className="rev-btn rev-btn-success rev-btn-sm"
                        onClick={() => generateInvoice(r.id)}
                      >
                        Invoice
                      </button>{" "}
                      <button
                        className="rev-btn rev-btn-warning rev-btn-sm"
                        onClick={() => exportData("pdf")}
                      >
                        PDF
                      </button>
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

export default Revenue;
