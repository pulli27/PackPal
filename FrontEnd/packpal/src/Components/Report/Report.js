// src/Components/Report/Report.js
import React, { useEffect, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Report.css";

import Chart from "chart.js/auto";
import html2pdf from "html2pdf.js";
import axios from "axios";
import { purchases } from "../../lib/purchases";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PRODUCTS_PATH = "/api/products";
const ITEMS_PATH = "/api/inventory";

/* ---------------- Helpers ---------------- */
const money = (n) => "LKR " + Number(n || 0).toLocaleString();

function discountedUnitPrice(p) {
  const base = Number(p.unitPrice || 0);
  const type = String(p.discountType || "").trim().toLowerCase();
  const raw = p.discountValue;
  if (raw === null || raw === undefined) return base;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return base;
  const isPercent = ["percent", "percentage", "%", "pc", "pct"].includes(type);
  if (isPercent) return Math.max(0, base * (1 - Math.max(0, Math.min(100, value)) / 100));
  return Math.max(0, base - value);
}
function statusOf(stock) {
  if (stock === 0) return "out-of-stock";
  if (stock <= 20) return "low-stock";
  return "in-stock";
}
function ymKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthKey(dateString, fallbackDate = new Date()) {
  const d = new Date(dateString || fallbackDate);
  return isNaN(d) ? ymKey(fallbackDate) : ymKey(d);
}
function toUiProduct(item) {
  const stock = Number(item.stock ?? item.quantity ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
  return {
    sku: String(item.sku || item.code || item.itemCode || item._id || ""),
    name: String(item.name || item.productName || "Unnamed"),
    category: String(item.category || "Uncategorized"),
    stock,
    unitPrice,
    discountType: item.discountType || "",
    discountValue: item.discountValue ?? null,
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || "",
  };
}
function toUiItem(row) {
  const quantity = Number(row.quantity ?? row.stock ?? 0);
  const unitPrice = Number(row.unitPrice ?? row.price ?? 0);
  return {
    name: String(row.name || row.itemName || "Item"),
    quantity,
    unitPrice,
    value: quantity * unitPrice,
    createdAt: row.createdAt || "",
    updatedAt: row.updatedAt || "",
  };
}
function clampToMonth(d) {
  const x = new Date(d);
  if (isNaN(x)) return new Date();
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function monthsBetween(startStr, endStr) {
  const start = clampToMonth(startStr || new Date());
  const end = clampToMonth(endStr || new Date());
  const arr = [];
  const cur = new Date(start);
  while (cur <= end) {
    arr.push(ymKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return arr;
}
function inRange(dateStr, startStr, endStr) {
  if (!startStr && !endStr) return true;
  const t = new Date(dateStr || new Date()).getTime();
  if (isNaN(t)) return true;
  const s = startStr ? new Date(startStr).getTime() : -Infinity;
  const e = endStr ? new Date(endStr).getTime() : Infinity;
  return t >= s && t <= e;
}
const rafDelay = () => new Promise((r) => requestAnimationFrame(() => r()));

/* ======================================== */

export default function Report() {
  const invRef = useRef(null);
  const orderTrendRef = useRef(null);
  const valueRef = useRef(null);
  const stockRef = useRef(null);
  const itemPieRef = useRef(null);
  const reportDateRef = useRef(null);
  const mainRef = useRef(null);
  const chartsRef = useRef([]);

  useEffect(() => {
    const start = document.getElementById("startDate")?.value || "";
    const end = document.getElementById("endDate")?.value || "";
    loadAndRender({ start, end });
    updateReportDate();
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

  /* ------------- Data loading + datasets (date-range aware) ------------- */
  async function loadAndRender({ start, end } = {}) {
    try {
      const [prodRes, itemRes, poRes] = await Promise.allSettled([
        axios.get(`${API_BASE}${PRODUCTS_PATH}`),
        axios.get(`${API_BASE}${ITEMS_PATH}`),
        purchases.list(),
      ]);

      const rawProducts =
        prodRes.status === "fulfilled"
          ? Array.isArray(prodRes.value.data)
            ? prodRes.value.data
            : prodRes.value.data.items || prodRes.value.data.data || []
          : [];
      const rawItems =
        itemRes.status === "fulfilled"
          ? Array.isArray(itemRes.value.data)
            ? itemRes.value.data
            : itemRes.value.data.items || itemRes.value.data.data || []
          : [];
      const rawOrders =
        poRes.status === "fulfilled" && Array.isArray(poRes.value?.data?.orders)
          ? poRes.value.data.orders
          : [];

      const products = rawProducts.map(toUiProduct);
      const items = rawItems.map(toUiItem);

      // KPIs
      const totalProductsUnits = products.reduce((s, p) => s + p.stock, 0);
      const totalItemsUnits = items.reduce((s, i) => s + i.quantity, 0);
      const totalProductsValue = products.reduce((s, p) => s + p.stock * discountedUnitPrice(p), 0);
      const totalItemsValue = items.reduce((s, i) => s + i.value, 0);
      const totalInventoryValue = totalProductsValue + totalItemsValue;
      const lowStockProducts = products.filter((p) => statusOf(p.stock) === "low-stock").length;

      safeText("#kpiTotalProducts", totalProductsUnits.toLocaleString());
      safeText("#kpiTotalItems", totalItemsUnits.toLocaleString());
      safeText("#kpiProductsValue", money(totalProductsValue));
      safeText("#kpiItemsValue", money(totalItemsValue));
      safeText("#kpiInventoryValue", money(totalInventoryValue));
      safeText("#kpiLowStock", String(lowStockProducts));

      // Month range
      const labels = monthsBetween(start, end);

      // Values per month
      const prodValByMonth = new Map(labels.map((m) => [m, 0]));
      const itemValByMonth = new Map(labels.map((m) => [m, 0]));

      products.forEach((p) => {
        const stamp = p.updatedAt || p.createdAt || start || new Date();
        if (!inRange(stamp, start, end)) return;
        const mk = monthKey(stamp, clampToMonth(start || new Date()));
        const val = p.stock * discountedUnitPrice(p);
        prodValByMonth.set(mk, (prodValByMonth.get(mk) || 0) + val);
      });
      items.forEach((i) => {
        const stamp = i.updatedAt || i.createdAt || start || new Date();
        if (!inRange(stamp, start, end)) return;
        const mk = monthKey(stamp, clampToMonth(start || new Date()));
        itemValByMonth.set(mk, (itemValByMonth.get(mk) || 0) + i.value);
      });

      const valueMonths = labels;
      const valueProducts = valueMonths.map((m) => prodValByMonth.get(m) || 0);
      const valueItems = valueMonths.map((m) => itemValByMonth.get(m) || 0);
      const valueCombined = valueMonths.map((_, i) => valueProducts[i] + valueItems[i]);

      // Inventory by Category
      const catMap = new Map();
      products.forEach((p) => {
        const cat = p.category || "Uncategorized";
        if (!catMap.has(cat)) catMap.set(cat, { in: 0, low: 0, out: 0 });
        const s = statusOf(p.stock);
        if (s === "in-stock") catMap.get(cat).in += 1;
        else if (s === "low-stock") catMap.get(cat).low += 1;
        else catMap.get(cat).out += 1;
      });
      const catLabels = Array.from(catMap.keys());
      const catIn = catLabels.map((c) => catMap.get(c).in);
      const catLow = catLabels.map((c) => catMap.get(c).low);
      const catOut = catLabels.map((c) => catMap.get(c).out);

      // Purchase order trends within range
      const trendMap = new Map(labels.map((m) => [m, { pending: 0, completed: 0, cancelled: 0 }]));
      rawOrders.forEach((o) => {
        const stamp = o.orderDate || o.createdAt || start || new Date();
        if (!inRange(stamp, start, end)) return;
        const mk = monthKey(stamp, clampToMonth(start || new Date()));
        const st = String(o.status || "pending").toLowerCase();
        if (!trendMap.has(mk)) trendMap.set(mk, { pending: 0, completed: 0, cancelled: 0 });
        if (st === "pending") trendMap.get(mk).pending += 1;
        else if (st === "approved" || st === "delivered" || st === "complete" || st === "completed")
          trendMap.get(mk).completed += 1;
        else if (st === "cancelled" || st === "canceled") trendMap.get(mk).cancelled += 1;
      });
      const trendMonths = labels;
      const trendPending = trendMonths.map((m) => trendMap.get(m)?.pending || 0);
      const trendCompleted = trendMonths.map((m) => trendMap.get(m)?.completed || 0);
      const trendCancelled = trendMonths.map((m) => trendMap.get(m)?.cancelled || 0);

      // Stock status distribution
      const totalIn = products.filter((p) => statusOf(p.stock) === "in-stock").length;
      const totalLow = products.filter((p) => statusOf(p.stock) === "low-stock").length;
      const totalOut = products.filter((p) => statusOf(p.stock) === "out-of-stock").length;

      // Item inventory share
      const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity);
      const top = sortedItems.slice(0, 6);
      const otherQty = sortedItems.slice(6).reduce((s, x) => s + x.quantity, 0);
      const itemLabels = top.map((i) => i.name).concat(otherQty > 0 ? ["Other"] : []);
      const itemQuantities = top.map((i) => i.quantity).concat(otherQty > 0 ? [otherQty] : []);

      initializeCharts({
        invByCat: { labels: catLabels, in: catIn, low: catLow, out: catOut },
        orderTrends: { labels: trendMonths, pending: trendPending, completed: trendCompleted, cancelled: trendCancelled },
        monthlyValue: { labels: valueMonths, combined: valueCombined, products: valueProducts, items: valueItems },
        stockPie: { values: [totalIn, totalLow, totalOut] },
        itemsPie: { labels: itemLabels, values: itemQuantities },
      });
    } catch (e) {
      console.error("Report load error:", e);
      initializeCharts({
        invByCat: { labels: [], in: [], low: [], out: [] },
        orderTrends: { labels: [], pending: [], completed: [] , cancelled: [] },
        monthlyValue: { labels: [], combined: [], products: [], items: [] },
        stockPie: { values: [0, 0, 0] },
        itemsPie: { labels: [], values: [] },
      });
    }
  }

  function safeText(sel, value) {
    const el = document.querySelector(sel);
    if (el) el.textContent = value;
  }

  /* ---------------- Charts ---------------- */
  function initializeCharts(data) {
    chartsRef.current.forEach((c) => c && c.destroy());
    chartsRef.current = [];

    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // ensure canvas is ready for PDF snapshot
    };

    // Inventory by Category (stacked)
    if (invRef.current) {
      const c = new Chart(invRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: data.invByCat.labels,
          datasets: [
            { label: "In Stock", data: data.invByCat.in, backgroundColor: cssVar("--green") || "#10B981" },
            { label: "Low Stock", data: data.invByCat.low, backgroundColor: cssVar("--amber") || "#F59E0B" },
            { label: "Out of Stock", data: data.invByCat.out, backgroundColor: cssVar("--red") || "#EF4444" },
          ],
        },
        options: {
          ...commonOpts,
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
          labels: data.orderTrends.labels,
          datasets: [
            {
              label: "Pending",
              data: data.orderTrends.pending,
              borderColor: "#F59E0B",
              backgroundColor: "rgba(245,158,11,.12)",
              tension: 0.15,
              fill: true,
            },
            {
              label: "Completed",
              data: data.orderTrends.completed,
              borderColor: "#10B981",
              backgroundColor: "rgba(16,185,129,.12)",
              tension: 0.15,
              fill: true,
            },
            {
              label: "Cancelled",
              data: data.orderTrends.cancelled,
              borderColor: "#EF4444",
              backgroundColor: "rgba(239,68,68,.12)",
              tension: 0.15,
              fill: true,
            },
          ],
        },
        options: { ...commonOpts, scales: { y: { beginAtZero: true } } },
      });
      chartsRef.current.push(c);
    }

    // Monthly Inventory Value — 3 lines
    if (valueRef.current) {
      const c = new Chart(valueRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels: data.monthlyValue.labels,
          datasets: [
            {
              label: "Inventory Value (LKR)",
              data: data.monthlyValue.combined,
              borderColor: "#6366F1",
              backgroundColor: "rgba(99,102,241,.20)",
              fill: true,
              tension: 0.18,
            },
            {
              label: "Products Value (LKR)",
              data: data.monthlyValue.products,
              borderColor: "#10B981",
              backgroundColor: "rgba(16,185,129,.18)",
              fill: false,
              tension: 0.18,
            },
            {
              label: "Items Value (LKR)",
              data: data.monthlyValue.items,
              borderColor: "#F59E0B",
              backgroundColor: "rgba(245,158,11,.18)",
              fill: false,
              tension: 0.18,
            },
          ],
        },
        options: {
          ...commonOpts,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => "LKR " + Number(v).toLocaleString() },
            },
          },
          plugins: {
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.dataset.label}: LKR ${Number(ctx.parsed.y).toLocaleString()}` },
            },
            legend: { position: "top" },
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
          datasets: [{ data: data.stockPie.values, backgroundColor: ["#10B981", "#F59E0B", "#EF4444"], borderWidth: 0 }],
        },
        options: { ...commonOpts },
      });
      chartsRef.current.push(c);
    }

    // Item Inventory Pie
    if (itemPieRef.current) {
      const totalQty = (data.itemsPie.values || []).reduce((a, b) => a + b, 0) || 1;
      const c = new Chart(itemPieRef.current.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: data.itemsPie.labels,
          datasets: [
            {
              data: data.itemsPie.values,
              backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#22C55E"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          ...commonOpts,
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

  /* ---------------- PDF generator (no duplicate breaks) ---------------- */
  async function generateReport() {
    const startDate = document.getElementById("startDate")?.value || "";
    const endDate = document.getElementById("endDate")?.value || "";

    // Refresh charts for the range and wait one frame so canvases are painted
    await loadAndRender({ start: startDate, end: endDate });
    await rafDelay();

    const reportParts = Array.from((mainRef.current || document).querySelectorAll(".report-part"));
    const pdfRoot = document.createElement("div");
    pdfRoot.id = "pdfRoot";

    // copy CSS vars for consistent colors
    ["--ink","--text","--muted","--bg","--card","--line","--brand","--brand-600","--green","--amber","--red","--violet","--indigo"]
      .forEach(v => pdfRoot.style.setProperty(v, cssVar(v)));

    const today = new Date();

    // Cover (force ONE page break after)
    const cover = document.createElement("section");
    cover.className = "pdf-cover";
    cover.style.breakAfter = "page";
    cover.style.pageBreakAfter = "always";
    cover.innerHTML = `
      <div class="brand-row">
        <div class="brand-chip"><i class="fas fa-briefcase"></i> PackPal</div>
        <div style="font-size:12px;color:#475569">Generated: ${today.toLocaleDateString()}</div>
      </div>
      <div class="cover-title">Inventory & Analytics Report</div>
      <div class="cover-sub">Charts & KPIs Summary</div>
      <div class="cover-meta">
        <div class="meta-item"><strong>Period</strong><br>${startDate || "—"} → ${endDate || "—"}</div>
        <div class="meta-item"><strong>Prepared By</strong><br>Automated Reporting Service</div>
      </div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <div style="flex:1;height:6px;background:linear-gradient(90deg,#2563eb,#6366f1);border-radius:999px"></div>
        <div style="flex:1;height:6px;background:linear-gradient(90deg,#10b981,#22c55e);border-radius:999px"></div>
      </div>
    `;
    pdfRoot.appendChild(cover);

    // TOC (force ONE page break after)
    const toc = document.createElement("section");
    toc.className = "pdf-section";
    toc.style.breakAfter = "page";
    toc.style.pageBreakAfter = "always";
    toc.innerHTML = `
      <div class="toc">
        <div class="toc-title"><i class="fas fa-list-ol" style="color:var(--brand)"></i> Table of Contents</div>
        <ul id="tocList"></ul>
      </div>
    `;
    pdfRoot.appendChild(toc);

    // KPI section (no auto pagebreak here)
    const kpiSec = document.createElement("section");
    kpiSec.className = "pdf-section";
    kpiSec.innerHTML = `
      <div class="figure avoid-break" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="figure-title">Figure 1 — Key Performance Indicators</div>
        <div class="kpi-grid" id="kpiGrid"></div>
        <div class="figure-caption">Snapshot of core metrics for the selected period.</div>
      </div>
    `;
    pdfRoot.appendChild(kpiSec);

    // Copy KPI cards from the page
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

    // Figures (NO manual pagebreaks between them)
    const escapeHtml = (s = "") =>
      s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    const tocList = toc.querySelector("#tocList");
    let figNum = 2;
    for (let p = 1; p < reportParts.length; p++) {
      const part = reportParts[p];
      const figure = document.createElement("section");
      figure.className = "pdf-section";
      const clone = part.cloneNode(true);

      // replace canvases with images so html2pdf captures them
      const srcCanvases = part.querySelectorAll("canvas");
      const dstCanvases = clone.querySelectorAll("canvas");
      srcCanvases.forEach((canvas, i) => {
        const img = document.createElement("img");
        try { img.src = canvas.toDataURL("image/png"); } catch {}
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        if (dstCanvases[i]) dstCanvases[i].replaceWith(img);
      });

      const titles = Array.from(clone.querySelectorAll(".card-title")).map((n) => n.textContent.trim());
      const figureTitle = titles.length ? titles.join(" · ") : "Charts";

      figure.innerHTML = `
        <div class="figure avoid-break" style="break-inside: avoid; page-break-inside: avoid;">
          <div class="figure-title">Figure ${figNum} — ${escapeHtml(figureTitle)}</div>
          <div class="figure-img">${clone.innerHTML}</div>
          <div class="figure-caption">Data visualizations for ${startDate || "—"} → ${endDate || "—"}.</div>
        </div>
      `;
      pdfRoot.appendChild(figure);

      const li = document.createElement("li");
      li.innerHTML = `<span>Figure ${figNum} — ${escapeHtml(figureTitle)}</span><span>Page …</span>`;
      tocList.appendChild(li);

      figNum++;
    }

    document.body.appendChild(pdfRoot);

    const opt = {
      margin: [10, 10, 12, 10],
      filename: `inventory-report-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      // IMPORTANT: rely on CSS only — no legacy auto pagebreaks that can double-break
      pagebreak: { mode: ["css"], avoid: [".avoid-break"] },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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

          // Fill TOC pages: assume first figure starts at page 3 (Cover + TOC)
          const tocItems = tocList.querySelectorAll("li");
          let figureStartPage = 3;
          tocItems.forEach((li, idx) => {
            li.querySelector("span:last-child").textContent = figureStartPage + idx;
          });

          for (let i = 1; i <= total; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(120);
            pdf.text("PackPal • Inventory & Analytics", 10, 8);
            pdf.setDrawColor(220);
            pdf.line(10, 10, pageW - 10, 10);

            const label = `Page ${i} of ${total}`;
            pdf.setTextColor(120);
            pdf.text(new Date().toLocaleDateString(), 10, pageH - 6);
            pdf.text(`Period: ${startDate || "—"} → ${endDate || "—"}`, 10, pageH - 12);
            pdf.text(label, pageW - 10 - pdf.getTextWidth(label), pageH - 6);
          }
        })
        .save();
    } finally {
      pdfRoot.remove();
    }
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="report-shell">
      <Sidebar />
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
              <input
                type="date"
                id="startDate"
                defaultValue="2025-06-01"
                className="form-input"
                onChange={(e) =>
                  loadAndRender({ start: e.target.value, end: document.getElementById("endDate")?.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                id="endDate"
                defaultValue="2025-09-30"
                className="form-input"
                onChange={(e) =>
                  loadAndRender({ start: document.getElementById("startDate")?.value, end: e.target.value })
                }
              />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid md-grid-4 report-part">
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Products</div>
                <div className="metric-value" id="kpiTotalProducts">0</div>
              </div>
              <i className="fas fa-box metric-icon brand" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Items</div>
                <div className="metric-value" id="kpiTotalItems">0</div>
              </div>
              <i className="fas fa-chart-bar metric-icon green" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Products Value</div>
                <div className="metric-value" id="kpiProductsValue">LKR 0</div>
              </div>
              <i className="fas fa-wallet metric-icon violet" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Items Value</div>
                <div className="metric-value" id="kpiItemsValue">LKR 0</div>
              </div>
              <i className="fas fa-wallet metric-icon indigo" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Total Inventory Value</div>
                <div className="metric-value" id="kpiInventoryValue">LKR 0</div>
              </div>
              <i className="fas fa-wallet metric-icon violet" />
            </div>
            <div className="metric-card">
              <div>
                <div className="metric-label">Low Stock Items</div>
                <div className="metric-value" id="kpiLowStock">0</div>
              </div>
              <i className="fas fa-triangle-exclamation metric-icon red" />
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

          {/* Footer (not exported) */}
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
