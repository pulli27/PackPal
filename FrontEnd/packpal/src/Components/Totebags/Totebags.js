import React, { useEffect, useMemo, useState } from "react";
import "./Totebags.css";
// If you have shared Header/Footer, uncomment these:
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

/* ---------- helpers ---------- */
const money = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  });

const imgFallback = (e) => {
  const svg =
    "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 840'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f3f4f6'/%3E%3Cstop offset='1' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='840'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI' font-size='48' fill='%2399a1b1'%3EImage unavailable%3C/text%3E%3C/svg%3E";
  e.currentTarget.onerror = null;
  e.currentTarget.src = svg;
};

/* ---------- Tote products ----------
   Put images in public/images and reference with /images/filename.ext
*/
const PRODUCTS = [
  {
    id: "t1",
    category: "canvas",
    title: "Market Canvas Tote",
    price: 2990,
    image: { src: "/imagess/MCT.jpeg" },
    badge: "CANVAS",
    rating: 4.9,
    reviews: 214,
    descLong:
      "Heavy-duty canvas, wide gusset and interior slip pocket. Roomy enough for produce, books, and a water bottle.",
    specs: { Color: "Natural", Material: "16oz Canvas", Closure: "Open top", Weight: "540g" },
  },
  {
    id: "t2",
    category: "leather",
    title: "Classic Leather Tote",
    price: 1900,
    image: { src: "/imagess/CLT.jpeg" },
    badge: "LEATHER",
    rating: 4.8,
    reviews: 178,
    descLong:
      "Full-grain finish with reinforced straps and magnetic closure. A polished everyday carry.",
    specs: { Color: "Cognac", Material: "Leather", Closure: "Magnetic", Weight: "780g" },
  },
  {
    id: "t3",
    category: "work",
    title: "Zip-Top Work Tote",
    price: 1900,
    image: { src: "/imagess/ZTWT.jpeg" },
    badge: "WORK",
    rating: 4.4,
    reviews: 132,
    descLong:
      'Padded 14" laptop sleeve, interior organizer, and full zip closure for commute-ready security.',
    specs: { Color: "Black", Material: "Coated canvas", Closure: "Zip", Weight: "710g" },
  },
  {
    id: "t4",
    category: "beach",
    title: "Coastal Stripes Tote",
    price: 3450,
    image: { src: "/imagess/CST.jpeg" },
    badge: "BEACH",
    rating: 4.3,
    reviews: 97,
    descLong:
      "Beach-ready capacity with water-resistant lining and rope carry handles.",
    specs: { Color: "Navy/White", Material: "Poly Canvas", Lining: "Water-resistant", Weight: "560g" },
  },
  {
    id: "t5",
    category: "foldable",
    title: "Pack-Light Travel Tote",
    price: 2400,
    image: { src: "/imagess/PLT.jpeg" },
    badge: "PACKABLE",
    rating: 4.9,
    reviews: 165,
    descLong:
      "Ultra-light nylon that folds into its own pocket. Trolley sleeve for smooth airport moves.",
    specs: { Color: "Graphite", Material: "Ripstop Nylon", Feature: "Packable", Weight: "220g" },
  },
  {
    id: "t6",
    category: "leather",
    title: "Minimal Leather Tote",
    price: 2900,
    image: { src: "/imagess/MLT.jpeg" },
    badge: "NEW",
    rating: 4.4,
    reviews: 121,
    descLong:
      "Clean silhouette with structured base and interior zip pocket for essentials.",
    specs: { Color: "Black", Material: "Leather", Base: "Structured", Weight: "800g" },
  },
  {
    id: "t7",
    category: "canvas",
    title: "City Shopper Tote",
    price: 3200,
    image: { src: "/imagess/CSTT.jpeg" },
    badge: "URBAN",
    rating: 5,
    reviews: 203,
    descLong:
      "Everyday staple with key leash and a phone sleeve for quick access.",
    specs: { Color: "Olive", Material: "Canvas", Feature: "Key leash", Weight: "520g" },
  },
  {
    id: "t8",
    category: "beach",
    title: "Breeze Mesh Tote",
    price: 2750,
    image: { src: "/imagess/BMT.jpeg" },
    badge: "SAND-EASY",
    rating: 4.2,
    reviews: 84,
    descLong:
      "Mesh sides shake out sand. Quick-dry straps for post-swim comfort.",
    specs: { Color: "Teal", Material: "Mesh", Straps: "Quick-dry", Weight: "380g" },
  },
  {
    id: "t9",
    category: "work",
    title: "Vertical Office Tote",
    price: 3200,
    image: { src: "/imagess/VOT.jpeg" },
    badge: "PRO",
    rating: 4.4,
    reviews: 109,
    descLong:
      "Slim vertical profile with pen loops, card slots, and device sleeve.",
    specs: { Color: "Charcoal", Material: "Coated fabric", Sleeve: "13-inch", Weight: "620g" },
  },
  {
    id: "t10",
    category: "foldable",
    title: "Eco Fold Shopper",
    price: 1499,
    image: { src: "/imagess/EFST.jpeg" },
    badge: "ECO",
    rating: 5,
    reviews: 251,
    descLong:
      "Recycled ripstop that snaps into a wallet-size pouch. Strong, light, reusable.",
    specs: { Color: "Assorted", Material: "Recycled Ripstop", Fold: "Snap pouch", Weight: "160g" },
  },
  {
    id: "t11",
    category: "leather",
    title: "Day Leather Tote",
    price: 2800,
    image: { src: "/imagess/DAT.jpeg" },
    badge: "PREMIUM",
    rating: 4.9,
    reviews: 143,
    descLong:
      "Soft pebbled leather, interior zip pocket and key ring. Dressy yet durable.",
    specs: { Color: "Walnut", Material: "Pebbled leather", Closure: "Magnetic", Weight: "760g" },
  },
  {
    id: "t12",
    category: "canvas",
    title: "Color-Block Mini Tote",
    price: 2200,
    image: { src: "/imagess/CBMT.jpeg" },
    badge: "MINI",
    rating: 4.1,
    reviews: 76,
    descLong:
      "Compact carry for essentials—phone, wallet, gloss. Fun color-block panels.",
    specs: { Color: "Multi", Material: "Canvas", Size: "Mini", Weight: "300g" },
  },
];

