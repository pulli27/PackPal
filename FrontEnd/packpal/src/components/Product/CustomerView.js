// src/components/Product/CustomerView.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ProductList.css";

const URL = "http://localhost:5000/carts";
const money = (n) =>
  "LKR" +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const effectivePrice = (p) => {
  const price = Number(p?.price || 0);
  const dv = Number(p?.discountValue || 0);
  if (p?.discountType === "percentage") return Math.max(0, price * (1 - dv / 100));
  if (p?.discountType === "fixed") return Math.max(0, price - dv);
  return price;
};

const saving = (p) => Math.max(0, Number(p?.price || 0) - effectivePrice(p));

export default function CustomerView() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(URL);
      setProducts(res.data);
    } catch (e) {
      setErr("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const imgSrc = (val) => {
    if (!val) return "https://via.placeholder.com/64";
    if (val.startsWith("images/")) return "/" + val;
    return val;
  };

  return (
    <div className="content products-page">
      <h1 className="page-title">Customer View</h1>
      <p className="muted">Browse our available products</p>

      <div className="actions" style={{ marginBottom: 20 }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or category"
          style={{ minWidth: 240 }}
        />
        <button className="btn" onClick={() => setQuery(searchInput)}>Search</button>
        <button className="btn" onClick={() => { setSearchInput(""); setQuery(""); }}>Clear</button>
      </div>

      {loading && <div className="muted">Loading products…</div>}
      {err && <div className="error">{err}</div>}

      <div className="body">
        <table>
          <thead>
            <tr>
              <th>IMAGE</th>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th className="right">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const ep = effectivePrice(p);
              const sv = saving(p);
              return (
                <tr key={p.id}>
                  <td>
                    <img className="pimg" src={imgSrc(p.img)} alt="" />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category || ""}</td>
                  <td className="right">
                    {sv > 0 && <div className="price-old">{money(p.price)}</div>}
                    <div className="price-new">{money(ep)}</div>
                    {sv > 0 && <span className="save-text">Save {money(sv)}</span>}
                  </td>
                </tr>
              );
            })}
            {!loading && filteredProducts.length === 0 && (
              <tr><td colSpan={4} className="muted">No matching products</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
