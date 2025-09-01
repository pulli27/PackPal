// src/components/Product/ProductList.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ProductList.css";

/* ===================== ONE PLACE TO EDIT =====================-[-[]]
*/
const URL = "http://localhost:5000/carts";

/* ===================== Helpers ===================== */
const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (n) => `${Number(n || 0).toFixed(0)}%`;

const effectivePrice = (p) => {
  const price = Number(p?.price || 0);
  const dv = Number(p?.discountValue || 0);
  if (p?.discountType === "percentage") return Math.max(0, price * (1 - dv / 100));
  if (p?.discountType === "fixed") return Math.max(0, price - dv);
  return price;
};
const saving = (p) => Math.max(0, Number(p?.price || 0) - effectivePrice(p));

// Normalize server → UI (handles Mongo _id or SQL id)
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

// Accept array or common wrappers
const unpackList = (payload) =>
  Array.isArray(payload) ? payload : payload?.products ?? payload?.items ?? payload?.data ?? [];

/* ===================== Validation helpers ===================== */
const isValidUrl = (s) => {
  if (!s) return true; // optional
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const validateProduct = (f) => {
  const errs = {};
  const name = String(f.name || "").trim();
  const category = String(f.category || "").trim();
  const img = String(f.img || "").trim();
  const price = Number(f.price);
  const stock = Number.isNaN(Number(f.stock)) ? f.stock : Number(f.stock);
  const rating = Number(f.rating);

  if (!name) errs.name = "Product name is required.";
  if (String(price).trim() === "" || Number.isNaN(price)) {
    errs.price = "Enter a valid price.";
  } else if (price < 0) {
    errs.price = "Price must be ≥ 0.";
  }

  if (String(stock).trim() !== "") {
    const iv = parseInt(stock, 10);
    if (Number.isNaN(iv) || iv < 0) errs.stock = "Stock must be an integer ≥ 0.";
  }

  if (String(rating).trim() !== "") {
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      errs.rating = "Rating must be between 0 and 5.";
    }
  }

  if (img && !isValidUrl(img)) {
    errs.img = "Image must be a valid http(s) URL.";
  }

  if (category.length > 50) {
    errs.category = "Category is too long (max 50 chars).";
  }

  return errs;
};

/* ===================== fetchHandler (axios) ===================== */
const fetchHandler = async () => {
  const res = await axios.get(URL);
  return res.data;
};

