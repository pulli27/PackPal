// src/Components/FinancialReport/FinancialReport.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./FinancialReport.css";
import Sidebar from "../Sidebar/Sidebarsanu";
import { api } from "../../lib/api";

/* ========== helpers ========== */
const fmtLKRNum = (n) => Math.round(Number(n || 0)).toLocaleString("en-LK");
const fmtLKR = (n) => `LKR ${fmtLKRNum(n)}`;
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmtDate = (d) => new Date(d).toISOString().split("T")[0];

/* tolerant revenue calc for a transaction object */
const lineTotal = (t) => {
  const q = toNum(t?.qty ?? t?.quantity ?? 0);
  const p = toNum(t?.unitPrice ?? t?.price ?? 0);
  const d = toNum(t?.discountPerUnit ?? t?.discount ?? 0);
  const explicit = t?.total;
  const calc = q * p - q * d;
  const n = Number(explicit);
  return Number.isFinite(n) ? n : calc;
};

/* toast */
const toast = (message, type = "info") => {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const colors = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  const icons  = { success:"fa-check-circle", error:"fa-exclamation-circle", warning:"fa-exclamation-triangle", info:"fa-info-circle" };
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
      @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
      @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => { n.style.animation = "slideOut .3s ease"; setTimeout(() => n.remove(), 300); }, 2600);
};

/* deep numeric getter */
const getNum = (obj, paths = []) => {
  for (const p of paths) {
    try {
      const val = p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    } catch {}
  }
  return 0;
};

