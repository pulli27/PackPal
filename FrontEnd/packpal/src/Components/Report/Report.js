import React, { useEffect, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Report.css";

// Libs (module imports instead of <script> tags)
import Chart from "chart.js/auto";
import html2pdf from "html2pdf.js";

export default function Report() {
  // Canvas refs
  const invRef = useRef(null);
  const orderTrendRef = useRef(null);
  const valueRef = useRef(null);
  const stockRef = useRef(null);
  const itemPieRef = useRef(null);
  const reportDateRef = useRef(null);

  // Scope root for CSS vars (so we don't rely on :root/body)
  const mainRef = useRef(null);

  // Keep chart instances so we can destroy on re-render
  const chartsRef = useRef([]);

  useEffect(() => {
    // init
    initializeCharts();
    updateReportDate();

    // cleanup
    return () => {
      chartsRef.current.forEach((c) => c && c.destroy());
      chartsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateReportDate() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (reportDateRef.current) {
      reportDateRef.current.textContent = `Report generated on ${dateStr} • Last updated: ${dateStr} at ${timeStr}`;
    }
  }

  function cssVar(name) {
    const el = mainRef.current || document.documentElement;
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  function initializeCharts() {
    chartsRef.current.forEach((c) => c && c.destroy());
    chartsRef.current = [];

    // Inventory by Category
    if (invRef.current) {
      const c = new Chart(invRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["KIDSBAGS", "SCHOOLBAGS", "HANDBAGS", "TOTEBAGS", "LAPTOPBAGS"],
          datasets: [
            { label: "In Stock", data: [142, 0, 0, 67, 0], backgroundColor: cssVar("--green") },
            { label: "Low Stock", data: [0, 8, 0, 0, 15], backgroundColor: cssVar("--amber") },
            { label: "Out of Stock", data: [0, 0, 1, 0, 0], backgroundColor: cssVar("--red") },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        },
      });
      chartsRef.current.push(c);
    }

    // Order Trends
    if (orderTrendRef.current) {
      const c = new Chart(orderTrendRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels: ["Jun", "Jul", "Aug"],
          datasets: [
            {
              label: "Pending",
              data: [1, 3, 2],
              borderColor: "#F59E0B",
              backgroundColor: "rgba(245,158,11,.12)",
              tension: 0.15,
              fill: true,
            },
            {
              label: "Completed",
              data: [4, 5, 6],
              borderColor: "#10B981",
              backgroundColor: "rgba(16,185,129,.12)",
              tension: 0.15,
              fill: true,
            },
            {
              label: "Cancelled",
              data: [0, 1, 1],
              borderColor: "#EF4444",
              backgroundColor: "rgba(239,68,68,.12)",
              tension: 0.15,
              fill: true,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
      });
      chartsRef.current.push(c);
    }

    // Monthly Inventory Value
    if (valueRef.current) {
      const c = new Chart(valueRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels: ["May", "Jun", "Jul", "Aug"],
          datasets: [
            {
              label: "Inventory Value (LKR)",
              data: [18500, 22300, 19800, 55920],
              borderColor: "#6366F1",
              backgroundColor: "rgba(99,102,241,.25)",
              fill: true,
              tension: 0.18,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => "LKR " + Number(v).toLocaleString() },
            },
          },
          plugins: {
            tooltip: {
              callbacks: { label: (ctx) => "Value: LKR " + Number(ctx.parsed.y).toLocaleString() },
            },
          },
        },
      });
      chartsRef.current.push(c);
    }

    // Stock Status
    if (stockRef.current) {
      const c = new Chart(stockRef.current.getContext("2d"), {
        type: "pie",
        data: {
          labels: ["In Stock", "Low Stock", "Out of Stock"],
          datasets: [
            { data: [220, 23, 1], backgroundColor: ["#10B981", "#F59E0B", "#EF4444"], borderWidth: 0 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
      chartsRef.current.push(c);
    }

    // Item Inventory Pie
    if (itemPieRef.current) {
      const itemLabels = [
        "Leather Backpack",
        "Canvas Tote",
        "Laptop Briefcase",
        "Travel Duffel (Large)",
        "Travel Duffel (Small)",
      ];
      const itemQuantities = [450, 300, 12, 500, 10];
      const totalQty = itemQuantities.reduce((a, b) => a + b, 0);

      const c = new Chart(itemPieRef.current.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: itemLabels,
          datasets: [
            {
              data: itemQuantities,
              backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "55%",
          plugins: {
            legend: { position: "right" },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / totalQty) * 100).toFixed(1)}%)`,
              },
            },
          },
        },
      });
      chartsRef.current.push(c);
    }
  }

  // --------- PDF generator ----------
  async function generateReport() {
    const startDate = document.getElementById("startDate")?.value || "—";
    const endDate = document.getElementById("endDate")?.value || "—";

    const reportParts = Array.from(
      (mainRef.current || document).querySelectorAll(".report-part")
    );

    const pdfRoot = document.createElement("div");
    pdfRoot.id = "pdfRoot";

    // Copy our scoped CSS vars into the PDF root so styles match
    const vars = [
      "--ink","--text","--muted","--bg","--card","--line",
      "--brand","--brand-600","--green","--amber","--red","--violet","--indigo"
    ];
    vars.forEach(v => pdfRoot.style.setProperty(v, cssVar(v)));

    const today = new Date();
    const cover = document.createElement("section");
    cover.className = "pdf-cover";
    cover.innerHTML = `
      <div class="brand-row">
        <div class="brand-chip"><i class="fas fa-briefcase"></i> PackPal</div>
        <div style="font-size:12px;color:#475569">Generated: ${today.toLocaleDateString()}</div>
      </div>
      <div class="cover-title">Inventory & Analytics Report</div>
      <div class="cover-sub">Charts & KPIs Summary</div>
      <div class="cover-meta">
        <div class="meta-item"><strong>Period</strong><br>${startDate} → ${endDate}</div>
        <div class="meta-item"><strong>Prepared By</strong><br>Automated Reporting Service</div>
      </div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <div style="flex:1;height:6px;background:linear-gradient(90deg,#2563eb,#6366f1);border-radius:999px"></div>
        <div style="flex:1;height:6px;background:linear-gradient(90deg,#10b981,#22c55e);border-radius:999px"></div>
      </div>
    `;
    pdfRoot.appendChild(cover);

    const toc = document.createElement("section");
    toc.className = "pdf-section";
    toc.innerHTML = `
      <div class="toc">
        <div class="toc-title"><i class="fas fa-list-ol" style="color:var(--brand)"></i> Table of Contents</div>
        <ul id="tocList"></ul>
      </div>
    `;
    pdfRoot.appendChild(toc);

    const kpiSec = document.createElement("section");
    kpiSec.className = "pdf-section";
    kpiSec.innerHTML = `
      <div class="figure">
        <div class="figure-title">Figure 1 — Key Performance Indicators</div>
        <div class="kpi-grid" id="kpiGrid"></div>
        <div class="figure-caption">Snapshot of core metrics for the selected period.</div>
      </div>
    `;
    pdfRoot.appendChild(kpiSec);

    // Copy KPI cards
    const kpiGrid = kpiSec.querySelector("#kpiGrid");
    const firstPartCards = reportParts[0].querySelectorAll(".metric-card");
    firstPartCards.forEach((card) => {
      const val = card.querySelector(".metric-value")?.textContent?.trim() || "";
      const lab = card.querySelector(".metric-label")?.textContent?.trim() || "";
      const icon = card.querySelector(".metric-icon")?.className || "fas fa-chart-line";
      const k = document.createElement("div");
      k.className = "kpi-card";
      k.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="kpi-label">${lab}</div>
          <i class="${icon}" style="color:var(--brand)"></i>
        </div>
        <div class="kpi-value">${val}</div>
      `;
      kpiGrid.appendChild(k);
    });

    pdfRoot.appendChild(makePageBreak());

    // Figures
    const tocList = toc.querySelector("#tocList");
    let figNum = 2;
    for (let p = 1; p < reportParts.length; p++) {
      const part = reportParts[p];
      const figure = document.createElement("section");
      figure.className = "pdf-section";
      const clone = part.cloneNode(true);

      // Replace canvases with images for crisp PDF
      const srcCanvases = part.querySelectorAll("canvas");
      const dstCanvases = clone.querySelectorAll("canvas");
      srcCanvases.forEach((canvas, i) => {
        const img = new Image();
        try {
          img.src = canvas.toDataURL("image/png", 1.0);
        } catch (e) { /* ignore */ }
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        if (dstCanvases[i]) dstCanvases[i].replaceWith(img);
      });

      const titles = Array.from(clone.querySelectorAll(".card-title")).map((n) =>
        n.textContent.trim()
      );
      const figureTitle = titles.length ? titles.join(" · ") : "Charts";

      figure.innerHTML = `
        <div class="figure">
          <div class="figure-title">Figure ${figNum} — ${escapeHtml(figureTitle)}</div>
          <div class="figure-img">${clone.innerHTML}</div>
          <div class="figure-caption">Data visualizations for the selected period (${startDate} → ${endDate}).</div>
        </div>
      `;
      pdfRoot.appendChild(figure);

      const li = document.createElement("li");
      li.innerHTML = `<span>Figure ${figNum} — ${escapeHtml(figureTitle)}</span><span>Page …</span>`;
      tocList.appendChild(li);

      if (p !== reportParts.length - 1) pdfRoot.appendChild(makePageBreak());
      figNum++;
    }

    document.body.appendChild(pdfRoot);

    const opt = {
      margin: [10, 10, 12, 10],
      filename: `inventory-report-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    try {
      await html2pdf()
        .set(opt)
        .from(pdfRoot)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          const total = pdf.internal.getNumberOfPages();
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();

          // Fill TOC pages: assume first figure starts at page 3
          const tocItems = tocList.querySelectorAll("li");
          let figureStartPage = 3;
          tocItems.forEach((li, idx) => {
            li.querySelector("span:last-child").textContent = figureStartPage + idx;
          });

          for (let i = 1; i <= total; i++) {
            pdf.setPage(i);
            // Header
            pdf.setFontSize(9);
            pdf.setTextColor(120);
            pdf.text("PackPal • Inventory & Analytics", 10, 8);
            pdf.setDrawColor(220);
            pdf.line(10, 10, pageW - 10, 10);

            // Footer
            const label = `Page ${i} of ${total}`;
            pdf.setTextColor(120);
            pdf.text(new Date().toLocaleDateString(), 10, pageH - 6);
            pdf.text(`Period: ${startDate} → ${endDate}`, 10, pageH - 12);
            pdf.text(label, pageW - 10 - pdf.getTextWidth(label), pageH - 6);
          }
        })
        .save();
    } finally {
      pdfRoot.remove();
    }

    function makePageBreak() {
      const br = document.createElement("div");
      br.className = "pagebreak";
      return br;
    }
    function escapeHtml(s = "") {
      return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
  }

  return (
    <div className="report-shell">
      <Sidebar />

      {/* Everything below is scoped inside .report-main */}
      <main className="report-main" ref={mainRef}>
        {/* Header */}
        <div className="header">
          <div className="container">
            <div className="header-content">
              <div>
                <div className="header-title">
                  <i className="fas fa-chart-line" />
                  Reports & Analytics
                </div>
                <p className="header-subtitle">Comprehensive inventory and business intelligence</p>
              </div>
              <button onClick={generateReport} className="btn-primary">
                <i className="fas fa-download" /> Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container page-body">
          <div className="grid md-grid-4 card mb-20">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" id="startDate" defaultValue="2025-08-01" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" id="endDate" defaultValue="2025-08-31" className="form-input" />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid md-grid-4 report-part">
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Products</div>
                <div className="metric-value">12</div>
              </div>
              <i className="fas fa-box metric-icon brand" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Active Orders</div>
                <div className="metric-value">12</div>
              </div>
              <i className="fas fa-shopping-cart metric-icon green" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Inventory Ready</div>
                <div className="metric-value">6</div>
              </div>
              <i className="fas fa-chart-line metric-icon violet" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg-grid-2 report-part mt-20">
            <div className="card">
              <div className="card-title">Inventory by Category</div>
              <div className="chart-container">
                <canvas ref={invRef} id="inventoryChart" />
              </div>
            </div>
            <div className="card">
              <div className="card-title">Purchase Order Trends</div>
              <div className="chart-container">
                <canvas ref={orderTrendRef} id="orderTrendChart" />
              </div>
            </div>
          </div>

          <div className="grid lg-grid-2 report-part">
            <div className="card">
              <div className="card-title">Monthly Inventory Value</div>
              <div className="chart-container">
                <canvas ref={valueRef} id="valueChart" />
              </div>
            </div>
            <div className="card">
              <div className="card-title">Stock Status Distribution</div>
              <div className="chart-container">
                <canvas ref={stockRef} id="stockStatusChart" />
              </div>
            </div>
          </div>

          <div className="report-part mt-20">
            <div className="card">
              <div className="card-title">Item Inventory Share (by Quantity)</div>
              <div className="chart-container">
                <canvas ref={itemPieRef} id="itemInventoryPie" />
              </div>
              <p className="muted">Share of total quantity by individual item.</p>
            </div>
          </div>

          {/* Not exported to PDF */}
          <div className="card mt-24">
            <h3 className="card-title">
              <i className="fas fa-users neutral" /> Supplier Performance Analysis
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>SUPPLIER</th>
                    <th>TOTAL ORDERS</th>
                    <th>ON-TIME DELIVERY</th>
                    <th>PERFORMANCE</th>
                    <th>RATING</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-gray-900">Aisha Perera</td>
                    <td>8</td>
                    <td>7/8</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "87.5%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green">4.8/5.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-900">John Chen</td>
                    <td>6</td>
                    <td>5/6</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "83.3%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-yellow">4.2/5.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-900">Maria Santos</td>
                    <td>5</td>
                    <td>4/5</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "80%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-yellow">4.0/5.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-900">Lisa Rodriguez</td>
                    <td>4</td>
                    <td>3/4</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "75%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-red">3.8/5.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-900">Mike Johnson</td>
                    <td>3</td>
                    <td>2/3</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "66.7%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-red">3.5/5.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-900">Anna Park</td>
                    <td>2</td>
                    <td>2/2</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "100%" }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green">4.5/5.0</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card gradient-dark mt-20">
            <div className="footer-grid">
              <div className="footer-stat">
                <div className="footer-value blue">LKR 250K+</div>
                <div className="footer-label">Total Stock Value</div>
              </div>
              <div className="footer-stat">
                <div className="footer-value green">325</div>
                <div className="footer-label">Total Products Managed</div>
              </div>
              <div className="footer-stat">
                <div className="footer-value violet">6</div>
                <div className="footer-label">Active Suppliers</div>
              </div>
            </div>
            <div className="footer-meta">
              <span ref={reportDateRef} id="reportDate" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
