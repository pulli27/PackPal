// src/Components/FinanceDashboard/FinanceDashboard.jsx
import React, { useEffect, useRef, useMemo, useState } from "react";
import Chart from "chart.js/auto";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./FinanceDashboard.css";
import Sidebar from "../Sidebar/Sidebarsanu";
import { api } from "../../lib/api";

/* ===== helpers ===== */
const fmtLKRNum = (n) => {
  const x = Number(n || 0);
  return Math.round(x).toLocaleString("en-LK");
};
const fmtLKR = (n) => `LKR ${fmtLKRNum(n)}`;

const showNotification = (message, type = "info") => {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const colors = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  const icons  = { success:"fa-check-circle", error:"fa-exclamation-circle", warning:"fa-exclamation-triangle", info:"fa-info-circle" };
  const n = document.createElement("div");
  n.className = "notification";
  n.style.cssText = `
    position:fixed; top:16px; right:16px; background:#fff; color:${colors[type]};
    padding:12px 16px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.12);
    border-left:4px solid ${colors[type]}; z-index:10000; display:flex; align-items:center; gap:10px;
    max-width:420px; animation:fd-slideIn .25s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  `;
  n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  if (!document.querySelector("#fd-toast-anim")) {
    const style = document.createElement("style"); style.id = "fd-toast-anim";
    style.textContent = `
      @keyframes fd-slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
      @keyframes fd-slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => { n.style.animation = "fd-slideOut .25s ease"; setTimeout(() => n.remove(), 250); }, 2600);
};

/* ===== month utils ===== */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_MONTHS = 4; // show last 4 months: first 3 = 0, last month = jump
const lastNMonthsLabels = (n = CHART_MONTHS) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return MONTHS[d.getMonth()];
  });
};

/* Fallback: 0,0,0,..., value (jump in the latest month) */
const stepUpSeries = (finalValue = 0, n = CHART_MONTHS) =>
  Array.from({ length: n }, (_, i) => (i === n - 1 ? Number(finalValue || 0) : 0));

export default function FinanceDashboard() {
  // Canvas refs
  const revenueRef = useRef(null);
  const expenseRef = useRef(null);
  const cashFlowRef = useRef(null);

  // Inventory + Products KPI
  const [inv, setInv] = useState({
    inventoryValue: 0, inventoryQty: 0, inventoryItems: 0,
    productValue: 0, productQty: 0, productItems: 0,
    combinedValue: 0,
  });
  const [invLoading, setInvLoading] = useState(true);

  // Revenue KPI
  const [rev, setRev] = useState({ revenue: 0, count: 0, monthly: [] });
  const [revLoading, setRevLoading] = useState(true);

  // Expenses KPI (note: still excludes product value)
  const [exp, setExp] = useState({
    total: 0,
    payroll: 0,
    contrib: 0,
    inventory: 0,
    monthly: [],
    loading: true,
  });

  const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

  // Net Profit derived (Revenue - Expenses)
  const netProfit = useMemo(() => {
    if (revLoading || exp.loading) return null;
    const r = Number(rev?.revenue || 0);
    const e = Number(exp?.total || 0);
    return r - e;
  }, [rev, revLoading, exp]);

  /* Load KPIs */
  useEffect(() => {
    // INVENTORY + PRODUCTS (KPI card)
    (async () => {
      try {
        // Try dedicated products summary; fall back to nested fields under inventory summary if present
        const invP = api.get("/inventory/summary").catch(() => ({ data: {} }));
        const prodP = api.get("/products/summary").catch(() => ({ data: {} }));

        const [{ data: invSum }, { data: prodSum }] = await Promise.all([invP, prodP]);

        // Inventory-only (store/warehouse)
        const invObj = invSum?.inventory ?? invSum ?? {};
        const inventoryValue = Number(invObj?.totalValue || 0);
        const inventoryQty   = Number(invObj?.totalQty   || 0);
        const inventoryItems = Number(invObj?.itemCount  || 0);

        // Product/catalog value (ready-to-sell product valuation)
        const productValue = Number(
          prodSum?.totalValue ??
          invSum?.products?.totalValue ??
          invSum?.productValue ??
          0
        );
        const productQty = Number(
          prodSum?.totalQty ??
          invSum?.products?.totalQty ??
          invSum?.productQty ??
          0
        );
        const productItems = Number(
          prodSum?.itemCount ??
          invSum?.products?.itemCount ??
          invSum?.productItems ??
          0
        );

        const combinedValue = inventoryValue + productValue;

        setInv({
          inventoryValue,
          inventoryQty,
          inventoryItems,
          productValue,
          productQty,
          productItems,
          combinedValue,
        });
      } catch (e) {
        showNotification(e?.response?.data?.message || "Failed to load inventory & product summary", "error");
      } finally {
        setInvLoading(false);
      }
    })();

    // REVENUE
    (async () => {
      try {
        const { data } = await api.get("/transactions/revenue");
        setRev(
          data && typeof data === "object"
            ? {
                revenue: Number(data.revenue || 0),
                count: Number(data.count || 0),
                monthly: Array.isArray(data.monthly) ? data.monthly : [],
              }
            : { revenue: 0, count: 0, monthly: [] }
        );
      } catch (e) {
        showNotification(e?.response?.data?.message || "Failed to load revenue", "error");
      } finally {
        setRevLoading(false);
      }
    })();

    // EXPENSES = payroll (net) + EPF/ETF + inventory-only (no products)
    (async () => {
      try {
        const payrollP = api.get("/salary/summary").catch(() => ({ data: { totalNet: 0, monthly: [] } }));
        const contribP = api.get("/contributions/summary").catch(() => ({ data: { grandTotal: 0, monthly: [] } }));
        const invP     = api.get("/inventory/summary").catch(() => ({ data: {} }));

        const [{ data: payroll }, { data: contrib }, { data: invSum }] =
          await Promise.all([payrollP, contribP, invP]);

        const payrollTotal = Number(payroll?.totalNet || 0);
        const contribTotal = Number(contrib?.grandTotal || 0);

        // inventory-only from backend nested object (keep excluding products from expenses)
        let inventoryOnly = Number(invSum?.inventory?.totalValue || 0);
        if (!Number.isFinite(inventoryOnly)) inventoryOnly = 0;

        // Optional monthly (if backend gives)
        let monthly = [];
        const pArr = Array.isArray(payroll?.monthly) ? payroll.monthly : null;
        const cArr = Array.isArray(contrib?.monthly) ? contrib.monthly : null;
        const iArr = Array.isArray(invSum?.monthly) ? invSum.monthly : null;

        if (pArr || cArr || iArr) {
          const len = Math.max(pArr?.length || 0, cArr?.length || 0, iArr?.length || 0);
          monthly = Array.from({ length: len }).map((_, i) => ({
            month: pArr?.[i]?.month ?? cArr?.[i]?.month ?? iArr?.[i]?.month ?? `M${i + 1}`,
            payroll: Number(pArr?.[i]?.value ?? pArr?.[i]?.payroll ?? 0),
            contrib: Number(cArr?.[i]?.value ?? cArr?.[i]?.contrib ?? 0),
            inventory: Number(iArr?.[i]?.inventory ?? 0),
          }));
        }

        setExp({
          total: payrollTotal + contribTotal + inventoryOnly,
          payroll: payrollTotal,
          contrib: contribTotal,
          inventory: inventoryOnly,
          monthly,
          loading: false,
        });
      } catch {
        showNotification("Failed to load expenses", "error");
        setExp((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  /* Charts */
  useEffect(() => {
    Chart.defaults.font.family =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = "#334155";

    let revenueChart, expenseChart, cashFlowChart;

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Build labels and series (prefer backend monthly, else show 0,0,0, step-up now)
    const labels = lastNMonthsLabels(CHART_MONTHS);

    // Revenue
    const revMonthly = Array.isArray(rev?.monthly) && rev.monthly.length
      ? rev.monthly
      : labels.map((m, idx) => ({ month: m, value: stepUpSeries(rev?.revenue || 0, labels.length)[idx] }));
    const revenueSeries = revMonthly.map((m) => toNum(m?.value ?? m?.revenue));

    // Expenses
    const expMonthly = Array.isArray(exp?.monthly) && exp.monthly.length
      ? exp.monthly
      : labels.map((m, idx) => ({
          month: m,
          payroll: stepUpSeries(exp?.payroll || 0, labels.length)[idx],
          contrib: stepUpSeries(exp?.contrib || 0, labels.length)[idx],
          inventory: stepUpSeries(exp?.inventory || 0, labels.length)[idx],
        }));

    const expensesSeries = expMonthly.map((m) => toNum(m?.payroll) + toNum(m?.contrib) + toNum(m?.inventory));

    // Destroy if re-running
    const destroyAll = () => {
      if (revenueChart) revenueChart.destroy();
      if (expenseChart) expenseChart.destroy();
      if (cashFlowChart) cashFlowChart.destroy();
    };
    destroyAll();

    // Common options
    const grid = { color: "rgba(148, 163, 184, 0.18)", drawBorder: false };
    const ticks = {
      padding: 6,
      callback: (v) => fmtLKRNum(v),
      maxTicksLimit: 6,
    };
    const tooltip = {
      callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtLKR(ctx.parsed.y)}` },
      displayColors: false,
      backgroundColor: "#111827",
      titleColor: "#fff",
      bodyColor: "#fff",
    };
    const legend = { position: "top", labels: { usePointStyle: true, boxWidth: 8, padding: 8 } };

    // 1) Revenue vs Expenses (line)
    if (revenueRef.current) {
      const ctx = revenueRef.current.getContext("2d");
      revenueChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Revenue",
              data: revenueSeries,
              borderColor: "#2563EB",
              backgroundColor: "rgba(37, 99, 235, .10)",
              borderWidth: 2.5,
              fill: true,
              tension: 0.35,
              pointRadius: 2.5,
            },
            {
              label: "Expenses",
              data: expensesSeries,
              borderColor: "#DC2626",
              backgroundColor: "rgba(220, 38, 38, .08)",
              borderWidth: 2.5,
              fill: true,
              tension: 0.35,
              pointRadius: 2.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 6 },
          plugins: { legend, tooltip },
          scales: {
            x: { grid: { display: false } },
            y: { grid, ticks, beginAtZero: true },
          },
        },
      });
    }

    // 2) Expense Breakdown (doughnut)
    if (expenseRef.current) {
      const ctx = expenseRef.current.getContext("2d");
      expenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Payroll", "EPF/ETF", "Inventory"],
          datasets: [{
            data: [exp?.payroll || 0, exp?.contrib || 0, exp?.inventory || 0],
            backgroundColor: ["#7C3AED", "#059669", "#F59E0B"],
            borderWidth: 0,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 8 } },
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.label}: ${fmtLKR(ctx.parsed)}` },
              displayColors: false,
              backgroundColor: "#111827",
              titleColor: "#fff",
              bodyColor: "#fff",
            },
          },
          cutout: "64%",
        },
      });
    }

    // 3) Monthly Cash Flow (bar; inflow positive, outflow negative)
    if (cashFlowRef.current) {
      const ctx = cashFlowRef.current.getContext("2d");
      cashFlowChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Cash Inflow",  data: revenueSeries, backgroundColor: "#16A34A", borderRadius: 5, order: 1 },
            { label: "Cash Outflow", data: expensesSeries.map((v) => -toNum(v)), backgroundColor: "#EF4444", borderRadius: 5, order: 2 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 6 },
          plugins: { legend, tooltip },
          scales: {
            x: { grid: { display: false } },
            y: {
              grid,
              ticks,
              suggestedMin: Math.min(0, -Math.max(...expensesSeries) * 1.1),
              suggestedMax: Math.max(...revenueSeries) * 1.1,
            },
          },
        },
      });
    }

    return () => destroyAll();
  }, [rev, exp]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="finance-page-wrap">
          <div className="content-header">
            <h1>Finance Dashboard</h1>
            <p>Real-time financial insights and analytics</p>
          </div>

          {/* KPI Cards */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Total Revenue</div>
              <div className="kpi-value">{revLoading ? "…" : fmtLKR(rev.revenue)}</div>
              <div className="kpi-change positive">{revLoading ? "loading…" : `${rev.count} transactions`}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Total Expenses</div>
              <div className="kpi-value">{exp.loading ? "…" : fmtLKR(exp.total)}</div>
              <div className="kpi-change negative">
                {exp.loading
                  ? "loading…"
                  : `Payroll ${fmtLKR(exp.payroll)} • EPF/ETF ${fmtLKR(exp.contrib)} • Inventory ${fmtLKR(exp.inventory)} (no products)`}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Net Profit</div>
              <div className="kpi-value">{netProfit === null ? "…" : fmtLKR(netProfit)}</div>
              <div className={`kpi-change ${Number(netProfit) >= 0 ? "positive" : "negative"}`}>
                {netProfit === null
                  ? "calculating…"
                  : Number(netProfit) >= 0
                    ? "↗ Revenue exceeds expenses"
                    : "↘ Expenses exceed revenue"}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Inventory Value</div>
              <div className="kpi-value">
                {invLoading ? "…" : fmtLKR(inv.combinedValue)}
              </div>
              <div className="kpi-change positive">
                {invLoading
                  ? "loading…"
                  : `Inventory ${fmtLKR(inv.inventoryValue)} • Products ${fmtLKR(inv.productValue)}  |  ` +
                    `${(inv.inventoryItems + inv.productItems) || 0} items • ${(inv.inventoryQty + inv.productQty) || 0} units`}
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="top-charts">
            <div className="chart-card">
              <div className="chart-title">📈 Revenue vs Expenses Trend</div>
              <div className="chart-container small">
                <canvas ref={revenueRef} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">🥧 Expense Breakdown</div>
              <div className="chart-container small">
                <canvas ref={expenseRef} />
              </div>
            </div>
          </section>

          <section className="bottom-charts">
            <div className="chart-card">
              <div className="chart-title">💰 Monthly Cash Flow</div>
              <div className="chart-container small">
                <canvas ref={cashFlowRef} />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