/* ===================== Modal ===================== */
function ProductModal({ open, onClose, onSave, product }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    img: "",
    price: "",
    stock: 0,
    rating: 4.5,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const syncValidate = (next) => {
    const e = validateProduct(next);
    setErrors(e);
    return e;
  };

  useEffect(() => {
    if (open) {
      const initial = {
        name: product?.name ?? "",
        category: product?.category ?? "",
        img: product?.img ?? "",
        price: product?.price ?? "",
        stock: product?.stock ?? 0,
        rating: product?.rating ?? 4.5,
      };
      setForm(initial);
      setTouched({});
      syncValidate(initial);
    }
  }, [open, product]);

  if (!open) return null;

  const hasErrors = Object.keys(errors).length > 0;

  const setField = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    syncValidate(next);
  };

  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const fieldClass = (key) => (touched[key] && errors[key] ? "input error" : "input");

  const errorText = (key) =>
    touched[key] && errors[key] ? <div className="err-text">{errors[key]}</div> : null;

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{product ? `Edit Product #${product.id}` : "Add Product"}</h3>
          <button className="x" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <form className="grid grid-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label>
                Product Name <span style={{ color: "#b91c1c" }}>*</span>
              </label>
              <input
                className={fieldClass("name")}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => markTouched("name")}
                placeholder="e.g., Leather Handbag"
                required
                maxLength={120}
              />
              {errorText("name")}
            </div>

            <div>
              <label>Category</label>
              <input
                className={fieldClass("category")}
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                onBlur={() => markTouched("category")}
                placeholder="e.g., Handbags"
                maxLength={50}
              />
              {errorText("category")}
            </div>

            <div>
              <label>Image URL</label>
              <input
                className={fieldClass("img")}
                placeholder="https://example.com/image.jpg"
                value={form.img}
                onChange={(e) => setField("img", e.target.value)}
                onBlur={() => markTouched("img")}
                inputMode="url"
              />
              {errorText("img")}
            </div>

            <div>
              <label>
                Price (LKR) <span style={{ color: "#b91c1c" }}>*</span>
              </label>
              <input
                className={fieldClass("price")}
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                onBlur={() => markTouched("price")}
              />
              {errorText("price")}
            </div>

            <div>
              <label>Stock</label>
              <input
                className={fieldClass("stock")}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                onBlur={() => markTouched("stock")}
              />
              {errorText("stock")}
            </div>

            <div>
              <label>Rating (0–5)</label>
              <input
                className={fieldClass("rating")}
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => setField("rating", e.target.value)}
                onBlur={() => markTouched("rating")}
              />
              {errorText("rating")}
            </div>
          </form>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={hasErrors}
            title={hasErrors ? "Fix validation errors to save" : "Save"}
            onClick={() => {
              // mark all touched so errors show if user tries early
              setTouched({
                name: true,
                category: true,
                img: true,
                price: true,
                stock: true,
                rating: true,
              });
              const errs = validateProduct(form);
              setErrors(errs);
              if (Object.keys(errs).length > 0) return;

              const payload = {
                name: form.name.trim(),
                category: form.category.trim(),
                img: form.img.trim(),
                price: parseFloat(form.price),
                stock: parseInt(form.stock || 0, 10),
                rating: parseFloat(form.rating || 0),
              };
              onSave(payload);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState({ open: false, product: null });

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchHandler();
      setProducts(unpackList(data).map(toUI));
    } catch (e) {
      const msg =
        e?.response?.status === 404
          ? `404 Not Found: ${URL} — check your backend route`
          : e?.response?.data?.message || e.message || "Failed to load";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Build sequential numbers 1..N for display only
  const productsWithSeq = useMemo(
    () => products.map((p, i) => ({ ...p, seq: i + 1 })),
    [products]
  );

  const discounted = useMemo(
    () =>
      productsWithSeq.filter(
        (p) => p.discountType !== "none" && (p.discountValue || 0) > 0
      ),
    [productsWithSeq]
  );

  const exportProducts = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSaveModal = async (payload) => {
    try {
      if (!modal.product) {
        // CREATE
        await axios.post(URL, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // UPDATE (use REAL backend id)
        await axios.put(`${URL}/${modal.product.id}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      }
      await fetchAll(); // refresh after save
      setModal({ open: false, product: null });

      // Notify other pages (e.g., dashboard) to refetch
      window.dispatchEvent(new Event("products:changed"));
    } catch (e) {
      const msg =
        e?.response?.status === 404
          ? `404 Not Found: ${URL} — check POST/PUT route`
          : e?.response?.data?.message || e.message || "Save failed";
      alert(msg);
    }
  };

  const onDelete = async (realId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${URL}/${realId}`);
      await fetchAll();
      window.dispatchEvent(new Event("products:changed"));
    } catch (e) {
      const msg =
        e?.response?.status === 404
          ? `404 Not Found: ${URL}/${realId} — check DELETE route`
          : e?.response?.data?.message || e.message || "Delete failed";
      alert(msg);
    }
  };

  return (
    <div className="content products-page">
      <h1 className="page-title">Products</h1>
      <p className="muted">Customer listing + Admin CRUD</p>

      {loading && <div className="muted">Loading products…</div>}
      {err && (
        <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>
          {err}
        </div>
      )}

      {/* Customer Listing */}
      <section className="section">
        <div className="head">
          <h3>Product Listing (Customer View)</h3>
        </div>
        <div className="body">
          <table>
            <thead>
              <tr>
                <th>IMAGE</th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th className="right">PRICE</th>
                <th className="center">DISCOUNT</th>
                <th>SAVE</th>
              </tr>
            </thead>
            <tbody>
              {productsWithSeq.map((p) => {
                const ep = effectivePrice(p);
                const sv = saving(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <img
                        className="pimg"
                        src={p.img || "https://via.placeholder.com/64"}
                        alt=""
                        onError={(e) =>
                          (e.currentTarget.src = "https://via.placeholder.com/64")
                        }
                      />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.category || ""}</td>
                    <td className="right">
                      {sv > 0 && <div className="price-old">{money(p.price)}</div>}
                      <div className="price-new">{money(ep)}</div>
                    </td>
                    <td className="center">
                      {p.discountType !== "none" && p.discountValue > 0 ? (
                        <span className="discount-chip">
                          {p.discountType === "percentage"
                            ? pct(p.discountValue)
                            : "LKR " + Number(p.discountValue).toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {sv > 0 ? (
                        <span className="save-text">Save {money(sv)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && !err && productsWithSeq.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin CRUD */}
      <section className="section">
        <div className="head">
          <h3>Manage Products (CRUD)</h3>
          <div className="actions">
            <button
              className="btn primary"
              onClick={() => setModal({ open: true, product: null })}
            >
              ➕ Add Product
            </button>
            <button className="btn" onClick={exportProducts}>
              Export JSON
            </button>
            <button className="btn" onClick={fetchAll}>
              Reload
            </button>
          </div>
        </div>
        <div className="body">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>IMAGE</th>
                <th>NAME</th>
                <th>CATEGORY</th>
                <th className="right">PRICE (LKR)</th>
                <th className="center">DISC</th>
                <th className="center">STOCK</th>
                <th className="center">RATING</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {productsWithSeq.map((p) => (
                <tr key={p.id}>
                  {/* 👉 Display sequential id */}
                  <td>{p.seq}</td>
                  <td>
                    <img
                      className="pimg"
                      src={p.img || "https://via.placeholder.com/64"}
                      alt=""
                      onError={(e) =>
                        (e.currentTarget.src = "https://via.placeholder.com/64")
                      }
                    />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category || ""}</td>
                  <td className="right">{money(p.price)}</td>
                  <td className="center">
                    {p.discountType === "percentage"
                      ? pct(p.discountValue)
                      : p.discountType === "fixed"
                      ? "LKR " + Number(p.discountValue).toLocaleString()
                      : "—"}
                  </td>
                  <td className="center">{p.stock || 0}</td>
                  <td className="center">{(p.rating || 0).toFixed(1)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn"
                        onClick={() => setModal({ open: true, product: p /* real id stays in p.id */ })}
                      >
                        Edit
                      </button>
                      <button className="btn red" onClick={() => onDelete(p.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && productsWithSeq.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted">
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active Discounts */}
      {discounted.length > 0 && (
        <section className="section">
          <div className="head">
            <h3>Active Discounts</h3>
          </div>
          <div className="body">
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
                {discounted.map((p, i) => {
                  const ep = effectivePrice(p);
                  const sv = saving(p);
                  return (
                    <tr key={p.id}>
                      {/* 👉 Show sequential id in this section as well */}
                      <td>{i + 1}</td>
                      <td>{p.name}</td>
                      <td className="right">{money(p.price)}</td>
                      <td>{p.discountType === "percentage" ? "Percentage" : "Fixed"}</td>
                      <td className="right">
                        {p.discountType === "percentage"
                          ? pct(p.discountValue)
                          : money(p.discountValue)}
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
      )}

      <ProductModal
        open={modal.open}
        product={modal.product}
        onClose={() => setModal({ open: false, product: null })}
        onSave={onSaveModal}
      />
    </div>
  );
}
