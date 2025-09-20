// src/pages/CustomerView.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Customerview.css";

const URL = "http://localhost:5000/carts";
const STORAGE_KEY = "packPalCart";
const WISHLIST_KEY = "packPalWishlist";

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

const toUI = (row) => ({
  id: String(
    row?.id ?? row?._id ?? row?.productId ?? Math.random().toString(36).slice(2, 10)
  ),
  name: row?.name ?? "Unnamed",
  category: row?.category ?? "BACKPACKS",
  img: row?.img ?? "",
  price: Number(row?.price ?? 0),
  rating: Number(row?.rating ?? 4.5),
  reviews: Number(row?.reviews ?? row?.ratingCount ?? 0),
  discountType: row?.discountType ?? "none",
  discountValue: Number(row?.discountValue ?? 0),
  badge: row?.badge ?? row?.tag ?? "",
  description:
    row?.description ??
    row?.shortDescription ??
    "Durable, comfy straps, and playful design — perfect for school & play.",
});

const imgSrc = (val) => {
  if (!val) return "https://via.placeholder.com/800x600?text=Bag";
  if (val.startsWith("http")) return val;
  if (val.startsWith("/")) return val;
  if (val.startsWith("images/")) return "/" + val;
  return val;
};

// localStorage helpers
const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const writeJSON = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

