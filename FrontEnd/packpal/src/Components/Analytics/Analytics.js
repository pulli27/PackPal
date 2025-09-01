import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./Analytics.css";
import Sidebar from "../Sidebar/Sidebar";
// import Sidebar from "../Sidebar/Sidebar"; // not used right now

export default function Analytics() {
  /* ---------- Sample data (memoized) ---------- */
  const categories = useMemo(
    () => [
      { category: "Handbags", orders: 420, revenue: 38900 },
      { category: "Backpacks", orders: 315, revenue: 28100 },
      { category: "Totes", orders: 240, revenue: 16700 },
      { category: "Accessories", orders: 170, revenue: 8750 },
    ],
    []
  );

  const topProducts = useMemo(
    () => [
      { sku: "HB-001", name: "Leather Handbag", units: 210, revenue: 19950 },
      { sku: "BP-014", name: "Urban Backpack", units: 180, revenue: 16200 },
      { sku: "TT-022", name: "Canvas Tote", units: 125, revenue: 8750 },
      { sku: "AC-105", name: "Premium Strap", units: 90, revenue: 4320 },
    ],
    []
  );

  const roleStats = useMemo(
    () => [
      { role: "Admin", count: 12, share: "6%" },
      { role: "Manager", count: 45, share: "22%" },
      { role: "Staff", count: 149, share: "72%" },
    ],
    []
  );

  const palette = useMemo(
    () => ({
      base: ["#1f4ed8", "#355eea", "#89a7ff", "#d8e1ff"],
      bars: ["#355eea", "#1f4ed8", "#4b68ff", "#89a7ff"],
    }),
    []
  );

  const fmtMoney = (n) => "$" + Number(n).toLocaleString();

  // Refs for charts
  const revExpRef = useRef(null);
  const rolesRef = useRef(null);
  const ordersCatRef = useRef(null);

  // Refs for report DOM
  const reportRef = useRef(null);
  const tblCatRef = useRef(null);
  const tblTopRef = useRef(null);
  const tblRolesRef = useRef(null);

  const [genDate, setGenDate] = useState(() => new Date().toLocaleString());

  // Build tables (report) after mount
  useEffect(() => {
    setGenDate(new Date().toLocaleString());

    // Fill Orders by Category
    if (tblCatRef.current) {
      tblCatRef.current.innerHTML = "";
      categories.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${c.category}</td><td>${c.orders}</td><td>${fmtMoney(
          c.revenue
        )}</td>`;
        tblCatRef.current.appendChild(tr);
      });
    }

    // Fill Top Products
    if (tblTopRef.current) {
      tblTopRef.current.innerHTML = "";
      topProducts.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.sku}</td><td>${p.name}</td><td>${
          p.units
        }</td><td>${fmtMoney(p.revenue)}</td>`;
        tblTopRef.current.appendChild(tr);
      });
    }

    // Fill Roles
    if (tblRolesRef.current) {
      tblRolesRef.current.innerHTML = "";
      roleStats.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.role}</td><td>${r.count}</td><td>${r.share}</td>`;
        tblRolesRef.current.appendChild(tr);
      });
    }
  }, [categories, topProducts, roleStats]);

  // Build charts
  useEffect(() => {
    if (!revExpRef.current || !rolesRef.current || !ordersCatRef.current) return;

    const revenueChart = new Chart(revExpRef.current, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Dec"],
        datasets: [
          {
            label: "Revenue",
            data: [15000, 22000, 24000, 23000, 35000, 32000, 38000, 45000, 42000, 51000],
            tension: 0.35,
            fill: true,
            borderColor: palette.base[1],
            backgroundColor: "rgba(53,94,234,.15)",
            borderWidth: 3,
          },
          {
            label: "Expenses",
            data: [11000, 14000, 19000, 17000, 22000, 21000, 26000, 29000, 31000, 33000],
            tension: 0.35,
            fill: true,
            borderColor: "#93a1ff",
            backgroundColor: "rgba(147,161,255,.15)",
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (v) => "$" + Number(v).toLocaleString(),
            },
            grid: { color: "#eef1f7" },
          },
          x: { grid: { display: false } },
        },
      },
    });

    const rolesChart = new Chart(rolesRef.current, {
      type: "doughnut",
      data: {
        labels: roleStats.map((r) => r.role),
        datasets: [
          {
            data: roleStats.map((r) => r.count),
            backgroundColor: [palette.base[0], palette.base[1], palette.base[2]],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: { cutout: "65%", plugins: { legend: { display: false } } },
    });

    const ordersChart = new Chart(ordersCatRef.current, {
      type: "bar",
      data: {
        labels: categories.map((c) => c.category),
        datasets: [
          {
            label: "Orders",
            data: categories.map((c) => c.orders),
            backgroundColor: palette.bars,
            borderRadius: 8,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#eef1f7" } },
          x: { grid: { display: false } },
        },
      },
    });

    // Cleanup on unmount to avoid duplicate charts
    return () => {
      revenueChart.destroy();
      rolesChart.destroy();
      ordersChart.destroy();
    };
  }, [categories, roleStats, palette]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const reportEl = reportRef.current;

    // Temporarily show the report (if hidden) for accurate render
    const prevDisplay = reportEl.style.display;
    reportEl.style.display = "block";

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 24;

    const canvas = await html2canvas(reportEl, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const w = pageWidth - margin * 2;
    const h = w * (canvas.height / canvas.width);

    pdf.addImage(imgData, "PNG", margin, margin, w, h);
    pdf.save("analytics_report.pdf");

    // Restore previous display
    reportEl.style.display = prevDisplay || "none";
  };

  return (
    <div>
        <Sidebar/>
      <div className="main">
        <header className="topbar">
          <h1>Analytics</h1>
          <div className="actions">
            <button className="btn ghost" type="button">
              Last 30 days <i className="fa-solid fa-chevron-down"></i>
            </button>

            <button className="btn primary" type="button" onClick={handleDownloadPDF}>
              <i className="fa-solid fa-file-pdf"></i> Download PDF
            </button>
          </div>
        </header>

        <section className="kpis card">
          <div className="kpi">
            <p className="kpi-label">Revenue</p>
            <p className="kpi-value" id="revValue">
              $92,450
            </p>
            <p className="kpi-delta up">▲ 12%</p>
          </div>
          <div className="divider"></div>
          <div className="kpi">
            <p className="kpi-label">Orders</p>
            <p className="kpi-value" id="ordValue">
              1,245
            </p>
            <p className="kpi-delta up">▲ 3%</p>
          </div>
          <div className="divider"></div>
          <div className="kpi">
            <p className="kpi-label">Active Users</p>
            <p className="kpi-value" id="usrValue">
              8,432
            </p>
            <p className="kpi-delta down">▼ 5%</p>
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <h3>Revenue vs Expenses</h3>
            <canvas ref={revExpRef} height="120" />
          </div>

          <div className="card">
            <h3>User Roles</h3>
            <div className="roles">
              <canvas ref={rolesRef} width="220" height="220" />
              <ul className="legend">
                <li>
                  <span className="dot admin"></span> Admin <strong>12</strong> <em>6%</em>
                </li>
                <li>
                  <span className="dot manager"></span> Manager <strong>45</strong>{" "}
                  <em>22%</em>
                </li>
                <li>
                  <span className="dot staff"></span> Staff <strong>149</strong>{" "}
                  <em>72%</em>
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="rowhead">
              <h3>Orders by Category</h3>
              <span className="muted">Last 30 days</span>
            </div>
            <canvas ref={ordersCatRef} height="120" />
          </div>

          <div className="card">
            <h3>Top Products</h3>
            <ul className="list">
              <li>
                <span>HB-001</span> Leather Handbag <em>Units:</em> 210{" "}
                <strong>LKR19,950</strong>
              </li>
              <li>
                <span>BP-014</span> Urban Backpack <em>Units:</em> 180{" "}
                <strong>LKR16,200</strong>
              </li>
              <li>
                <span>TT-022</span> Canvas Tote <em>Units:</em> 125{" "}
                <strong>LKR8,750</strong>
              </li>
              <li>
                <span>AC-105</span> Premium Strap <em>Units:</em> 90{" "}
                <strong>LKR4,320</strong>
              </li>
            </ul>
          </div>
        </section>

        {/* Hidden report used for PDF generation */}
        <section id="report" className="report" ref={reportRef}>
          <h2>Analytics Report</h2>
          <p className="muted">
            Generated: <span id="genDate">{genDate}</span> • Period: Last 30 days
          </p>

          <div className="report-kpis">
            <div className="rkpi">
              <small>Revenue</small>
              <strong>LKR 92,450</strong>
            </div>
            <div className="rkpi">
              <small>Orders</small>
              <strong>LKR 1,245</strong>
            </div>
            <div className="rkpi">
              <small>Active Users</small>
              <strong>M  8,432</strong>
            </div>
          </div>
          <h3>Orders by Category</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Category</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody ref={tblCatRef}></tbody>
          </table>

          <h3>Top Products</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Units</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody ref={tblTopRef}></tbody>
          </table>

          <h3>Users by Role</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Role</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody ref={tblRolesRef}></tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
