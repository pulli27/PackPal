// src/components/Finance/Finance.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Finance.css";
import TransactionsTable from "../TransactionsTable/TransactionsTable";


/* ===== BACKEND ROUTES ===== */
const PRODUCTS_URL = "http://localhost:5000/carts";
const TX_URL = "http://localhost:5000/transactions";

/* ===== Helpers ===== */
const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const nowISO = () => new Date().toISOString().slice(0, 10);

const effectivePrice = (p) => {
  const price = Number(p?.price || 0);
  const dv = Number(p?.discountValue || 0);
  if (p?.discountType === "percentage") return Math.max(0, price * (1 - dv / 100));
  if (p?.discountType === "fixed") return Math.max(0, price - dv);
  return price;
};
const saving = (p) => Math.max(0, Number(p?.price || 0) - effectivePrice(p));

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
    </style>
  </head><body>${inner}</body></html>`);
  w.document.close();
  w.print();
};

/* ===== Normalizers ===== */
const unpackList = (payload) =>
  Array.isArray(payload)
    ? payload
    : payload?.transactions ?? payload?.products ?? payload?.items ?? payload?.data ?? [];

const toProduct = (row) => ({
  id: String(row?.id ?? row?._id ?? row?.productId ?? Math.random().toString(36).slice(2, 10)),
  name: row?.name ?? "Unnamed",
  price: Number(row?.price ?? 0),
  discountType: row?.discountType ?? "none",
  discountValue: Number(row?.discountValue ?? 0),
});

// ✅ Updated here → Ensure only YYYY-MM-DD is shown
const toTx = (row) => ({
  id: String(row?.id ?? row?._id ?? row?.txId ?? row?.transactionId ?? Math.random().toString(36).slice(2, 10)),
  date: row?.date ? row.date.slice(0, 10) : nowISO(), // ✅ Remove time
  customer: row?.customer ?? "",
  customerId: row?.customerId ?? "",
  fmc: Boolean(row?.fmc),
  productId: String(row?.productId ?? row?.product?._id ?? ""),
  productName: row?.productName ?? row?.product?.name ?? "",
  qty: Number(row?.qty ?? 1),
  unitPrice: Number(row?.unitPrice ?? 0),
  discountPerUnit: Number(row?.discountPerUnit ?? 0),
  total: Number(row?.total ?? 0),
  method: row?.method ?? "Cash",
  status: row?.status ?? "Paid",
  notes: row?.notes ?? "",
});

/* ===== fetchHandler (axios) ===== */
const fetchHandler = {
  getProducts: async () => {
    const res = await axios.get(PRODUCTS_URL);
    return unpackList(res.data).map(toProduct);
  },
  getTransactions: async () => {
    const res = await axios.get(TX_URL);
    return unpackList(res.data).map(toTx);
  },
};

export default function FinancePage() {
  const [products, setProducts] = useState([]);
  const [txs, setTxs] = useState([]);
  const [form, setForm] = useState({
    customer: "",
    customerId: "",
    fmc: "true",
    productId: "",
    qty: 1,
    date: nowISO(),
    method: "Cash",
    status: "Paid",
    notes: "",
  });

  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===== Load from DB ===== */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [p, t] = await Promise.all([
          fetchHandler.getProducts(),
          fetchHandler.getTransactions(),
        ]);
        setProducts(p);
        setTxs(t);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===== CRUD ===== */
  const refreshTransactions = async () => {
    const fresh = await fetchHandler.getTransactions();
    setTxs(fresh);
    window.dispatchEvent(new Event("tx:changed"));
  };

  const addTx = async () => {
    const pid = String(form.productId);
    const qty = parseInt(form.qty || "1", 10);
    const product = products.find((x) => x.id === pid);

    if (!form.customer.trim() || !product || qty <= 0) {
      alert("Fill all transaction fields correctly.");
      return;
    }

    const unit = effectivePrice(product);
    const disc = saving(product);

    const payload = {
      date: form.date || nowISO(),
      customer: form.customer.trim(),
      customerId: form.customerId.trim(),
      fmc: form.fmc === "true",
      productId: product.id,
      productName: product.name,
      qty,
      unitPrice: unit,
      discountPerUnit: disc,
      total: unit * qty,
      method: form.method,
      status: form.status,
      notes: form.notes || "",
    };

    try {
      await axios.post(TX_URL, payload, { headers: { "Content-Type": "application/json" } });
      await refreshTransactions();
      setForm({
        customer: "", customerId: "", fmc: "true", productId: "", qty: 1,
        date: nowISO(), method: "Cash", status: "Paid", notes: "",
      });
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to add transaction");
    }
  };

  const deleteTx = async (realId) => {
    if (!window.confirm("Delete transaction " + realId + "?")) return;
    try {
      await axios.delete(`${TX_URL}/${realId}`);
      await refreshTransactions();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  const cycleStatus = async (realId) => {
    const current = txs.find((t) => t.id === realId);
    if (!current) return;
    const next = current.status === "Paid" ? "Pending" : current.status === "Pending" ? "Refund" : "Paid";
    try {
      await axios.put(`${TX_URL}/${realId}`, { ...current, status: next }, { headers: { "Content-Type": "application/json" } });
      await refreshTransactions();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  };

  /* ===== Filters ===== */
  const filtered = useMemo(() => {
    let list = txs.slice().reverse();
    if (filter === "Paid" || filter === "Pending" || filter === "Refund") {
      list = list.filter((t) => t.status === filter);
    } else if (filter === "FMC") {
      list = list.filter((t) => t.fmc);
    }
    const q = (query || "").toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.id || "").toLowerCase().includes(q) ||
          (t.customer || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [txs, filter, query]);

  /* ===== Create display rows with sequential TX ID ===== */
  const rowsWithSeq = useMemo(() => {
    return filtered.map((t, i) => ({
      ...t,
      rid: t.id,
      id: String(i + 1)
    }));
  }, [filtered]);

  const realIdFromDisplay = (displayId) => {
    const row = rowsWithSeq.find(r => String(r.id) === String(displayId));
    return row?.rid;
  };

  const handleCycleStatus = (displayId) => {
    const real = realIdFromDisplay(displayId);
    if (real) cycleStatus(real);
  };
  const handleDelete = (displayId) => {
    const real = realIdFromDisplay(displayId);
    if (real) deleteTx(real);
  };

  /* ===== Exports/Print use the same sequential IDs ===== */
  const exportTxCsv = () =>
    exportCsv("transactions", rowsWithSeq, [
      "id", "date", "customer", "customerId", "fmc", "productName", "qty",
      "unitPrice", "discountPerUnit", "total", "method", "status", "notes",
    ]);

  const printTx = () => {
    const rows = rowsWithSeq
      .map(
        (t) => `<tr>
          <td>${t.id}</td><td>${t.date}</td><td>${t.customer || ""}</td>
          <td>${t.fmc ? "FMC" : "Regular"}</td><td>${t.productName || ""}</td>
          <td>${t.qty}</td><td class="right">${money(t.unitPrice)}</td>
          <td class="right">${t.discountPerUnit > 0 ? money(t.discountPerUnit) : "—"}</td>
          <td class="right">${money(t.total)}</td><td>${t.status}</td>
        </tr>`
      )
      .join("");
    printHtml(
      `<h2>Transactions</h2>
       <table>
         <thead>
           <tr><th>TX ID</th><th>Date</th><th>Customer</th><th>Type</th><th>Product</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Total</th><th>Status</th></tr>
         </thead>
         <tbody>${rows}</tbody>
       </table>`
    );
  };

  return (
    <div className="content finance-page">
      <h1 className="page-title">Finance</h1>
      <p className="muted">Financial transactions including FMC customers.</p>

      {loading && <div className="muted">Connecting to backend…</div>}
      {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}

      {/* Add Transaction */}
      <section className="section">
        <div className="head"><h3>Add Transaction</h3></div>
        <div className="body">
          <div className="grid grid-3">
            <div>
              <label>Customer Name</label>
              <input value={form.customer} onChange={(e) => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="e.g., Jane Doe" />
            </div>
            <div>
              <label>Customer ID</label>
              <input value={form.customerId} onChange={(e) => setForm(f => ({ ...f, customerId: e.target.value }))} placeholder="e.g., FMC-001" />
            </div>
            <div>
              <label>Finance Managed Customer?</label>
              <select value={form.fmc} onChange={(e) => setForm(f => ({ ...f, fmc: e.target.value }))}>
                <option value="true">Yes (FMC)</option>
                <option value="false">No (Regular)</option>
              </select>
            </div>
            <div>
              <label>Product</label>
              <select value={form.productId} onChange={(e) => setForm(f => ({ ...f, productId: e.target.value }))}>
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(effectivePrice(p))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Quantity</label>
              <input type="number" min="1" value={form.qty} onChange={(e) => setForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label>Payment Method</label>
              <select value={form.method} onChange={(e) => setForm(f => ({ ...f, method: e.target.value }))}>
                <option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Invoice</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Paid</option><option>Pending</option><option>Refund</option>
              </select>
            </div>
            <div>
              <label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div className="actions" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={addTx}>➕ Add Transaction</button>
            <button
              className="btn"
              onClick={() => setForm({
                customer: "", customerId: "", fmc: "true", productId: "", qty: 1,
                date: nowISO(), method: "Cash", status: "Paid", notes: ""
              })}
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="section">
        <div className="head">
          <h3>Transactions</h3>
          <div className="actions">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refund">Refund</option>
              <option value="FMC">FMC Only</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer / TX ID"
              style={{ minWidth: 220 }}
            />
            <button className="btn" onClick={exportTxCsv}>Export CSV</button>
            <button className="btn" onClick={printTx}>Print</button>
          </div>
        </div>

        <TransactionsTable
          rows={rowsWithSeq}
          onCycleStatus={handleCycleStatus}
          onDelete={handleDelete}
          showActions={true}
        />
      </section>
    </div>
  );
}