/* month helpers */
const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
};
const monthLabel = (key) => {
  const [y,m] = key.split("-");
  return new Date(Number(y), Number(m)-1, 1).toLocaleString("en", { month:"short" });
};
const generateMonthRange = (fromISO, toISO, maxMonths = 12) => {
  const start = new Date(fromISO);
  const end = new Date(toISO);
  if (start > end) [fromISO, toISO] = [toISO, fromISO];
  const s = new Date(fromISO);
  const e = new Date(toISO);
  s.setDate(1); e.setDate(1);
  const keys = [];
  const cur = new Date(e);
  for (let i = 0; i < maxMonths; i++) {
    keys.unshift(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`);
    cur.setMonth(cur.getMonth()-1);
    if (cur < s) break;
  }
  const labels = keys.map(monthLabel);
  return { keys, labels };
};

/* ========== component ========== */
function FinancialReport() {
  /* Refs for charts */
  const revenueRef = useRef(null);
  const expenseRef = useRef(null);
  const profitRef  = useRef(null);
  const budgetRef  = useRef(null);
  const dateFromRef = useRef(null);
  const dateToRef   = useRef(null);

  /* UI state */
  const [reportType, setReportType] = useState("All Reports");
  const [department, setDepartment] = useState("All Departments");
  const [generating, setGenerating] = useState(false);

  /* Dashboard KPIs (cards) */
  const [dash, setDash] = useState({ revenue: 0, expenses: 0, net: 0 });

  /* Chart data state (from backend) */
  const [chartsData, setChartsData] = useState({
    revenueMonthly: { labels: [], values: [] },
    expenseByCategory: { labels: [], values: [] },
    profitMarginMonthly: { labels: [], values: [] }, // percentage numbers
    budgetVsActual: { labels: [], budget: [], actual: [] },
  });

  /* ================= Fetch dashboard KPIs ================= */
  useEffect(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    if (dateFromRef.current) dateFromRef.current.valueAsDate = first;
    if (dateToRef.current) dateToRef.current.valueAsDate = today;

    setTimeout(() => toast("Welcome to Financial Reports! Generate and download your reports here.", "success"), 300);

    const loadKPIs = async () => {
      const fromISO = dateFromRef.current?.value || fmtDate(new Date());
      const toISO   = dateToRef.current?.value   || fmtDate(new Date());
      const qs = `?start=${encodeURIComponent(fromISO)}&end=${encodeURIComponent(toISO)}`;

      const attempts = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/dashboard"),
        api.get("/dashboard/kpis"),
        api.get(`/transactions/revenue${qs}`),
        api.get(`/transactions${qs}&limit=2000&sort=-date`),
        api.get(`/finance/operating-expenses/summary${qs}`),
        api.get(`/salary/summary${qs}`),
        api.get(`/contributions/summary${qs}`),
        api.get(`/finance/other-expenses${qs}`),
      ]);

      const [sum, dashRoot, kpis, revAgg, txList, opexSum, salarySum, contribSum, otherExp] =
        attempts.map(a => (a.status === "fulfilled" ? a.value?.data : null));

      /* revenue */
      let revenue =
        getNum(sum,      ["revenue","sales","totals.revenue","kpis.revenue","cards.revenue.value","dashboard.revenue"]) ||
        getNum(dashRoot, ["revenue","sales","totals.revenue","kpis.revenue","cards.revenue.value"]) ||
        getNum(kpis,     ["revenue","sales","totals.revenue"]) ||
        getNum(revAgg,   ["revenue","total","value"]);

      if (!revenue && Array.isArray(txList)) {
        revenue = txList.reduce((acc, t) => (t?.status === "refund" ? acc : acc + lineTotal(t)), 0);
      }

      /* expenses */
      let expenses =
        getNum(sum,      ["expenses","expense","totals.expenses","totals.expense","kpis.expenses","cards.expenses.value","dashboard.expenses"]) ||
        getNum(dashRoot, ["expenses","expense","totals.expenses","kpis.expenses","cards.expenses.value"]) ||
        getNum(kpis,     ["expenses","totals.expenses"]) ||
        getNum(opexSum,  ["total"]);

      if (!expenses) {
        const salaryNet = getNum(salarySum, ["totalNet","net","total"]);
        const contrib   = getNum(contribSum, ["grandTotal","total"]);
        const other     = getNum(otherExp,   ["total","sum","value"]);
        const composed  = getNum(opexSum, ["total"]) + salaryNet + contrib + other;
        expenses = composed || 0;
      }

      const net = revenue - expenses;
      setDash({ revenue: revenue || 0, expenses: expenses || 0, net: net || 0 });
    };

    loadKPIs();
  }, []);

  /* ================= Fetch chart datasets (12 months + expenses from dashboard/same as dashboard page) ================= */
  const fetchChartsData = async () => {
    const fromISO = dateFromRef.current?.value || fmtDate(new Date());
    const toISO   = dateToRef.current?.value   || fmtDate(new Date());
    const { keys: monthKeys, labels: monthLabels } = generateMonthRange(fromISO, toISO, 12);
    const qs = `?start=${encodeURIComponent(fromISO)}&end=${encodeURIComponent(toISO)}`;

    const tryGet = async (path, fallback = null) => {
      try { const { data } = await api.get(path); return data ?? fallback; }
      catch { return fallback; }
    };

    /* ---- Monthly Revenue ---- */
    let revenueMonthly = await (async () => {
      const c1 = await tryGet(`/analytics/revenue/monthly${qs}`);
      const c2 = c1 || await tryGet(`/transactions/revenue/monthly${qs}`);
      const c3 = c2 || await tryGet(`/reports/revenue/monthly${qs}`);
      let map = {};
      if (Array.isArray(c3)) {
        c3.forEach(r => {
          const k = r?.key || r?.month || monthKey(r?.date || new Date());
          map[String(k)] = toNum(r?.revenue ?? r?.total ?? r?.value);
        });
      } else {
        const tx = await tryGet(`/transactions${qs}&limit=5000`);
        if (Array.isArray(tx)) {
          tx.forEach(t => {
            if (t?.status === "refund") return;
            const k = monthKey(t?.date || t?.createdAt || Date.now());
            map[k] = (map[k] || 0) + lineTotal(t);
          });
        }
      }
      const values = monthKeys.map(k => map[k] || 0);
      return { labels: monthLabels, values };
    })();

    /* ---- Expense by Category (MIRROR THE DASHBOARD LOGIC) ---- */
    let expenseByCategory = await (async () => {
      // 1) If dashboard exposes a ready-made breakdown, use it.
      const d1 = await tryGet(`/dashboard/expenses/categories${qs}`);
      if (Array.isArray(d1) && d1.length) {
        return {
          labels: d1.map(x => x?.category ?? x?.name ?? x?.label ?? "Other"),
          values: d1.map(x => toNum(x?.amount ?? x?.total ?? x?.value ?? 0)),
        };
      }
      const d2 = await tryGet(`/dashboard${qs}`);
      const list = d2?.expenses?.categories || d2?.cards?.expenses?.breakdown || d2?.categories;
      if (Array.isArray(list) && list.length) {
        return {
          labels: list.map(x => x?.category ?? x?.name ?? x?.label ?? "Other"),
          values: list.map(x => toNum(x?.amount ?? x?.total ?? x?.value ?? 0)),
        };
      }

      // 2) Otherwise compute the SAME 3 buckets your dashboard uses:
      //    Payroll (net) + EPF/ETF + Inventory value (no products)
      const [payroll, contrib, invSum] = await Promise.all([
        tryGet(`/salary/summary${qs}`, { totalNet: 0 }),
        tryGet(`/contributions/summary${qs}`, { grandTotal: 0 }),
        tryGet(`/inventory/summary${qs}`, { inventory: { totalValue: 0 } }),
      ]);

      const payrollTotal = toNum(payroll?.totalNet);
      const contribTotal = toNum(contrib?.grandTotal);
      const inventoryOnly = toNum(invSum?.inventory?.totalValue);

      return {
        labels: ["Payroll", "EPF/ETF", "Inventory"],
        values: [payrollTotal, contribTotal, inventoryOnly],
      };
    })();

    /* ---- Profit Margin Monthly ---- */
    const profitMarginMonthly = await (async () => {
      const pm = await tryGet(`/analytics/profit-margin/monthly${qs}`);
      if (Array.isArray(pm) && pm.length) {
        const map = {};
        pm.forEach(r => { map[String(r?.key || r?.month)] = toNum(r?.margin ?? r?.value ?? 0); });
        return { labels: monthLabels, values: monthKeys.map(k => map[k] ?? 0) };
      }
      const cogsMonthly = await tryGet(`/finance/cogs/monthly${qs}`);
      const opexMonthly = await tryGet(`/finance/operating-expenses/monthly${qs}`);
      const cogsMap = mapFromArray(cogsMonthly, ["month","key"], ["total","value"]);
      const opexMap = mapFromArray(opexMonthly, ["month","key"], ["total","value"]);
      const values = monthKeys.map((k, i) => {
        const rev = revenueMonthly.values[i] || 0;
        const cogs = cogsMap[k] || 0;
        const opex = opexMap[k] || 0;
        return rev ? Math.round(((rev - cogs - opex) / rev) * 1000) / 10 : 0;
      });
      return { labels: monthLabels, values };
    })();

    /* ---- Budget vs Actual ---- */
    const budgetVsActual = await (async () => {
      const budget = await tryGet(`/budget/summary${qs}`);
      if (Array.isArray(budget) && budget.length) {
        const labels = budget.map(b => b?.department ?? b?.label ?? "Dept");
        const budgetVals = budget.map(b => toNum(b?.budget ?? b?.planned ?? 0));
        const actuals = await tryGet(`/finance/expenses/by-department${qs}`);
        let actualMap = {};
        if (Array.isArray(actuals)) actuals.forEach(a => { actualMap[a?.department ?? a?.label] = toNum(a?.amount ?? a?.total ?? 0); });
        const actualVals = labels.map(l => toNum(actualMap[l] ?? 0));
        return { labels, budget: budgetVals, actual: actualVals };
      }
      // fallback: use expense categories as "departments"
      const labels = expenseByCategory.labels.length ? expenseByCategory.labels : ["Payroll","EPF/ETF","Inventory"];
      const actual = labels.map((_,i) => toNum(expenseByCategory.values[i] ?? 0));
      const defaultBudgets = [150000,80000,60000,45000,35000];
      const budgetVals = labels.map((_,i) => toNum(defaultBudgets[i % defaultBudgets.length]));
      return { labels, budget: budgetVals, actual };
    })();

    setChartsData({ revenueMonthly, expenseByCategory, profitMarginMonthly, budgetVsActual });
  };

  /* string & mapping helpers for charts */
  const titleCase = (s="") => s.replace(/[_\-]+/g," ").replace(/\b\w/g, m => m.toUpperCase());
  const mapFromArray = (arr, keyCandidates, valCandidates) => {
    const m = {};
    if (!Array.isArray(arr)) return m;
    arr.forEach(it => {
      const k = keyCandidates.map(k => it?.[k]).find(Boolean);
      const v = valCandidates.map(v => it?.[v]).find(v => Number.isFinite(Number(v)));
      if (k != null) m[String(k)] = Number(v) || 0;
    });
    return m;
  };

  /* Trigger charts fetch on mount & when dates change via Generate */
  useEffect(() => { fetchChartsData(); /* eslint-disable-next-line */ }, []);
  const handleGenerate = async () => {
    setGenerating(true);
    await fetchChartsData();
    setGenerating(false);
    const from = dateFromRef.current?.value || fmtDate(new Date());
    const to   = dateToRef.current?.value   || fmtDate(new Date());
    toast(`${reportType} generated successfully for ${from} to ${to}`, "success");
  };

  /* ================= Build/Update charts from state ================= */
  const chartInstances = useRef({});
  const buildOrUpdate = (key, configBuilder) => {
    const el = ({
      revenue: revenueRef,
      expense: expenseRef,
      profit:  profitRef,
      budget:  budgetRef,
    })[key]?.current;
    if (!el) return;

    const existing = chartInstances.current[key];
    const cfg = configBuilder(existing);

    if (existing) {
      existing.data.labels = cfg.data.labels;
      existing.data.datasets = cfg.data.datasets;
      existing.update();
    } else {
      chartInstances.current[key] = new Chart(el.getContext("2d"), cfg);
    }
  };

  useEffect(() => {
    const c = chartsData;

    /* Revenue trend */
    buildOrUpdate("revenue", () => ({
      type: "line",
      data: {
        labels: c.revenueMonthly.labels,
        datasets: [{
          label: "Revenue",
          data: c.revenueMonthly.values,
          borderColor: "#667eea",
          backgroundColor: "rgba(102,126,234,0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => "LKR " + (v/1000).toLocaleString("en-LK") + "K" } } }
      }
    }));

    /* Expense categories (from dashboard / mirrored calc) */
    buildOrUpdate("expense", () => ({
      type: "doughnut",
      data: {
        labels: c.expenseByCategory.labels.map(titleCase),
        datasets: [{
          data: c.expenseByCategory.values,
          backgroundColor: ["#8B5CF6","#06D6A0","#FFB703","#FB8500","#8ECAE6","#94A3B8","#F472B6"],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, font: { size: 10 } } } },
        cutout: "62%",
      }
    }));

    /* Profit margin */
    buildOrUpdate("profit", () => ({
      type: "bar",
      data: {
        labels: c.profitMarginMonthly.labels,
        datasets: [{ label: "Profit Margin %", data: c.profitMarginMonthly.values, backgroundColor: "#10B981", borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + "%" } } }
      }
    }));

    /* Budget vs Actual */
    buildOrUpdate("budget", () => ({
      type: "bar",
      data: {
        labels: c.budgetVsActual.labels,
        datasets: [
          { label: "Budget", data: c.budgetVsActual.budget, backgroundColor: "#E5E7EB", borderRadius: 4 },
          { label: "Actual", data: c.budgetVsActual.actual, backgroundColor: "#667eea", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 15, font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => "LKR " + (v/1000).toLocaleString("en-LK") + "K" } } }
      }
    }));

    return () => {}; // keep instances alive; they update in-place
  }, [chartsData]);

  /* ========== Report utils (unchanged core) ========== */
  const inferType = (name) =>
    /profit|loss/i.test(name) ? "Profit & Loss Statement" :
    /balance/i.test(name) ? "Balance Sheet" :
    /budget/i.test(name) ? "Budget Analysis" : "Report";

  const safeGet = async (path, fallback = {}) => {
    try { const { data } = await api.get(path); return data || fallback; }
    catch { return fallback; }
  };

  /* ===== Balance Sheet / P&L builders (same as before) ===== */
  const fetchBalanceSheetData = async (startISO, endISO) => {
    const params = (startISO || endISO)
      ? `?start=${encodeURIComponent(startISO || "")}&end=${encodeURIComponent(endISO || "")}`
      : "";

    const inv  = await safeGet("/inventory/summary", {});
    const prod = await safeGet("/products/summary", {});
    const inventoryValue = toNum(inv?.inventory?.totalValue ?? inv?.totalValue ?? 0);
    const productsValue  = toNum(prod?.totalValue ?? inv?.products?.totalValue ?? inv?.productValue ?? 0);

    const cash = await safeGet(`/finance/cash-summary${params}`, { total: 0 });
    const receivables = await safeGet(`/finance/receivables/summary${params}`, { total: 0 });
    const payables    = await safeGet(`/finance/payables/summary${params}`,    { total: 0 });

    const cashBank = toNum(cash?.total ?? 0);
    const ar = toNum(receivables?.total ?? 0);
    const ap = toNum(payables?.total ?? 0);

    const fixed = await safeGet(`/finance/fixed-assets${params}`, { total: 0 });
    const otherAssets = await safeGet(`/finance/other-assets${params}`, { total: 0 });
    const fixedAssets = toNum(fixed?.total ?? 0);
    const otherA = toNum(otherAssets?.total ?? 0);

    const contrib = await safeGet(`/contributions/summary${params}`, { grandTotal: 0 });
    const epfEtfPayable = toNum(contrib?.grandTotal ?? 0);

    const salarySummary = await safeGet(`/salary/summary${params}`, { payable: 0, totalNet: 0 });
    const salaryPayable = toNum(salarySummary?.payable ?? 0);

    const otherLiab = await safeGet(`/finance/other-liabilities${params}`, { total: 0 });
    const otherLiabilities = toNum(otherLiab?.total ?? 0);

    const revenue = await safeGet(`/transactions/revenue${params}`, { revenue: 0, count: 0 });
    const cogs    = await safeGet(`/finance/cogs${params}`, { total: 0 });
    const otherExp= await safeGet(`/finance/other-expenses${params}`, { total: 0 });

    const salesRevenue = toNum(revenue?.revenue ?? 0);
    const costOfGoods  = toNum(cogs?.total ?? 0);

    const payrollNet = toNum(salarySummary?.totalNet ?? 0);
    const epfEtf     = toNum(contrib?.grandTotal ?? 0);
    const websiteOps = toNum(otherExp?.website ?? otherExp?.total ?? 0);
    const otherOps   = toNum(otherExp?.other ?? 0);

    const operatingExpenses = payrollNet + epfEtf + websiteOps + otherOps;
    const totalExpenses = costOfGoods + operatingExpenses;
    const grossProfit = salesRevenue - costOfGoods;
    const netProfit = salesRevenue - totalExpenses;

    const ownerCapital = toNum((await safeGet(`/finance/equity/capital${params}`, { total: 0 }))?.total ?? 0);
    const retainedEarnings = netProfit;

    const totalAssets = cashBank + ar + (inventoryValue + productsValue) + fixedAssets + otherA;
    const totalLiabilities = ap + epfEtfPayable + salaryPayable + otherLiabilities;
    const totalEquity = ownerCapital + retainedEarnings;
    const totalLiaEq = totalLiabilities + totalEquity;

    return {
      asOf: endISO || fmtDate(new Date()),
      assets: { cashBank, accountsReceivable: ar, inventoryBags: inventoryValue + productsValue, fixedAssets, otherAssets: otherA, totalAssets },
      liabilities: { accountsPayable: ap, epfEtfPayable, salaryPayable, otherLiabilities, totalLiabilities },
      equity: { ownerCapital, retainedEarnings, totalEquity, totalLiaEq },
      pl: {
        salesRevenue, costOfGoods, grossProfit,
        payroll: payrollNet, epfEtf, website: websiteOps, other: otherOps,
        operatingExpenses, totalExpenses, netProfit,
      },
    };
  };

  const buildBalanceSheetHTML = (companyName, data) => {
    const v = (n) => fmtLKRNum(n);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${companyName} – Balance Sheet</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
<style>
body{background:#f6f7fb;margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial}
.sheet{max-width:900px;margin:0 auto}.header{background:#fff;border-radius:16px;padding:18px 22px;box-shadow:0 10px 24px rgba(0,0,0,.06);text-align:center;margin-bottom:14px}
.brand{font-size:28px;font-weight:800;color:#4F46E5;margin-bottom:6px}.subtitle{font-size:15px;color:#374151;margin-bottom:8px}
.asof{display:inline-block;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;font-size:13px;color:#374151}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.card{background:#fff;border-radius:12px;box-shadow:0 8px 22px rgba(0,0,0,.06);padding:14px 14px 10px}
.card h3{margin:0 0 10px 0;font-size:12px;color:#6b7280;letter-spacing:.8px}.row{display:flex;align-items:center;justify-content:space-between;margin:8px 0}
.row .lbl{font-size:13px;color:#374151}.row .val{min-width:120px;text-align:right;background:#f3f4f6;border-radius:8px;padding:6px 10px;font-weight:700;color:#111827}
.total{margin-top:10px;padding-top:8px;border-top:2px solid #e5e7eb}.total .val{background:#4F46E5;color:#fff}.footer-card{grid-column:1 / -1;background:#fff;border-radius:12px;box-shadow:0 8px 22px rgba(0,0,0,.06);padding:14px}
.btnbar{text-align:center;margin-top:14px}.btn{display:inline-block;background:#4F46E5;color:#fff;border-radius:999px;padding:10px 16px;text-decoration:none;font-weight:700}
@media print {.btnbar{display:none}}
</style></head>
<body><div class="sheet">
  <div class="header"><div class="brand">${companyName}</div><div class="subtitle">Balance Sheet</div><div class="asof">As of ${data.asOf}</div></div>
  <div class="grid">
    <div class="card">
      <h3>ASSETS</h3>
      <div class="row"><div class="lbl">Cash & Bank</div><div class="val">${v(data.assets.cashBank)}</div></div>
      <div class="row"><div class="lbl">Accounts Receivable</div><div class="val">${v(data.assets.accountsReceivable)}</div></div>
      <div class="row"><div class="lbl">Inventory (Bags)</div><div class="val">${v(data.assets.inventoryBags)}</div></div>
      <div class="row"><div class="lbl">Website & Equipment</div><div class="val">${v(data.assets.fixedAssets)}</div></div>
      <div class="row"><div class="lbl">Other Assets</div><div class="val">${v(data.assets.otherAssets)}</div></div>
      <div class="row total"><div class="lbl"><strong>TOTAL ASSETS</strong></div><div class="val">${v(data.assets.totalAssets)}</div></div>
    </div>
    <div class="card">
      <h3>LIABILITIES & EQUITY</h3>
      <div class="row"><div class="lbl"><em>Liabilities:</em></div><div></div></div>
      <div class="row"><div class="lbl">Accounts Payable</div><div class="val">${v(data.liabilities.accountsPayable)}</div></div>
      <div class="row"><div class="lbl">EPF/ETF Payable</div><div class="val">${v(data.liabilities.epfEtfPayable)}</div></div>
      <div class="row"><div class="lbl">Salary Payable</div><div class="val">${v(data.liabilities.salaryPayable)}</div></div>
      <div class="row"><div class="lbl">Other Liabilities</div><div class="val">${v(data.liabilities.otherLiabilities)}</div></div>
      <div class="row"><div class="lbl">Total Liabilities</div><div class="val">${v(data.liabilities.totalLiabilities)}</div></div>
      <div class="row" style="margin-top:10px"><div class="lbl"><em>Equity:</em></div><div></div></div>
      <div class="row"><div class="lbl">Owner’s Capital</div><div class="val">${v(data.equity.ownerCapital)}</div></div>
      <div class="row"><div class="lbl">Retained Earnings</div><div class="val">${v(data.equity.retainedEarnings)}</div></div>
      <div class="row"><div class="lbl">Total Equity</div><div class="val">${v(data.equity.totalEquity)}</div></div>
      <div class="row total"><div class="lbl"><strong>TOTAL LIAB. & EQUITY</strong></div><div class="val">${v(data.equity.totalLiaEq)}</div></div>
    </div>
    <div class="footer-card">
      <h3>PROFIT & LOSS SUMMARY</h3>
      <div class="row"><div class="lbl">Sales Revenue (Bags)</div><div class="val">${v(data.pl.salesRevenue)}</div></div>
      <div class="row"><div class="lbl">Cost of Goods Sold</div><div class="val">${v(data.pl.costOfGoods)}</div></div>
      <div class="row"><div class="lbl"><strong>Gross Profit</strong></div><div class="val">${v(data.pl.grossProfit)}</div></div>
      <div class="row" style="margin-top:10px"><div class="lbl"><em>Operating Expenses:</em></div><div></div></div>
      <div class="row"><div class="lbl">Employee Salaries</div><div class="val">${v(data.pl.payroll)}</div></div>
      <div class="row"><div class="lbl">EPF/ETF Contributions</div><div class="val">${v(data.pl.epfEtf)}</div></div>
      <div class="row"><div class="lbl">Website Expenses</div><div class="val">${v(data.pl.website)}</div></div>
      <div class="row"><div class="lbl">Other Expenses</div><div class="val">${v(data.pl.other)}</div></div>
      <div class="row"><div class="lbl"><strong>Total Expenses</strong></div><div class="val">${v(data.pl.totalExpenses)}</div></div>
      <div class="row total"><div class="lbl"><strong>NET PROFIT/LOSS</strong></div><div class="val">${v(data.pl.netProfit)}</div></div>
    </div>
  </div>
  <div class="btnbar"><a class="btn" href="javascript:window.print()">🖨️  Print / Save as PDF</a></div>
</div></body></html>`;
  };

  /* ===== P&L (kept) ===== */
  const fetchIncomeStatementData = async (startISO, endISO) => {
    const qs = (startISO || endISO)
      ? `?start=${encodeURIComponent(startISO || "")}&end=${encodeURIComponent(endISO || "")}`
      : "";

    // Revenue
    let revenueTotal = 0;
    let revenueBreak = { online: 0, wholesale: 0, custom: 0, other: 0 };
    const revSummary = await safeGet(`/transactions/revenue${qs}`, null);

    if (revSummary && typeof revSummary === "object" && Number.isFinite(Number(revSummary?.revenue))) {
      revenueTotal = Number(revSummary.revenue || 0);
    } else {
      const list = await safeGet(`/transactions${qs}&limit=2000&sort=-date`, []);
      (Array.isArray(list) ? list : []).forEach((t) => {
        if (t?.status === "refund") return;
        const val = lineTotal(t);
        const ch  = (t?.method || "").toLowerCase();
        const pn  = (t?.productName || "").toLowerCase();

        if (ch.includes("wholesale")) revenueBreak.wholesale += val;
        else if (pn.includes("custom")) revenueBreak.custom += val;
        else if (ch.includes("online") || ch.includes("retail")) revenueBreak.online += val;
        else revenueBreak.other += val;
      });
      revenueTotal =
        revenueBreak.online + revenueBreak.wholesale + revenueBreak.custom + revenueBreak.other;
    }

    // COGS & OPEX
    const cogs = await safeGet(`/finance/cogs${qs}`, {});
    const materials     = toNum(cogs?.materials ?? cogs?.rawMaterials ?? 0);
    const manufacturing = toNum(cogs?.manufacturing ?? 0);
    const packaging     = toNum(cogs?.packaging ?? 0);
    const shipping      = toNum(cogs?.shipping ?? cogs?.logistics ?? 0);
    const totalCOGS     = toNum(cogs?.total ?? (materials + manufacturing + packaging + shipping));

    const payroll   = await safeGet(`/salary/summary${qs}`, { totalNet: 0 });
    const contrib   = await safeGet(`/contributions/summary${qs}`, { grandTotal: 0 });
    const opex      = await safeGet(`/finance/operating-expenses${qs}`, {});
    const epfTotal  = toNum(opex?.epf ?? contrib?.epf ?? Math.round((contrib?.grandTotal || 0) * 0.8));
    const etfTotal  = toNum(opex?.etf ?? contrib?.etf ?? ((contrib?.grandTotal || 0) - epfTotal));
    const website   = toNum(opex?.website ?? opex?.hosting ?? 0);
    const marketing = toNum(opex?.marketing ?? opex?.ads ?? 0);
    const gateway   = toNum(opex?.gateway ?? opex?.paymentFees ?? 0);
    const office    = toNum(opex?.office ?? opex?.rentUtilities ?? 0);
    const insurance = toNum(opex?.insurance ?? 0);
    const professional = toNum(opex?.professional ?? 0);
    const otherOp   = toNum(opex?.other ?? 0);

    const salaryNet = toNum(payroll?.totalNet ?? 0);
    const operatingTotal =
      salaryNet + epfTotal + etfTotal + website + marketing + gateway + office + insurance + professional + otherOp;

    const grossProfit = revenueTotal - totalCOGS;
    const netIncome   = grossProfit - operatingTotal;

    return {
      period: { from: startISO, to: endISO },
      revenue: {
        online: toNum(revenueBreak.online || 0),
        wholesale: toNum(revenueBreak.wholesale || 0),
        custom: toNum(revenueBreak.custom || 0),
        other: toNum(revenueBreak.other || 0),
        total: revenueTotal,
      },
      cogs: { materials, manufacturing, packaging, shipping, total: totalCOGS },
      opex: {
        salary: salaryNet, epf12: epfTotal, etf3: etfTotal, website,
        marketing, gateway, office, insurance, professional, other: otherOp,
        total: operatingTotal
      },
      grossProfit,
      netIncome,
    };
  };

  const buildIncomeStatementHTML = (companyName, asOf, pl) => {
    const v = (n) => fmtLKRNum(n);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${companyName} – Profit & Loss</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
<style>
body{background:#f6f7fb;margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial}
.sheet{max-width:820px;margin:0 auto}.header{background:#fff;border-radius:16px;padding:18px 22px;box-shadow:0 10px 24px rgba(0,0,0,.06);text-align:center;margin-bottom:16px}
.brand{font-size:26px;font-weight:800;color:#4F46E5;margin-bottom:6px}.subtitle{font-size:15px;color:#374151;margin-bottom:8px}
.period{display:inline-block;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;font-size:13px;color:#374151}
.section{background:#fff;border-radius:12px;box-shadow:0 8px 22px rgba(0,0,0,.06);padding:14px;margin-bottom:14px}
.sec-head{display:flex;align-items:center;gap:8px;font-weight:800;color:#374151;margin-bottom:10px}
.row{display:flex;justify-content:space-between;align-items:center;margin:8px 0}
.lab{font-size:13px;color:#374151}.val{min-width:120px;text-align:right;background:#f3f4f6;border-radius:8px;padding:6px 10px;font-weight:700;color:#111827}
.totalRow{margin-top:10px;padding-top:8px;border-top:2px solid #e5e7eb}.totalRow .val{background:#4F46E5;color:#fff}
.highlight{background:#4338CA;color:#fff}.btnbar{text-align:center;margin-top:14px}
.btn{display:inline-block;background:#4F46E5;color:#fff;border-radius:999px;padding:10px 16px;text-decoration:none;font-weight:700}
@media print {.btnbar{display:none}}
</style></head>
<body><div class="sheet">
  <div class="header"><div class="brand">${companyName}</div><div class="subtitle">Profit & Loss Statement</div><div class="period">As of ${asOf}</div></div>
  <div class="section">
    <div class="sec-head">🟦 REVENUE</div>
    <div class="row"><div class="lab">Online Bag Sales</div><div class="val">${v(pl.revenue.online)}</div></div>
    <div class="row"><div class="lab">Wholesale Bag Sales</div><div class="val">${v(pl.revenue.wholesale)}</div></div>
    <div class="row"><div class="lab">Custom Orders</div><div class="val">${v(pl.revenue.custom)}</div></div>
    <div class="row"><div class="lab">Other Revenue</div><div class="val">${v(pl.revenue.other)}</div></div>
    <div class="row totalRow"><div class="lab"><strong>TOTAL REVENUE</strong></div><div class="val">${v(pl.revenue.total)}</div></div>
  </div>
  <div class="section">
    <div class="sec-head">🟩 COST OF GOODS SOLD</div>
    <div class="row"><div class="lab">Raw Materials (Fabric, Leather, etc.)</div><div class="val">${v(pl.cogs.materials)}</div></div>
    <div class="row"><div class="lab">Manufacturing Costs</div><div class="val">${v(pl.cogs.manufacturing)}</div></div>
    <div class="row"><div class="lab">Packaging Materials</div><div class="val">${v(pl.cogs.packaging)}</div></div>
    <div class="row"><div class="lab">Shipping & Delivery</div><div class="val">${v(pl.cogs.shipping)}</div></div>
    <div class="row totalRow"><div class="lab"><strong>TOTAL COGS</strong></div><div class="val">${v(pl.cogs.total)}</div></div>
    <div class="row totalRow"><div class="lab"><div class="highlight" style="padding:6px 10px;border-radius:8px"><strong>GROSS PROFIT</strong></div></div><div class="val">${v(pl.grossProfit)}</div></div>
  </div>
  <div class="section">
    <div class="sec-head">🟨 OPERATING EXPENSES</div>
    <div class="row"><div class="lab">Employee Salaries</div><div class="val">${v(pl.opex.salary)}</div></div>
    <div class="row"><div class="lab">EPF Contributions (12%)</div><div class="val">${v(pl.opex.epf12)}</div></div>
    <div className="row"><div className="lab">ETF Contributions (3%)</div><div className="val">${v(pl.opex.etf3)}</div></div>
    <div className="row"><div className="lab">Website Maintenance & Hosting</div><div className="val">${v(pl.opex.website)}</div></div>
    <div className="row"><div className="lab">Online Marketing & Advertising</div><div className="val">${v(pl.opex.marketing)}</div></div>
    <div className="row"><div className="lab">Payment Gateway Fees</div><div className="val">${v(pl.opex.gateway)}</div></div>
    <div className="row"><div className="lab">Office Rent & Utilities</div><div className="val">${v(pl.opex.office)}</div></div>
    <div className="row"><div className="lab">Insurance</div><div className="val">${v(pl.opex.insurance)}</div></div>
    <div className="row"><div className="lab">Professional Services</div><div className="val">${v(pl.opex.professional)}</div></div>
    <div className="row"><div className="lab">Other Operating Expenses</div><div className="val">${v(pl.opex.other)}</div></div>
    <div className="row totalRow"><div className="lab"><strong>TOTAL OPERATING EXPENSES</strong></div><div className="val">${v(pl.opex.total)}</div></div>
  </div>
  <div className="section">
    <div className="sec-head">🟪 NET INCOME</div>
    <div className="row totalRow"><div className="lab"><div className="highlight" style="padding:6px 10px;border-radius:8px"><strong>NET PROFIT / (LOSS)</strong></div></div><div className="val">${v(pl.netIncome)}</div></div>
  </div>
  <div className="btnbar"><a className="btn" href="javascript:window.print()">🖨️  Print / Save as PDF</a></div>
</div></body></html>`;
  };

  /* ====== Open/Download helpers ====== */
  const openHTML = (html, filename) => {
    const w = window.open("", "_blank");
    if (w && !w.closed) { w.document.write(html); w.document.close(); return; }
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  };

  /* ====== Handlers ====== */
  const handleView = async (name, periodOverride) => {
    const type = inferType(name);
    const from = dateFromRef.current?.value || fmtDate(new Date());
    const to   = dateToRef.current?.value   || fmtDate(new Date());
    const period = periodOverride || `${from} to ${to}`;

    if (type === "Balance Sheet") {
      const data = await fetchBalanceSheetData(from, to);
      const html = buildBalanceSheetHTML("Bag Business Co.", { ...data, asOf: to });
      openHTML(html, `Balance_Sheet_${to}.html`);
      return;
    }

    if (type === "Profit & Loss Statement") {
      const pl = await fetchIncomeStatementData(from, to);
      const html = buildIncomeStatementHTML("Bag Business Co.", to, pl);
      openHTML(html, `Profit_and_Loss_${from}_to_${to}.html`);
      return;
    }

    const html = `
      <html><body><h2>${name}</h2><p>Period: ${period}</p><p>Generated: ${fmtDate(new Date())}</p></body></html>
    `;
    openHTML(html, `${name.replace(/\s+/g, "_")}.html`);
  };

  const handleDownload = async (name, periodOverride) => {
    const type = inferType(name);
    const from = dateFromRef.current?.value || fmtDate(new Date());
    const to   = dateToRef.current?.value   || fmtDate(new Date());

    if (type === "Balance Sheet") {
      const data = await fetchBalanceSheetData(from, to);
      const html = buildBalanceSheetHTML("Bag Business Co.", { ...data, asOf: to });
      openHTML(html, `Balance_Sheet_${to}.html`);
      toast("Balance Sheet generated. Use the Print button to save as PDF.", "success");
      return;
    }

    if (type === "Profit & Loss Statement") {
      const pl = await fetchIncomeStatementData(from, to);
      const html = buildIncomeStatementHTML("Bag Business Co.", to, pl);
      openHTML(html, `Profit_and_Loss_${from}_to_${to}.html`);
      toast("Profit & Loss Statement generated. Use the Print button to save as PDF.", "success");
      return;
    }

    toast("Report ready.", "success");
  };

  //const onLogout = () => {
   // if (window.confirm("Are you sure you want to logout?")) {
    //  toast("Logging out...", "info");
    //  setTimeout(() => { alert("You have been logged out successfully!"); }, 600);
    //}
  //};

  /* ---------- Quick Cards ---------- */
  const quickCards = useMemo(() => ([
    {
      title: "Profit & Loss Statement",
      subtitle: "Period performance snapshot",
      stats: [
        { label:"Revenue",     value: fmtLKR(dash.revenue) },
        { label:"Expenses",    value: fmtLKR(dash.expenses) },
        { label:"Net Profit",  value: fmtLKR(dash.net) }
      ]
    },
    {
      title: "Balance Sheet",
      subtitle: "Assets & Liabilities",
      stats: [
        { label:"Assets",      value: fmtLKR(1200000) },
        { label:"Liabilities", value: fmtLKR(380000) },
        { label:"Equity",      value: fmtLKR(820000) }
      ]
    },
    {
      title: "Budget Analysis",
      subtitle: "Budget vs Actual (Expenses)",
      stats: [
        { label:"Budget", value: fmtLKR((chartsData.budgetVsActual.budget || []).reduce((a,b)=>a+b,0)) || fmtLKR(750000) },
        { label:"Actual", value: fmtLKR((chartsData.budgetVsActual.actual || []).reduce((a,b)=>a+b,0) || dash.expenses) },
        { label:"Variance", value: (() => {
            const b = (chartsData.budgetVsActual.budget || []).reduce((a,b)=>a+b,0) || 750000;
            const a = (chartsData.budgetVsActual.actual || []).reduce((a,b)=>a+b,0) || dash.expenses;
            const variance = b ? Math.round(((b - a) / b) * 100) : 0;
            return (variance >= 0 ? "+" : "") + variance + "%";
          })()
        }
      ]
    }
  ]), [dash, chartsData]);

  /* ---------- UI ---------- */
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
                <option>Profit & Loss Statement</option>
                <option>Balance Sheet</option>
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
                  {card.title.includes("Profit")  && <i className="fas fa-file-invoice-dollar" />}
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
      </main>
    </div>
  );
}

export default FinancialReport;