export default function CustomerView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(null);
  const [wishlist, setWishlist] = useState(() => new Set(readJSON(WISHLIST_KEY, [])));
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("sidebar-off");
    const root = document.querySelector(".cv-page");
    if (root) {
      root.style.position = "relative";
      root.style.zIndex = "1";
    }
    return () => {
      document.body.classList.remove("sidebar-off");
      if (root) {
        root.style.position = "";
        root.style.zIndex = "";
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await axios.get(URL).then((r) => r.data);
        const list = Array.isArray(data)
          ? data
          : data?.products ?? data?.items ?? data?.data ?? [];
        setProducts(list.map(toUI));
      } catch (e) {
        const msg =
          e?.response?.status === 404
            ? `404 Not Found: ${URL} — check your backend route`
            : e?.response?.data?.message || e.message || "Failed to load";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  // cart helpers
  const readCart = () => readJSON(STORAGE_KEY, []);
  const writeCart = (arr) => writeJSON(STORAGE_KEY, arr);

  const addToCart = (p) => {
    const newItem = {
      id: String(p.id),
      name: p.name,
      price: Number(effectivePrice(p)),
      quantity: 1,
      icon: "🎒",
      img: imgSrc(p.img),
      category: p.category || "",
      description: p.description || "Added from Kids Bags",
    };

    const list = readCart();
    const idx = list.findIndex((x) => String(x.id) === String(newItem.id));
    if (idx >= 0) {
      list[idx].quantity = Math.max(1, Number(list[idx].quantity || 1) + 1);
    } else {
      list.push(newItem);
    }
    writeCart(list);
    navigate("/cart", { state: { justAdded: newItem }, replace: false });
  };

  const addAllFiltered = () => {
    const list = readCart();
    const map = new Map(list.map((x) => [String(x.id), x]));
    filtered.forEach((p) => {
      const id = String(p.id);
      if (map.has(id)) {
        const it = map.get(id);
        it.quantity = Math.max(1, Number(it.quantity || 1) + 1);
      } else {
        map.set(id, {
          id,
          name: p.name,
          price: Number(effectivePrice(p)),
          quantity: 1,
          icon: "🎒",
          img: imgSrc(p.img),
          category: p.category || "",
          description: p.description || "Added from Kids Bags",
        });
      }
    });
    const next = Array.from(map.values());
    writeCart(next);
    navigate("/cart", { state: { addedMany: true }, replace: false });
  };

  // wishlist logic
  const isWished = (id) => wishlist.has(String(id));
  const toggleWishlist = (p) => {
    const id = String(p.id);
    const next = new Set(wishlist);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setWishlist(next);
    writeJSON(WISHLIST_KEY, Array.from(next));
  };

  const openMore = (p) => { setActive(p); setShow(true); };
  const closeMore = () => { setShow(false); setActive(null); };

  return (
    <div className="cv-page cv-no-sidebar">
      <header className="cv-hero">
        <div className="cv-hero-inner">
          <div className="cv-brand">PackPal</div>
          <nav className="cv-top-nav">
            <a className="active" href="#kids">Home</a>
          </nav>
        </div>

        <div className="cv-hero-content">
          <h1>Bright &amp; Bags</h1>
          <p>Fun designs, durable materials, comfy straps – built for school, play and everything in between.</p>

          <div className="cv-hero-search">
            <input
              placeholder="Search: unicorn, superhero, waterproof, trolley…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" aria-label="Search">🔍</button>
          </div>

          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn primary" onClick={addAllFiltered}>
                Add All To Cart
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="cv-container" style={{ position: "relative", zIndex: 2 }}>
        <div className="cv-list-head" style={{ alignItems: "center" }}>
          <div className="cv-count">
            {loading ? "Loading…" : <>Showing <strong>{filtered.length}</strong> products</>}
          </div>
        </div>

        {err && <div className="cv-error">{err}</div>}

        <div className="cards-grid">
          {filtered.map((p) => {
            const isDiscount = p.discountType !== "none" && Number(p.discountValue) > 0;
            const newPrice = money(effectivePrice(p));
            const oldPrice = money(p.price);
            const chip =
              p.discountType === "percentage"
                ? pct(p.discountValue)
                : `-${money(p.discountValue)}`;
            const wished = isWished(p.id);

            return (
              <article className="card" key={p.id} style={{ position: "relative" }}>
                <div className="card-media">
                  {!!p.badge && <span className="badge">{String(p.badge).toUpperCase()}</span>}
                  <img
                    src={imgSrc(p.img)}
                    alt={p.name}
                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/800x600?text=Bag"; }}
                    draggable={false}
                  />
                </div>

                <div className="price-block">
                  {isDiscount ? (
                    <>
                      <span className="price-old">{oldPrice}</span>
                      <span className="price-new">{newPrice}</span>
                      <span className="price-chip">{chip}</span>
                    </>
                  ) : (
                    <span className="price-new">{oldPrice}</span>
                  )}
                </div>

                <div className="card-body">
                  <div className="category">{(p.category || "BACKPACKS").toUpperCase()}</div>
                  <h3 className="title">{p.name}</h3>

                  <div className="rating-row">
                    <span className="stars" aria-hidden="true">★★★★★</span>
                    <span className="reviews">({p.reviews})</span>
                  </div>

                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => addToCart(p)}
                      style={{ position: "relative", zIndex: 3 }}
                    >
                      Add to Cart
                    </button>

                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => openMore(p)}
                      style={{ position: "relative", zIndex: 3 }}
                    >
                      More
                    </button>

                    {/* Centered wishlist heart */}
                    <button
                      type="button"
                      className={`btn heart${wished ? " active" : ""}`}
                      aria-pressed={wished}
                      title={wished ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={() => toggleWishlist(p)}
                      style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
                    >
                      {wished ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && !err && filtered.length === 0 && (
          <div className="cv-empty">No matching products</div>
        )}
      </main>

      {show && active && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeMore}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 640px)",
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              <img
                src={imgSrc(active.img)}
                alt={active.name}
                style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 12 }}
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/800x600?text=Bag"; }}
                draggable={false}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 6px" }}>{active.name}</h3>
                <div style={{ color: "#61708b", marginBottom: 12 }}>{active.description}</div>
                <div style={{ fontWeight: 700 }}>
                  {money(effectivePrice(active))}
                  {active.discountType !== "none" && (
                    <span
                      style={{
                        marginLeft: 8,
                        textDecoration: "line-through",
                        color: "#98a2b3",
                      }}
                    >
                      {money(active.price)}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 16, position: "relative" }}>
                  <button type="button" className="btn primary" onClick={() => addToCart(active)}>
                    Add to Cart
                  </button>
                  <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={closeMore}>
                    Close
                  </button>
                  <button
                    type="button"
                    className={`btn heart${isWished(active.id) ? " active" : ""}`}
                    aria-pressed={isWished(active.id)}
                    title={isWished(active.id) ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={() => toggleWishlist(active)}
                    style={{ marginLeft: 8 }}
                  >
                    {isWished(active.id) ? "♥" : "♡"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