const CATEGORIES = ["all", "canvas", "leather", "work", "beach", "foldable"];

export default function Totebags() {
  const [currentCategory, setCurrentCategory] = useState("all");
  const [term, setTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [toast, setToast] = useState("");

  /* Toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* Esc closes modals */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setDetailsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Filter + search */
  const visibleProducts = useMemo(() => {
    const list =
      currentCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === currentCategory);
    const q = term.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const t = p.title.toLowerCase();
      const c = p.category.toLowerCase();
      const d = (p.descLong || "").toLowerCase();
      return t.includes(q) || c.includes(q) || d.includes(q);
    });
  }, [currentCategory, term]);

  const resultsLabel = useMemo(() => {
    if (term.trim()) {
      return `Found ${visibleProducts.length} products for “${term.trim()}”`;
    }
    const scope = currentCategory === "all" ? "all categories" : currentCategory;
    return `Showing ${visibleProducts.length} ${
      visibleProducts.length === 1 ? "product" : "products"
    } in ${scope}`;
  }, [visibleProducts.length, term, currentCategory]);

  /* Cart */
  const addToCart = (product) => {
    setCart((prev) => [
      ...prev,
      { ...product, cartId: Date.now(), quantity: 1 },
    ]);
    setToast(`${product.title} added to cart!`);
  };
  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
    setToast("Item removed from cart");
  };
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0),
    [cart]
  );

  /* Wishlist */
  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setToast(wishlist.has(id) ? "Removed from wishlist" : "Added to wishlist");
  };

  /* Details modal */
  const openDetails = (product) => {
    setDetailsProduct(product);
    setDetailsOpen(true);
  };

  return (
    <div className="page-wrap">
       <Header />

      <div className="hb-page">
        {/* ================= HERO ================= */}
        <section className="hero">
          {/* Floating dots */}
          <div className="dots" aria-hidden="true">
            {Array.from({ length: 36 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = -Math.random() * 12;
              const dur = 10 + Math.random() * 10;
              const drift = (Math.random() * 160 - 80).toFixed(0);
              const scale = (0.7 + Math.random() * 0.8).toFixed(2);
              const sizeCls =
                Math.random() < 0.18 ? "lg" : Math.random() < 0.5 ? "sm" : "";
              return (
                <span
                  key={i}
                  className={`dot ${sizeCls}`}
                  style={{
                    left: `${left}%`,
                    "--delay": `${delay}s`,
                    "--dur": `${dur}s`,
                    "--dx": `${drift}px`,
                    "--scale": scale,
                  }}
                />
              );
            })}
          </div>

          <div className="hero-content">
            <h1>Tote Bags</h1>
            <p>
              Effortless everyday carry — canvas, leather, work-ready, and beach
              totes.
            </p>
            <div className="search-container">
              <input
                id="searchInput"
                className="search-input"
                placeholder="Search: canvas, leather, zip-top, laptop sleeve, beach…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <button className="search-btn" id="searchBtn" aria-label="Search">
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ================= MAIN ================= */}
        <main className="main-content">
          {/* Filters */}
          <section className="filter-section">
            <div className="filter-container" id="filters">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`filter-btn ${currentCategory === c ? "active" : ""}`}
                  data-category={c}
                  onClick={() => setCurrentCategory(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <div id="resultsInfo" className="results-info">
              {resultsLabel}
            </div>
          </section>

          {/* Grid */}
          <section id="productsGrid" className="products-grid">
            {visibleProducts.map((p) => (
              <div
                key={p.id}
                className={`product-card ${p.category}`}
                data-category={p.category}
              >
                <div
                  className={`product-image ${
                    p.image?.bgClass ? "bg" : ""
                  } ${p.image?.bgClass || ""}`}
                >
                  {p.image?.src ? (
                    <img
                      className="fit"
                      src={p.image.src}
                      alt={p.title}
                      onError={imgFallback}
                    />
                  ) : null}
                  <div className="product-badge">{p.badge}</div>
                </div>

                <div className="product-info">
                  <div className="product-category">
                    {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                  </div>
                  <h3 className="product-title">{p.title}</h3>
                  <div className="product-rating">
                    <span className="stars">
                      {"★".repeat(Math.round(p.rating || 4.5))}
                    </span>
                    <span className="rating-text">({p.reviews} reviews)</span>
                  </div>
                  <div className="product-price">
                    <span className="current-price">{money(p.price)}</span>
                  </div>
                  <div className="product-actions">
                    <button className="more-btn" onClick={() => openDetails(p)}>
                      More
                    </button>
                    <button
                      className="add-to-cart"
                      onClick={() => addToCart(p)}
                      title="Add to Cart"
                    >
                      Add to Cart
                    </button>
                    <button
                      className="wishlist-btn"
                      onClick={() => toggleWishlist(p.id)}
                      title="Toggle wishlist"
                      style={{
                        color: wishlist.has(p.id) ? "#ef4444" : undefined,
                      }}
                    >
                      {wishlist.has(p.id) ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </main>

        {/* Floating Cart */}
        <button
          className="floating-cart"
          onClick={() => setCartOpen(true)}
          aria-label="Open cart"
        >
          <svg
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
            <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z" />
          </svg>
          <span className="cart-count">{cart.length}</span>
        </button>

        {/* Cart Modal */}
        {cartOpen && (
          <div
            className="modal"
            onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
          >
            <div className="modal-panel">
              <div className="modal-header">
                <h2>Shopping Cart</h2>
                <button className="close-btn" onClick={() => setCartOpen(false)}>
                  Close
                </button>
              </div>

              <div id="cartItems">
                {cart.length === 0 ? (
                  <div className="empty">Your cart is empty</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.cartId} className="cart-row">
                      <div>
                        <div className="cart-title">{item.title}</div>
                        <div className="cart-qty">Qty: {item.quantity}</div>
                      </div>
                      <div className="cart-right">
                        <div className="cart-price">
                          {money(item.price * item.quantity)}
                        </div>
                        <button
                          className="cart-remove"
                          onClick={() => removeFromCart(item.cartId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-total">
                <div className="cart-total-row">
                  <span>Total:</span>
                  <span id="cartTotal">{money(total)}</span>
                </div>
                <button
                  className="btn-checkout"
                  onClick={() => {
                    if (!cart.length) {
                      setToast("Your cart is empty!");
                      return;
                    }
                    setToast("Redirecting to secure checkout…");
                    setTimeout(() => window.alert("Demo checkout complete."), 900);
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsOpen && detailsProduct && (
          <div
            className="modal"
            onClick={(e) => e.target === e.currentTarget && setDetailsOpen(false)}
          >
            <div className="modal-panel details-panel">
              <div className="details-grid">
                <div className="prod-photo">
                  <img
                    alt={detailsProduct.title}
                    src={detailsProduct.image?.src}
                    onError={imgFallback}
                  />
                </div>

                <div className="prod-info">
                  <h2 className="prod-title">{detailsProduct.title}</h2>

                  <div className="rating-row">
                    <span className="stars">
                      {"★".repeat(Math.round(detailsProduct.rating || 4.5))}
                    </span>
                    <div className="rating-meta">
                      {detailsProduct.rating?.toFixed(1)} •{" "}
                      {detailsProduct.reviews} reviews
                    </div>
                  </div>

                  <div className="prod-price">{money(detailsProduct.price)}</div>

                  <p className="prod-desc">{detailsProduct.descLong}</p>

                  <div className="specs-grid">
                    {Object.entries(detailsProduct.specs || {}).map(([k, v]) => (
                      <div key={k} className="spec-chip">
                        <span className="spec-k">{k}:</span>{" "}
                        <span className="spec-v">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="details-cta">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        addToCart(detailsProduct);
                        setDetailsOpen(false);
                        setCartOpen(true);
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="btn-soft"
                      onClick={() => setDetailsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div id="toast" className={`toast ${toast ? "show" : ""}`}>
          {toast}
        </div>
      </div>

      <Footer /> 
    </div>
  );
}
