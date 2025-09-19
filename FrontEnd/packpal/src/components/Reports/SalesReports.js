// src/components/Reports/SalesReport.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./SalesReports.css";

/* ===================== Config ===================== */
const TX_URL = "http://localhost:5000/transactions";

/* ===================== Helpers ===================== */
const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const unpackList = (payload) =>
  Array.isArray(payload)
    ? payload
    : payload?.transactions ?? payload?.items ?? payload?.data ?? [];

const toTx = (row) => ({
  id: String(
    row?.id ??
      row?._id ??
      row?.txId ??
      row?.transactionId ??
      Math.random().toString(36).slice(2, 10)
  ),
  date: row?.date ? String(row.date).slice(0, 10) : "",
  customer: row?.customer ?? "",
  customerId: row?.customerId ?? "",
  productName: row?.productName ?? row?.product?.name ?? "",
  qty: Number(row?.qty ?? 1),
  unitPrice: Number(row?.unitPrice ?? 0),
  discountPerUnit: Number(row?.discountPerUnit ?? 0),
  total: Number(row?.total ?? 0),
  status: (row?.status ?? "pending").toLowerCase(), // pending | paid | refund
});

/* ===== CSV + Print ===== */
const csvEscape = (v) => {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};
const exportCsv = (filename, rows, headers) => {
  const arr = Array.isArray(rows) ? rows : [];
  const cols = headers || (arr.length ? Object.keys(arr[0]) : []);
  const csv =
    [cols.join(",")]
      .concat(arr.map((r) => cols.map((c) => csvEscape(r[c])).join(",")))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const printHtml = (inner) => {
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>Print</title>
    <meta charset="utf-8" />
    <style>
      body{font-family:Arial, sans-serif; padding:16px}
      h2{margin:0 0 8px}
      h3{margin:14px 0 8px}
      .muted{color:#637087}
      .stats{display:grid; gap:12px}
      @media(min-width:900px){ .stats{grid-template-columns:repeat(4,1fr)} }
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
      .v{font-weight:800;font-size:18px}
      .l{text-transform:uppercase;font-size:11px;color:#637087;letter-spacing:.04em}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      thead th{background:#f3f4f6}
      th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}
      .right{text-align:right}
    </style>
  </head><body>${inner}</body></html>`);
  w.document.close();
  w.print();
};

/* ===================== Tiny chart utils (SVG) ===================== */
const scale = (val, min, max) => (max === min ? 0 : (val - min) / (max - min));
const COLORS = ["#2563eb", "#60a5fa", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

/* ===================== Component ===================== */
export default function SalesReport() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [range, setRange] = useState("30"); // 7 | 30 | 90 | all
  const [generatedAt, setGeneratedAt] = useState("");

  const fetchTx = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(TX_URL);
      setTxs(unpackList(res.data).map(toTx));
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    const onChanged = () => fetchTx();
    window.addEventListener("tx:changed", onChanged);
    window.addEventListener("focus", onChanged);
    return () => {
      window.removeEventListener("tx:changed", onChanged);
      window.removeEventListener("focus", onChanged);
    };
  }, []);

  /* -------- Filter by date range -------- */
  const rowsInRange = useMemo(() => {
    if (range === "all") return txs.slice();
    const days = parseInt(range, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return txs.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d) && d >= cutoff;
    });
  }, [txs, range]);

  /* -------- Analytics -------- */
  const analytics = useMemo(() => {
    const norm = (s) => (s || "").toLowerCase();
    const paid = rowsInRange.filter((t) => norm(t.status) === "paid");
    const pending = rowsInRange.filter((t) => norm(t.status) === "pending");
    const refund = rowsInRange.filter((t) => norm(t.status) === "refund");

    const paidRevenue = paid.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const pendingAmt = pending.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const refundAmt = refund.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const aov = paid.length ? paidRevenue / paid.length : 0;

    // Revenue over time (paid only)
    const byDateMap = new Map();
    paid.forEach((t) => {
      const d = t.date || "—";
      byDateMap.set(d, (byDateMap.get(d) || 0) + (Number(t.total) || 0));
    });
    const byDate = Array.from(byDateMap.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([date, value]) => ({ date, value }));

    // Sales by product (paid only) — for tables/exports
    const byProductMap = new Map();
    for (const t of paid) {
      const key = t.productName || "—";
      const rec = byProductMap.get(key) || {
        product: key,
        orders: 0,
        qty: 0,
        discountTotal: 0,
        revenue: 0,
        avgPrice: 0,
      };
      rec.orders += 1;
      rec.qty += Number(t.qty) || 0;
      rec.discountTotal += (Number(t.discountPerUnit) || 0) * (Number(t.qty) || 0);
      rec.revenue += Number(t.total) || 0;
      byProductMap.set(key, rec);
    }
    const byProductAll = Array.from(byProductMap.values()).map((r) => ({
      ...r,
      avgPrice: r.qty ? r.revenue / r.qty : 0,
    }));

    // Top customers (paid only)
    const byCustomerMap = new Map();
    for (const t of paid) {
      const key = t.customer || t.customerId || "—";
      const rec = byCustomerMap.get(key) || { customer: key, orders: 0, revenue: 0 };
      rec.orders += 1;
      rec.revenue += Number(t.total) || 0;
      byCustomerMap.set(key, rec);
    }
    const byCustomer = Array.from(byCustomerMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      paidRevenue,
      pendingAmt,
      refundAmt,
      aov,
      paidCount: paid.length,
      allCount: rowsInRange.length,
      uniqueCustomers:
        new Set(rowsInRange.map((t) => t.customer || t.customerId).filter(Boolean)).size,
      byDate,
      byProductAll,
      byCustomer,
    };
  }, [rowsInRange]);

  /* -------- Actions -------- */
  const generate = () => setGeneratedAt(new Date().toLocaleString());

  const printReport = () => {
    const statsHtml =
      `<div class="stats">` +
      [
        ["Paid Revenue", money(analytics.paidRevenue)],
        ["Pending Amount", money(analytics.pendingAmt)],
        ["Refund Amount", money(analytics.refundAmt)],
        ["Avg Order Value", money(analytics.aov)],
      ]
        .map(
          ([k, v]) =>
            `<div class="card"><div class="v">${v}</div><div class="l">${k}</div></div>`
        )
        .join("") +
      `</div>`;

    const productTable =
      `<h3>Analysis — Sales by Product (Paid)</h3>
       <table>
         <thead>
           <tr>
             <th>Product</th>
             <th class="right">Orders</th>
             <th class="right">Qty</th>
             <th class="right">Avg Price</th>
             <th class="right">Discount Total</th>
             <th class="right">Revenue</th>
           </tr>
         </thead>
         <tbody>
           ${analytics.byProductAll
             .map(
               (r) =>
                 `<tr>
                    <td>${r.product}</td>
                    <td class="right">${r.orders}</td>
                    <td class="right">${r.qty}</td>
                    <td class="right">${money(r.avgPrice)}</td>
                    <td class="right">${money(r.discountTotal)}</td>
                    <td class="right">${money(r.revenue)}</td>
                  </tr>`
             )
             .join("")}
         </tbody>
       </table>`;

    const customerTable =
      `<h3>Top Customers (Paid)</h3>
       <table>
         <thead><tr><th>Customer</th><th class="right">Orders</th><th class="right">Revenue</th></tr></thead>
         <tbody>
           ${analytics.byCustomer
             .map(
               (r) =>
                 `<tr><td>${r.customer}</td><td class="right">${r.orders}</td><td class="right">${money(
                   r.revenue
                 )}</td></tr>`
             )
             .join("")}
         </tbody>
       </table>`;

    printHtml(
      `<h2>Sales Report</h2>
       <div class="muted">Generated: ${generatedAt || new Date().toLocaleString()}</div>
       ${statsHtml}
       ${productTable}
       ${customerTable}`
    );
  };

  /* -------- Charts (pure SVG) -------- */
  const ChartCard = ({ title, children }) => (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  const LineChart = ({ data, w = 560, h = 220, pad = 24 }) => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    const points = data.map((d, i) => {
      const x = pad + (innerW * i) / Math.max(1, data.length - 1);
      const y = pad + innerH * (1 - scale(d.value, min, max));
      return `${x},${y}`;
    });

    const y0 = pad + innerH;
    const x0 = pad;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "220px" }}>
        <line x1={x0} y1={pad} x2={x0} y2={y0} stroke="#e5e7eb" />
        <line x1={x0} y1={y0} x2={w - pad} y2={y0} stroke="#e5e7eb" />
        {points.length > 1 && (
          <polyline fill="none" stroke={COLORS[0]} strokeWidth="2.5" points={points.join(" ")} />
        )}
        {data.map((d, i) => {
          const x = pad + (innerW * i) / Math.max(1, data.length - 1);
          const y = pad + innerH * (1 - scale(d.value, min, max));
          return <circle key={i} cx={x} cy={y} r="3" fill={COLORS[1]} />;
        })}
        {data.map((d, i) => {
          const x = pad + (innerW * i) / Math.max(1, data.length - 1);
          const y = y0 + 14;
          const label = d.date.slice(5);
          return (
            <text key={i} x={x} y={y} fontSize="10" textAnchor="middle" fill="#637087">
              {label}
            </text>
          );
        })}
        <text x={w - pad} y={pad - 6} fontSize="10" textAnchor="end" fill="#637087">
          {money(max)}
        </text>
      </svg>
    );
  };

  const DonutChart = ({ series, w = 280, h = 220 }) => {
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = Math.min(w, h) / 2 - 16;
    const thickness = 26;

    const total = series.reduce((s, x) => s + x.value, 0) || 1;
    let start = -Math.PI / 2;

    return (
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "280px", height: "220px" }}>
          {series.map((s, i) => {
            const angle = (s.value / total) * Math.PI * 2;
            const end = start + angle;

            const largeArc = angle > Math.PI ? 1 : 0;
            const x1 = cx + r * Math.cos(start);
            const y1 = cy + r * Math.sin(start);
            const x2 = cx + r * Math.cos(end);
            const y2 = cy + r * Math.sin(end);

            const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
            const stroke = COLORS[i % COLORS.length];
            const el = (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={thickness}
                strokeLinecap="round"
              />
            );
            start = end;
            return el;
          })}
          <text x={cx} y={cy + 4} fontSize="12" fontWeight="700" textAnchor="middle" fill="#111827">
            {total ? money(total) : "—"}
          </text>
        </svg>

        <div style={{ minWidth: 160 }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: COLORS[i % COLORS.length],
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, color: "#111827", fontWeight: 700 }}>{s.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#637087" }}>
                {money(s.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* -------- UI -------- */
  return (
    <div className="content reports-page">
      <h1 className="page-title">Sales Report</h1>
      <p className="muted">Range-aware analytics with charts & tables.</p>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}

      {/* Controls */}
      <section className="section">
        <div className="head"><h3>Controls</h3></div>
        <div className="body">
          <div className="grid grid-2">
            <div>
              <label>Date Range</label>
              <select value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button className="btn" onClick={fetchTx}>Reload</button>
              <button className="btn primary" onClick={() => setGeneratedAt(new Date().toLocaleString())}>
                Generate
              </button>
              <button className="btn" onClick={() => {
                exportCsv(
                  "sales_by_product",
                  analytics.byProductAll.map((r) => ({
                    product: r.product,
                    orders: r.orders,
                    qty: r.qty,
                    avg_price: r.avgPrice,
                    discount_total: r.discountTotal,
                    revenue: r.revenue,
                  }))
                );
              }}>Export Products CSV</button>
              <button className="btn" onClick={() => {
                exportCsv(
                  "top_customers",
                  analytics.byCustomer.map((r) => ({
                    customer: r.customer,
                    orders: r.orders,
                    revenue: r.revenue,
                  }))
                );
              }}>Export Customers CSV</button>
              <button className="btn" onClick={printReport}>Print</button>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="section">
        <div className="head"><h3>KPIs</h3></div>
        <div className="body">
          <div className="stats">
            <div className="card stat"><div className="v">{money(analytics.paidRevenue)}</div><div className="l">Paid Revenue</div></div>
            <div className="card stat"><div className="v">{money(analytics.pendingAmt)}</div><div className="l">Pending Amount</div></div>
            <div className="card stat"><div className="v">{money(analytics.refundAmt)}</div><div className="l">Refund Amount</div></div>
            <div className="card stat"><div className="v">{money(analytics.aov)}</div><div className="l">Avg Order Value</div></div>
          </div>
          <div className="stats" style={{ marginTop: 12 }}>
            <div className="card stat"><div className="v">{analytics.paidCount}</div><div className="l">Paid Orders</div></div>
            <div className="card stat"><div className="v">{analytics.allCount}</div><div className="l">Orders (All)</div></div>
            <div className="card stat"><div className="v">{analytics.uniqueCustomers}</div><div className="l">Unique Customers</div></div>
            <div className="card stat"><div className="v">{generatedAt || "—"}</div><div className="l">Generated</div></div>
          </div>
        </div>
      </section>

      {/* CHARTS — only Line + Donut (Top-5 bar chart removed) */}
      <section className="section">
        <div className="head"><h3>Analysis Charts</h3></div>
        <div className="body">
          <div className="grid" style={{ display: "grid", gap: 12 }}>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
              <ChartCard title="Revenue Over Time (Paid)">
                {analytics.byDate.length === 0 ? (
                  <div className="muted">No paid transactions in this range.</div>
                ) : (
                  <LineChart data={analytics.byDate} />
                )}
              </ChartCard>
              <ChartCard title="Status Breakdown (Amount)">
                <DonutChart
                  series={[
                    { label: "Paid", value: analytics.paidRevenue },
                    { label: "Pending", value: analytics.pendingAmt },
                    { label: "Refund", value: analytics.refundAmt },
                  ]}
                />
              </ChartCard>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis table (Sales by Product) */}
      <section className="section">
        <div className="head"><h3>Analysis — Sales by Product (Paid)</h3></div>
        <div className="body" style={{ overflowX: "auto" }}>
          {analytics.byProductAll.length === 0 ? (
            <p className="muted">No paid transactions in this range.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="right">Orders</th>
                  <th className="right">Qty</th>
                  <th className="right">Avg Price</th>
                  <th className="right">Discount Total</th>
                  <th className="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byProductAll.map((r) => (
                  <tr key={r.product}>
                    <td>{r.product}</td>
                    <td className="right">{r.orders}</td>
                    <td className="right">{r.qty}</td>
                    <td className="right">{money(r.avgPrice)}</td>
                    <td className="right">{money(r.discountTotal)}</td>
                    <td className="right">{money(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Top customers */}
      <section className="section">
        <div className="head"><h3>Top Customers (Paid)</h3></div>
        <div className="body" style={{ overflowX: "auto" }}>
          {analytics.byCustomer.length === 0 ? (
            <p className="muted">No paid transactions in this range.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="right">Orders</th>
                  <th className="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byCustomer.map((r) => (
                  <tr key={r.customer}>
                    <td>{r.customer}</td>
                    <td className="right">{r.orders}</td>
                    <td className="right">{money(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
