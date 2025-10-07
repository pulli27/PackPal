// src/pages/Finance/Finance.js
import React, { useEffect, useMemo, useState } from "react";
import "./Finance.css";
import Sidebarsa from "../Sidebar/Sidebarsa";
import { api } from "../../lib/api"; // shared axios instance

const COMPANY = {
  name: "PackPal (Pvt) Ltd",
  address: "No. 123, Galle Road, Colombo 04, Sri Lanka",
  phone: "+94 77 123 4567",
  email: "hello@packpal.com",
  logoUrl: "/packpal-logo.png",
  reportTitle: "Finance Report",
};

const money = (n) =>
  "LKR " +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const nowISO = () => new Date().toISOString().slice(0, 10);
const nowNice = () =>
  new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  date: row?.date ? String(row.date).slice(0, 10) : nowISO(),
  customer: row?.customer ?? "",
  productId: row?.productId ?? row?.product?._id ?? row?.product?.id ?? "",
  productName: row?.productName ?? row?.product?.name ?? "",
  qty: Number(row?.qty ?? 1),
  unitPrice: Number(row?.unitPrice ?? 0),
  discountPerUnit: Number(row?.discountPerUnit ?? 0),
  total: Number(row?.total ?? 0),
  status: (row?.status ?? "pending").toLowerCase(),
});

