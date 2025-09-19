import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./InventoryDashboard.css";

const initialRows = [
  { product: "Mini backpack", stock: 142, value: 14200, status: "in-stock" },
  { product: "Rolling school bag",    stock: 8,   value: 1600,  status: "low-stock" },
  { product: "Crossbody bag",        stock: 0,   value: 0,     status: "out-of-stock" },
  { product: " Laptop backpack ",       stock: 67,  value: 3350,  status: "in-stock" },
  { product: "Beach tote",   stock: 15,  value: 1500,  status: "low-stock" }
];

function InventoryDashboard() {
  const [query, setQuery] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const canvasRef = useRef(null);

  // Live date/time
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Nicely formatted date/time (e.g., August 29, 2025, 9:41 PM)
  const formattedNow = useMemo(
    () =>
      dateTime.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      }),
    [dateTime]
  );

  // Search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter((r) =>
      `${r.product} ${r.stock} ${r.value}`.toLowerCase().includes(q)
    );
  }, [query]);

  // Draw donut chart (no external libs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const segments = [
      { label: "In Stock", value: 220, color: "#10b981" },
      { label: "Low Stock", value: 70, color: "#f59e0b" },
      { label: "Out of Stock", value: 35, color: "#ef4444" },
    ];
    const total = segments.reduce((s, d) => s + d.value, 0);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let start = -Math.PI / 2;
    segments.forEach((seg) => {
      const angle = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      start += angle;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center text
    ctx.fillStyle = "#374151";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("325", cx, cy - 8);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Total", cx, cy + 8);
  }, []);

  return (
    <div className="page-shell">
      <Sidebar />

      <main className="main-content">
        <section className="dashboard">
          <header className="header">
            <h1> 📦 Inventory Management Dashboard</h1>
            <div className="date">Last Updated: {formattedNow}</div>
          </header>

          {/* Metrics */}
          <section className="metrics-row">
            <article className="metric-card">
              
              <div className="metric-value">325</div>
              <div className="metric-label">Total Products</div>
            </article>
            <article className="metric-card">
              
              <div className="metric-value">1,000</div>
              <div className="metric-label">Total Items</div>
            </article>
            <article className="metric-card">
              
              <div className="metric-value">70</div>
              <div className="metric-label">Low Stock Products</div>
            </article>
            <article className="metric-card">
              
              <div className="metric-value">35</div>
              <div className="metric-label">Out of Stock</div>
            </article>
            <article className="metric-card">
              
              <div className="metric-value">LKR 250,000</div>
              <div className="metric-label">Total Value of Stock</div>
            </article>
          </section>

          {/* Charts + Alerts */}
          <section className="charts-alerts-row">
            <div className="chart-container">
              <h2 className="panel-title">📊 Stock Summary</h2>
              <div className="stock-chart-wrapper">
                <div className="pie-chart-container">
                  <canvas
                    ref={canvasRef}
                    id="stockChart"
                    width="250"
                    height="250"
                    aria-label="Stock distribution chart"
                  />
                </div>
                <div className="chart-legend" aria-hidden="true">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: "#10b981" }} />
                    <span className="legend-text">In Stock (220)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: "#f59e0b" }} />
                    <span className="legend-text">Low Stock (70)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: "#ef4444" }} />
                    <span className="legend-text">Out of Stock (35)</span>
                  </div>
                </div>
              </div>
            </div>

            <aside className="alerts-panel">
              <h2 className="panel-title">⚠️ Alerts & Notifications</h2>
              <div className="alerts-content">
                {[
                  ["Critical Stock Level", "Gaming Mouse (GM-450) is out of stock"],
                  ["Low Stock Warning", "Coffee Maker Pro needs reordering (8 units left)"],
                  ["Reorder Reminder", "Bluetooth Speaker approaching minimum threshold"],
                  ["Supplier Update", "New pricing available from TechSupply Co."],
                  ["Quality Check", "Weekly quality inspection due for Electronics category"],
                ].map(([title, desc], i) => (
                  <div className="alert-item" key={i}>
                    <div className="alert-icon">!</div>
                    <div className="alert-content">
                      <div className="alert-title">{title}</div>
                      <div className="alert-description">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          {/* Table */}
          <section className="inventory-table">
            <div className="table-header">
              <h2 className="table-title">📋 Current Inventory</h2>
              <input
                type="text"
                className="search-box"
                placeholder="Search products..."
                aria-label="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={`${r.product}-${idx}`}>
                    <td><strong>{r.product}</strong></td>
                    <td>{r.stock} units</td>
                    <td>LKR {r.value.toLocaleString()}</td>
                    <td>
                      <span className={`status ${r.status}`}>
                        {r.status === "in-stock"
                          ? "In Stock"
                          : r.status === "low-stock"
                          ? "Low Stock"
                          : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: 16, textAlign: "center" }}>
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </section>
      </main>
    </div>
  );
}

export default InventoryDashboard;
