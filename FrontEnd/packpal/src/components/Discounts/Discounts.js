import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Discounts.css";

/* ===== ONE PLACE TO EDIT =====
   Point this to the SAME route your Products page uses. */
const URL = "http://localhost:5000/carts";

/* ===== Helpers ===== */
const money = (n) =>
  "LKR" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => `${Number(n || 0).toFixed(0)}%`;

const effectivePrice = (p) => {
  if (p.discountType === "percentage") return Math.max(0, Number(p.price) * (1 - (Number(p.discountValue) || 0) / 100));
  if (p.discountType === "fixed") return Math.max(0, Number(p.price) - (Number(p.discountValue) || 0));
  return Number(p.price || 0);
};
const saving = (p) => Math.max(0, Number(p.price || 0) - effectivePrice(p));

const toUI = (row) => ({
  id: String(row?.id ?? row?._id ?? row?.productId ?? Math.random().toString(36).slice(2, 10)),
  name: row?.name ?? "Unnamed",
  category: row?.category ?? "",
  img: row?.img ?? "",
  price: Number(row?.price ?? 0),
  stock: Number(row?.stock ?? 0),
  rating: Number(row?.rating ?? 0),
  discountType: row?.discountType ?? "none",
  discountValue: Number(row?.discountValue ?? 0),
});

// Accept array or common wrappers {products|items|data}
const unpackList = (payload) =>
  Array.isArray(payload) ? payload : payload?.products ?? payload?.items ?? payload?.data ?? [];

/* ===== fetchHandler (axios) ===== */
const fetchHandler = async () => {
  const res = await axios.get(URL);
  return res.data; // may be array or wrapped object
};

export default function DiscountsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", type: "none", value: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchHandler();
      setProducts(unpackList(data).map(toUI));
    } catch (e) {
      const msg = e?.response?.status === 404
        ? `404 Not Found: ${URL} — check your backend route`
        : e?.response?.data?.message || e.message || "Failed to load";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const discounted = useMemo(
    () => products.filter((p) => p.discountType !== "none" && (p.discountValue || 0) > 0),
    [products]
  );

  const applyDiscount = async () => {
    const id = form.productId;
    const type = form.type;
    const val = Number(form.value);

    if (!id) return alert("Please select a product.");
    if (type === "percentage" && (!Number.isFinite(val) || val < 0 || val > 90)) {
      return alert("Percentage must be between 0 and 90.");
    }
    if (type === "fixed" && (!Number.isFinite(val) || val < 0)) {
      return alert("Fixed discount must be ≥ 0.");
    }
    if (type === "none") return alert("Choose Percentage or Fixed to apply a discount.");

    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    const payload = { ...prod, discountType: type, discountValue: val };

    try {
      await axios.put(`${URL}/${id}`, payload, { headers: { "Content-Type": "application/json" } });
      await loadProducts();       // refresh dropdown + tables
      setForm((f) => ({ ...f, value: "" }));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to apply discount");
    }
  };

  const clearDiscount = async () => {
    const id = form.productId;
    if (!id) return alert("Please select a product.");

    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    const payload = { ...prod, discountType: "none", discountValue: 0 };

    try {
      await axios.put(`${URL}/${id}`, payload, { headers: { "Content-Type": "application/json" } });
      await loadProducts();
      setForm((f) => ({ productId: id, type: "none", value: "" }));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to clear discount");
    }
  };

  return (
    <div className="content discounts-page">
      <h1 className="page-title">Discounts</h1>
      <p className="muted">Create and manage product price discounts.</p>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}

      {/* Create / Update */}
      <section className="section">
        <div className="head">
          <h3>Create / Update Product Discounts</h3>
          <div className="actions">
            <button className="btn" onClick={loadProducts}>Reload</button>
          </div>
        </div>
        <div className="body">
          <div className="form-wrapper">
            <div className="grid grid-3">
              {/* Select Product (now lists REAL products) */}
              <div>
                <label>Select Product</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {money(effectivePrice(p))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Discount Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="none">None</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (LKR)</option>
                </select>
              </div>

              <div>
                <label>Discount Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 10 or 500"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  disabled={form.type === "none"}
                />
              </div>
            </div>
          </div>

          <div className="actions" style={{ marginTop: 12, justifyContent: "center" }}>
            <button className="btn green" onClick={applyDiscount}>Apply Discount</button>
            <button className="btn red" onClick={clearDiscount}>Clear Discount</button>
          </div>
        </div>
      </section>

      {/* Active Discounts */}
      <section className="section">
        <div className="head"><h3>Active Discounts</h3></div>
        <div className="body table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>PRODUCT</th>
                <th className="right">BASE PRICE</th>
                <th>TYPE</th>
                <th className="right">VALUE</th>
                <th className="right">NEW PRICE</th>
                <th className="right">YOU SAVE</th>
              </tr>
            </thead>
            <tbody>
              {discounted.length === 0 && (
                <tr><td colSpan={7} className="muted">No active discounts</td></tr>
              )}
              {discounted.map((p, i) => {
                const ep = effectivePrice(p);
                const sv = saving(p);
                return (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td className="right">{money(p.price)}</td>
                    <td>{p.discountType === "percentage" ? "Percentage" : "Fixed"}</td>
                    <td className="right">
                      {p.discountType === "percentage" ? pct(p.discountValue) : money(p.discountValue)}
                    </td>
                    <td className="right">{money(ep)}</td>
                    <td className="right">{money(sv)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
} 