// src/components/Finance/Finance.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Finance.css";
import Sidebarsa from "../Sidebar/Sidebarsa";

const TX_URL = "http://localhost:5000/transactions";

const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const nowISO = () => new Date().toISOString().slice(0, 10);

const unpackList = (payload) =>
  Array.isArray(payload)
    ? payload
    : payload?.transactions ?? payload?.items ?? payload?.data ?? [];

// NOTE: method removed; status added (default "pending")
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
  productName: row?.productName ?? row?.product?.name ?? "",
  qty: Number(row?.qty ?? 1),
  unitPrice: Number(row?.unitPrice ?? 0),
  discountPerUnit: Number(row?.discountPerUnit ?? 0),
  total: Number(row?.total ?? 0),
  status: (row?.status ?? "pending").toLowerCase(), // "pending" | "paid" | "refund"
});

// CSV helpers
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
    <style>
      body{font-family:Arial,sans-serif;padding:16px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:8px}
      thead th{background:#f3f4f6}
      .right{text-align:right}
      .center{text-align:center}
      .pill{padding:4px 8px;border-radius:999px;font-weight:700;text-transform:capitalize;display:inline-block}
      .pill.pending{background:#fef3c7;color:#b45309}
      .pill.paid{background:#dcfce7;color:#15803d}
      .pill.refund{background:#fee2e2;color:#b91c1c}
    </style>
  </head><body>${inner}</body></html>`);
  w.document.close();
  w.print();
};

export default function FinancePage() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");

  // status-only edit modal
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

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
  useEffect(() => { fetchTx(); }, []);

  // newest first
  const rawRows = useMemo(() => txs.slice().reverse(), [txs]);

  // filtered rows with displayId + rid
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
    return filtered.map((t, i) => ({
      ...t,
      rid: t.id,
      displayId: String(i + 1),
    }));
  }, [rawRows, q]);

  const doExport = () =>
    exportCsv(
      "transactions",
      rows.map((r) => ({
        txId: r.displayId,
        date: r.date,
        customer: r.customer,
        product: r.productName,
        qty: r.qty,
        unitPrice: r.unitPrice,
        discount: r.discountPerUnit,
        total: r.total,
        status: r.status, // export status instead of method
      })),
      ["txId", "date", "customer", "product", "qty", "unitPrice", "discount", "total", "status"]
    );

  const doPrint = () => {
    const body = rows
      .map(
        (r) => `<tr>
          <td class="center">${r.displayId}</td>
          <td>${r.date}</td>
          <td>${r.customer || ""}</td>
          <td>${r.productName || ""}</td>
          <td class="right">${r.qty}</td>
          <td class="right">${money(r.unitPrice)}</td>
          <td class="right">${r.discountPerUnit ? money(r.discountPerUnit) : "—"}</td>
          <td class="right">${money(r.total)}</td>
          <td><span class="pill ${r.status}">${r.status}</span></td>
        </tr>`
      )
      .join("");
    printHtml(`
      <h2>Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>TX ID</th><th>Date</th><th>Customer</th><th>Product</th>
            <th>Qty</th><th>Unit</th><th>Discount</th><th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `);
  };

  // ====== ACTIONS: EDIT (status only) ======
  const openEdit = (row) =>
    setEditing({
      id: row.rid,       // real backend id
      status: row.status // current status
    });
  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setErr(""); setOk("");
    try {
      // find the original row so we PUT full record with updated status only
      const orig = txs.find((t) => t.id === editing.id);
      const payload = {
        // keep original values to satisfy PUT APIs
        date: orig?.date,
        customer: orig?.customer,
        productName: orig?.productName,
        qty: Number(orig?.qty || 1),
        unitPrice: Number(orig?.unitPrice || 0),
        discountPerUnit: Number(orig?.discountPerUnit || 0),
        total: Number(orig?.total || (Number(orig?.unitPrice || 0) * Number(orig?.qty || 1))),
        status: editing.status, // only change
      };
      await axios.put(`${TX_URL}/${editing.id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setOk("Status updated.");
      setEditing(null);
      await fetchTx();
      setTimeout(() => setOk(""), 1800);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ====== DELETE BUTTON ======
  const deleteTx = async (rowId) => {
    if (!window.confirm("Delete this transaction?")) return;
    setErr(""); setOk("");
    try {
      await axios.delete(`${TX_URL}/${rowId}`);
      await fetchTx();
      setOk("Deleted.");
      setTimeout(() => setOk(""), 1800);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

 return (
  /* === PAGE WRAP START === */
  <div className="page-wrap finance-page">
    {/* Left: Sidebar */}
    <Sidebarsa />

    {/* Right: Main */}
    <main className="finance-main">
      <h1 className="page-title">Finance</h1>
      <p className="muted">Payments recorded from checkout.</p>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
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
            <button className="btn" onClick={doExport}>Export CSV</button>
            <button className="btn" onClick={doPrint}>Print</button>
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
                    <th className="right">Discounts</th>{/* ← fixed label */}
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
                      <td className="right">
                        {r.discountPerUnit ? money(r.discountPerUnit) : "—"}
                      </td>
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

      {/* STATUS-ONLY EDIT MODAL */}
      {editing && (
        <div className="modal-backdrop" onClick={closeEdit} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Status</h3>
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
  /* === PAGE WRAP END === */
);

}