async function getWithFallbacks(paths) {
  let lastErr;
  for (const p of paths) {
    try {
      const res = await api.get(p);
      return { path: p, data: res.data };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All endpoints failed");
}

export default function FinancePage() {
  const [txs, setTxs] = useState([]);
  const [txBase, setTxBase] = useState("api/transactions");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState(null); // { id, status }
  const [saving, setSaving] = useState(false);

  const fetchTx = async () => {
    setLoading(true);
    setErr("");
    try {
      const { path, data } = await getWithFallbacks([
        "/api/transactions",
        "api/transactions",
        "/transactions",
        "transactions",
      ]);
      setTxBase(path.replace(/\/+$/, ""));
      setTxs(unpackList(data).map(toTx));
    } catch (e) {
      const url = e?.config ? (e.config.baseURL || "") + (e.config.url || "") : "";
      setErr(
        (e?.response?.data?.message ||
          e.message ||
          "Failed to load transactions") + (url ? `\nURL: ${url}` : "")
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTx(); }, []);

  const rawRows = useMemo(() => txs.slice().reverse(), [txs]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = rawRows.filter((t, i) => {
      const displayId = String(i + 1);
      if (!term) return true;
      return (
        displayId.includes(term) ||
        t.id.toLowerCase().includes(term) ||
        (t.customer || "").toLowerCase().includes(term) ||
        (t.productName || "").toLowerCase().includes(term)
      );
    });
    return filtered.map((t, i) => ({ ...t, rid: t.id, displayId: String(i + 1) }));
  }, [rawRows, q]);

  const kpis = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const pending = rows.filter((r) => r.status === "pending");
    const refund = rows.filter((r) => r.status === "refund");

    const sum = (arr, f) => arr.reduce((s, r) => s + f(r), 0);
    const paidRevenue = sum(paid, (r) => r.total || 0);
    const pendingAmount = sum(pending, (r) => r.total || 0);
    const refundAmount = sum(refund, (r) => r.total || 0);
    const paidOrders = paid.length;
    const avgOrderValue = paidOrders ? paidRevenue / paidOrders : 0;

    return {
      paidRevenue,
      pendingAmount,
      refundAmount,
      avgOrderValue,
      paidOrders,
      ordersAll: rows.length,
    };
  }, [rows]);

  const openEdit = (row) => setEditing({ id: row.rid, status: row.status });
  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setErr(""); setOk("");
    try {
      const orig = txs.find((t) => t.id === editing.id);
      if (!orig) throw new Error("Transaction not found");

      // Only update status — keep qty & totals as-is
      const payload = {
        date: orig.date,
        customer: orig.customer,
        productId: orig.productId,
        productName: orig.productName,
        qty: orig.qty,
        unitPrice: Number(orig.unitPrice || 0),
        discountPerUnit: Number(orig.discountPerUnit || 0),
        total: Number(orig.total || 0),
        status: editing.status,
      };

      await api.put(`${txBase}/${editing.id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setOk("Status updated.");
      setEditing(null);
      await fetchTx();
      setTimeout(() => setOk(""), 1600);
    } catch (e) {
      const url = e?.config ? (e.config.baseURL || "") + (e.config.url || "") : "";
      setErr((e?.response?.data?.message || e.message || "Update failed") + (url ? `\nURL: ${url}` : ""));
    } finally {
      setSaving(false);
    }
  };

  const deleteTx = async (rowId) => {
    if (!window.confirm("Delete this transaction?")) return;
    setErr(""); setOk("");
    try {
      await api.delete(`${txBase}/${rowId}`);
      await fetchTx();
      setOk("Deleted.");
      setTimeout(() => setOk(""), 1600);
    } catch (e) {
      const url = e?.config ? (e.config.baseURL || "") + (e.config.url || "") : "";
      setErr((e?.response?.data?.message || e.message || "Delete failed") + (url ? `\nURL: ${url}` : ""));
    }
  };

  const doExportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;

    const card = (title, value) => `
      <div class="card">
        <div class="card-value">${value}</div>
        <div class="card-label">${title}</div>
      </div>
    `;
    const kpiGrid = `
      <div class="kpi-grid">
        ${card("PAID REVENUE", money(kpis.paidRevenue))}
        ${card("PENDING AMOUNT", money(kpis.pendingAmount))}
        ${card("REFUND AMOUNT", money(kpis.refundAmount))}
        ${card("AVG ORDER VALUE", money(kpis.avgOrderValue))}
        ${card("PAID ORDERS", kpis.paidOrders)}
        ${card("ORDERS (ALL)", kpis.ordersAll)}
      </div>
    `;

    const body = rows.map((r) => `
      <tr>
        <td class="center">${r.displayId}</td>
        <td>${r.date}</td>
        <td>${r.customer || ""}</td>
        <td>${r.productName || ""}</td>
        <td class="right">${r.qty}</td>
        <td class="right">${money(r.unitPrice)}</td>
        <td class="right">${r.discountPerUnit ? money(r.discountPerUnit) : "—"}</td>
        <td class="right">${money(r.total)}</td>
        <td class="center"><span class="pill ${r.status}">${r.status}</span></td>
      </tr>`).join("");

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${COMPANY.reportTitle}</title>
  <style>
    :root{
      --text:#111827; --muted:#6b7280; --border:#e5e7eb; --panel:#f9fafb;
      --paid-bg:#dcfce7; --paid:#15803d; --pend-bg:#fef3c7; --pend:#b45309; --ref-bg:#fee2e2; --ref:#b91c1c;
    }
    *{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:var(--text);margin:24px}
    header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:12px}
    .logo{width:54px;height:54px;object-fit:contain;border-radius:50%;border:1px solid #e5e7eb}
    .company{font-size:20px;font-weight:800;margin:0}
    .sub{color:var(--muted);font-size:12px;margin-top:4px;line-height:1.35}
    .report-title{font-size:28px;font-weight:800;text-align:right}
    .generated{color:var(--muted);font-size:12px;margin-top:6px;text-align:right}
    hr{border:none;border-top:2px solid #1f2937;margin:12px 0 16px}
    .kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-bottom:20px}
    .card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px}
    .card-value{font-size:22px;font-weight:800;margin-bottom:6px}
    .card-label{font-size:11px;letter-spacing:.06em;color:var(--muted)}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border:1px solid var(--border);padding:6px 8px;font-size:12px}
    thead th{background:var(--panel);text-align:left}
    .right{text-align:right}
    .center{text-align:center}
    .pill{padding:2px 8px;border-radius:999px;font-weight:700;text-transform:capitalize;display:inline-block}
    .pill.pending{background:var(--pend-bg);color:var(--pend)}
    .pill.paid{background:var(--paid-bg);color:var(--paid)}
    .pill.refund{background:var(--ref-bg);color:var(--ref)}
    .footer-note{color:var(--muted);font-size:11px;margin-top:12px}
    @page{size:auto;margin:14mm}
  </style>
</head>
<body>
  <header>
    <div style="display:flex;gap:12px;align-items:flex-start">
      ${COMPANY.logoUrl ? `<img class="logo" src="${COMPANY.logoUrl}" alt="">` : ""}
      <div>
        <h1 class="company">${COMPANY.name}</h1>
        <div class="sub">
          ${COMPANY.address}<br/>
          Phone: ${COMPANY.phone} &nbsp; | &nbsp; Email: ${COMPANY.email}
        </div>
      </div>
    </div>
    <div>
      <div class="report-title">${COMPANY.reportTitle}</div>
      <div class="generated">Generated: ${nowNice()}</div>
    </div>
  </header>
  <hr/>
  ${kpiGrid}
  <h3>Transactions</h3>
  <table>
    <thead>
      <tr>
        <th>TX ID</th><th>Date</th><th>Customer</th><th>Product</th>
        <th class="right">Qty</th><th class="right">Unit</th>
        <th class="right">Discount</th><th class="right">Total</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
  <div class="footer-note">${COMPANY.reportTitle} generated by PackPal Finance.</div>
</body>
</html>`);
    w.document.close();
    const onLoad = () => { w.focus(); w.print(); };
    if (w.document.readyState === "complete") onLoad();
    else w.onload = onLoad;
  };

  return (
    <div className="page-wrap finance-page">
      <Sidebarsa />
      <main className="finance-main">
        <h1 className="page-title">Finance</h1>
        <p className="muted">Payments recorded from checkout.</p>

        {err && <pre className="error" style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>{err}</pre>}
        {ok && <div className="ok" style={{ marginBottom: 12 }}>{ok}</div>}

        <section className="section">
          <div className="head">
            <h3>Transactions</h3>
            <div className="actions">
              <input
                placeholder="Search by TX ID / customer / product"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 260 }}
              />
              <button className="btn" onClick={fetchTx}>Refresh</button>
              <button className="btn" onClick={doExportPdf}>Export PDF</button>
            </div>
          </div>

          <div className="body">
            {loading ? (
              <div className="muted">Loading transactions…</div>
            ) : rows.length === 0 ? (
              <div className="muted">No transactions yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th className="right">Qty</th>
                      <th className="right">Unit</th>
                      <th className="right">Discounts</th>
                      <th className="right">Total</th>
                      <th>Status</th>
                      <th className="center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rid}>
                        <td className="center">{r.displayId}</td>
                        <td>{r.date}</td>
                        <td>{r.customer}</td>
                        <td>{r.productName}</td>
                        <td className="right">{r.qty}</td>
                        <td className="right">{money(r.unitPrice)}</td>
                        <td className="right">{r.discountPerUnit ? money(r.discountPerUnit) : "—"}</td>
                        <td className="right">{money(r.total)}</td>
                        <td><span className={`pill ${r.status}`}>{r.status}</span></td>
                        <td className="center">
                          <button className="btn small warning" onClick={() => openEdit(r)}>✏️ Edit</button>
                          <button className="btn small danger" onClick={() => deleteTx(r.rid)}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {editing && (
          <div className="modal-backdrop" onClick={closeEdit} role="dialog" aria-modal="true">
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Update Transaction</h3>
              <div className="modal-grid one-col">
                <div>
                  <label>Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  >
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="refund">refund</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={closeEdit} disabled={saving}>Cancel</button>
                <button className="btn success" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
