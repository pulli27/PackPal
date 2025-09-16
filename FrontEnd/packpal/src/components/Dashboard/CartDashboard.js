// src/components/CartDashboard/CartDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CartDashboard.css";
import TransactionsTable from "../TransactionsTable/TransactionsTable";

const PRODUCTS_URL = "http://localhost:5000/carts";
const TX_URL = "http://localhost:5000/transactions";

const money = (n) =>
  "LKR" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

// ✅ Always format the transaction date as YYYY-MM-DD
const toTx = (row) => ({
  id: String(row?.id ?? row?._id ?? row?.txId ?? row?.transactionId ?? Math.random().toString(36).slice(2, 10)),
  date: row?.date ? String(row.date).slice(0, 10) : "", // ✅ Only date
  customer: row?.customer ?? "",
  fmc: Boolean(row?.fmc),
  productName: row?.productName ?? row?.product?.name ?? "",
  qty: Number(row?.qty ?? 1),
  unitPrice: Number(row?.unitPrice ?? 0),
  discountPerUnit: Number(row?.discountPerUnit ?? 0),
  total: Number(row?.total ?? 0),
  status: row?.status ?? "Paid",
});

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

export default function CartDashboard() {
  const [products, setProducts] = useState([]);
  const [txs, setTxs] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      setErr("");
      try {
        const [p, t] = await Promise.all([
          fetchHandler.getProducts(),
          fetchHandler.getTransactions(),
        ]);
        if (!mounted) return;
        setProducts(p);
        setTxs(t);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.message || e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    const onTxChanged = () => loadAll();
    const onProductsChanged = () => loadAll();
    const onFocus = () => loadAll();

    window.addEventListener("tx:changed", onTxChanged);
    window.addEventListener("products:changed", onProductsChanged);
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      window.removeEventListener("tx:changed", onTxChanged);
      window.removeEventListener("products:changed", onProductsChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // KPIs + Recent base list
  const { productsCount, activeDiscounts, totalPaid, totalPending, recent } = useMemo(() => {
    const p = Array.isArray(products) ? products : [];
    const t = Array.isArray(txs) ? txs : [];

    const productsCount = p.length;
    const activeDiscounts = p.filter(
      (x) => (x?.discountType ?? "none") !== "none" && Number(x?.discountValue ?? 0) > 0
    ).length;

    const paidRows = t.filter((r) => (r?.status || "").toLowerCase() === "paid");
    const pendRows = t.filter((r) => (r?.status || "").toLowerCase() === "pending");
    const totalPaid = paidRows.reduce((s, r) => s + (Number(r?.total) || 0), 0);
    const totalPending = pendRows.reduce((s, r) => s + (Number(r?.total) || 0), 0);

    const recent = [...t]
      .sort(
        (a, b) =>
          String(b.date).localeCompare(String(a.date)) ||
          String(b.id).localeCompare(String(a.id))
      )
      .slice(0, 10);

    return { productsCount, activeDiscounts, totalPaid, totalPending, recent };
  }, [products, txs]);

  // ✅ Create table rows with formatted dates + sequential TX ID
  const recentWithSeq = useMemo(
    () =>
      recent.map((t, i) => ({
        ...t,
        date: t.date ? String(t.date).slice(0, 10) : "", // ✅ Force date-only
        txId: t.id, // real backend id if needed
        id: String(i + 1), // display sequential number
      })),
    [recent]
  );

  return (
    <div className="dash">
      <header className="dash-header">
        <h1>Dashboard</h1>
        <p className="muted">Overview of inventory, discounts, and finance.</p>
      </header>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</div>}

      <div className="stats">
        <div className="card stat"><div className="v">{productsCount}</div><div className="l">Products</div></div>
        <div className="card stat"><div className="v">{activeDiscounts}</div><div className="l">Active Discounts</div></div>
        <div className="card stat"><div className="v">{money(totalPaid)}</div><div className="l">Total Sales (Paid)</div></div>
        <div className="card stat"><div className="v">{money(totalPending)}</div><div className="l">Pending Invoices</div></div>
      </div>

      <section className="section">
        <div className="head"><h3>Recent Transactions</h3></div>
        <TransactionsTable
          rows={recentWithSeq}  // ✅ Now dates are always YYYY-MM-DD
          limit={10}
          showActions={false}
          showDiscountCol={true}
          compact
        />
      </section>
    </div>
  );
}
