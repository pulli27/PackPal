import React, { useEffect, useMemo, useState } from "react";
import "./SalesReports.css";

/* -------- storage + shared helpers -------- */
const LS = { products: "sbs_products_v3", tx: "sbs_transactions_v1" };
const load = (key, fb = []) => {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : fb;
  } catch {
    return fb;
  }
};
const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
      .muted{color:#637087}
      .stats{display:grid; gap:12px}
      @media(min-width:900px){ .stats{grid-template-columns:repeat(4,1fr)} }
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
      .v{font-weight:800;font-size:18px}
      .l{text-transform:uppercase;font-size:11px;color:#637087;letter-spacing:.04em}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      thead th{background:#f3f4f6}
      th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}
      .right{text-align:right}
    </style>
  </head><body>${inner}</body></html>`);
  w.document.close();
  w.print();
};

/* -------- pricing helpers -------- */
const effectivePrice = (p) => {
  if (p.discountType === "percentage")
    return Math.max(0, p.price * (1 - (p.discountValue || 0) / 100));
  if (p.discountType === "fixed")
    return Math.max(0, p.price - (p.discountValue || 0));
  return p.price;
};

/* ================================================================================== */

export default function ReportsPage() {
  const [products, setProducts] = useState(() => load(LS.products, []));
  const [txs, setTxs] = useState(() => load(LS.tx, []));

  const [repType, setRepType] = useState("discounts");
  const [repRange, setRepRange] = useState("all");
  const [generatedAt, setGeneratedAt] = useState("");

  // Sync with storage
  useEffect(() => {
    const refresh = () => {
      setProducts(load(LS.products, []));
      setTxs(load(LS.tx, []));
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("sbs-data-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("sbs-data-changed", refresh);
    };
  }, []);

  /* ------- filter by range ------- */
  const dataInRange = useMemo(() => {
    if (repRange === "all") return txs.slice();
    const days = parseInt(repRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return txs.filter((t) => new Date(t.date) >= cutoff);
  }, [txs, repRange]);

  /* ------- prepare report ------- */
  const { title, stats, headers, rows } = useMemo(() => {
    const type = repType;

    if (type === "discounts") {
      const discounted = dataInRange.filter((t) => Number(t.discountPerUnit) > 0);
      const saved = discounted.reduce(
        (s, t) => s + (Number(t.discountPerUnit) || 0) * (Number(t.qty) || 0),
        0
      );
      return {
        title: "Discount Impact",
        stats: [
          ["TX with Discount", discounted.length],
          ["Total Discount Value", money(saved)],
          ["Avg Discount / TX", money(discounted.length ? saved / discounted.length : 0)],
          ["—", "—"],
        ],
        headers: ["TX ID", "Product", "Qty", "Disc/Unit", "Total Disc"],
        rows: discounted.map((t) => [
          t.id,
          t.productName || "",
          t.qty,
          money(t.discountPerUnit),
          money((Number(t.discountPerUnit) || 0) * (Number(t.qty) || 0)),
        ]),
      };
    }

    if (type === "inventory") {
      const activeDiscounts = products.filter(
        (p) => (p.discountType || "none") !== "none" && Number(p.discountValue || 0) > 0
      ).length;
      const stockBaseValue = products.reduce(
        (s, p) => s + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0
      );
      return {
        title: "Inventory Snapshot",
        stats: [
          ["Products", products.length],
          ["Active Discounts", activeDiscounts],
          ["Stock Value (base)", money(stockBaseValue)],
          ["—", "—"],
        ],
        headers: ["ID", "Product", "Stock", "Base Price", "Effective Price", "Stock Value"],
        rows: products.map((p) => {
          const ep = effectivePrice(p);
          return [
            p.id,
            p.name,
            p.stock,
            money(p.price),
            money(ep),
            money((Number(p.stock) || 0) * ep),
          ];
        }),
      };
    }

    // FMC Report
    const only = dataInRange.filter((t) => !!t.fmc);
    const revenue = only
      .filter((t) => (t.status || "").toLowerCase() === "paid")
      .reduce((s, t) => s + (Number(t.total) || 0), 0);
    const pending = only
      .filter((t) => (t.status || "").toLowerCase() === "pending")
      .reduce((s, t) => s + (Number(t.total) || 0), 0);
    return {
      title: "FMC Finance Summary",
      stats: [
        ["FMC Transactions", only.length],
        ["FMC Paid Revenue", money(revenue)],
        ["FMC Pending", money(pending)],
        ["—", "—"],
      ],
      headers: [
        "TX ID",
        "Date",
        "Customer ID",
        "Customer",
        "Product",
        "Qty",
        "Total",
        "Status",
      ],
      rows: only.map((t) => [
        t.id,
        t.date,
        t.customerId || "",
        t.customer || "",
        t.productName || "",
        t.qty,
        money(t.total),
        t.status,
      ]),
    };
  }, [repType, dataInRange, products]);

  const onGenerate = () => setGeneratedAt(new Date().toLocaleString());

  const onExport = () => {
    if (repType === "discounts") {
      const discounted = dataInRange.filter((t) => Number(t.discountPerUnit) > 0);
      exportCsv(
        "discounts_report",
        discounted.map((t) => ({
          id: t.id,
          product: t.productName,
          qty: t.qty,
          discount_per_unit: t.discountPerUnit,
          total_discount: (Number(t.discountPerUnit) || 0) * (Number(t.qty) || 0),
        }))
      );
      return;
    }
    if (repType === "inventory") {
      exportCsv(
        "inventory_report",
        products.map((p) => {
          const ep = effectivePrice(p);
          return {
            id: p.id,
            product: p.name,
            stock: p.stock,
            base_price: p.price,
            effective_price: ep,
            stock_value: ep * (Number(p.stock) || 0),
          };
        })
      );
      return;
    }
    const only = dataInRange.filter((t) => !!t.fmc);
    exportCsv(
      "fmc_report",
      only.map((t) => ({
        id: t.id,
        date: t.date,
        customer_id: t.customerId,
        customer: t.customer,
        product: t.productName,
        qty: t.qty,
        total: t.total,
        status: t.status,
      }))
    );
  };

  const onPrint = () => {
    const statsHtml =
      `<div class="stats">` +
      stats
        .map(
          ([k, v]) =>
            `<div class="card"><div class="v">${v}</div><div class="l">${k}</div></div>`
        )
        .join("") +
      `</div>`;

    const headHtml =
      `<thead><tr>` +
      headers.map((h, i) =>
        `<th${i === headers.length - 1 ? "" : ""}>${h}</th>`
      ).join("") +
      `</tr></thead>`;

    const bodyHtml =
      `<tbody>` +
      rows
        .map(
          (r) =>
            `<tr>${r
              .map((c, i) =>
                `<td${i >= headers.length - 2 && typeof c === "string" && c.startsWith("LKR") ? ' class="right"' : ""}>${c}</td>`
              )
              .join("")}</tr>`
        )
        .join("") +
      `</tbody>`;

    printHtml(
      `<h2>${title}</h2>
       <div class="muted">Generated: ${generatedAt || new Date().toLocaleString()}</div>
       ${statsHtml}
       <table>${headHtml}${bodyHtml}</table>`
    );
  };

  return (
    <div className="content reports-page">
      <h1 className="page-title">Reports</h1>
      <p className="muted">Generate, export, and print summaries.</p>

      {/* Controls */}
      <section className="section">
        <div className="head"><h3>Generate Reports</h3></div>
        <div className="body">
          <div className="grid grid-2">
            <div>
              <label>Report Type</label>
              <select value={repType} onChange={(e) => setRepType(e.target.value)}>
                <option value="discounts">Discount Impact</option>
                <option value="inventory">Inventory Snapshot</option>
                <option value="fmc">FMC Finance Summary</option>
              </select>
            </div>
            <div>
              <label>Date Range</label>
              <select value={repRange} onChange={(e) => setRepRange(e.target.value)}>
                <option value="all">All</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={onGenerate}>Generate</button>
            <button className="btn" onClick={onExport}>Export CSV</button>
            <button className="btn" onClick={onPrint}>Print</button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="head"><h3>Report Results</h3></div>
        <div className="body" style={{ overflowX: "auto" }}>
          {rows.length === 0 ? (
            <p className="muted">Choose a report and click Generate.</p>
          ) : (
            <>
              <div className="muted" style={{ marginBottom: 8 }}>
                Generated: {generatedAt || "—"}
              </div>

              <div className="stats" style={{ marginBottom: 12 }}>
                {stats.map(([k, v], idx) => (
                  <div className="card stat" key={idx}>
                    <div className="v" style={{ fontSize: 20 }}>{v}</div>
                    <div className="l">{k}</div>
                  </div>
                ))}
              </div>

              <table>
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j} className={typeof c === "string" && c.startsWith("LKR") ? "right" : ""}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
