import React, { useEffect, useMemo, useState } from "react";
import "./HandBag.css"; // keep this exact casing
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
/* ---------- helpers ---------- */
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const imgFallback = (e) => {
  const svg =
    "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 840'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f3f4f6'/%3E%3Cstop offset='1' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='840'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI' font-size='48' fill='%2399a1b1'%3EImage unavailable%3C/text%3E%3C/svg%3E";
  e.currentTarget.onerror = null;
  e.currentTarget.src = svg;
};

/* ---------- product data (includes specs for details modal) ---------- */
const PRODUCTS = [
  {
    id: "tote-1",
    category: "tote",
    title: "Heritage Canvas Tote",
    priceText: "LKR 1,129.99",
    price: 129.99,
    image: { src: "/images/canvas_tote.png" },
    badge: "BESTSELLER",
    rating: 4.7,
    reviews: 211,
    descLong:
      'Built from rugged 16oz canvas with reinforced handles and bar-tack stitching. Water-repellent finish, interior zip pocket and two slip pockets keep essentials tidy. Spacious enough for a 13" laptop and a water bottle—your everyday carry, organized.',
    specs: { Color: "Sand", Material: "Canvas", Strap: "Twin handles", Weight: "540g" },
  },
  {
    id: "shoulder-1",
    category: "shoulder",
    title: "Soft Curve Shoulder Bag",
    priceText: "LKR 1,695.00",
    price: 169.99,
    image: { bgClass: "bag-satchel" },
    badge: "NEW",
    rating: 4.4,
    reviews: 98,
    descLong:
      "A sleek crescent profile that tucks neatly under the arm. The magnetic flap gives quick access while the soft microfiber lining pampers your phone and sunnies. Adjustable strap for shoulder or short crossbody wear—polished and practical.",
    specs: { Color: "Mocha", Material: "Microfiber", Strap: "Adjustable", Weight: "420g" },
  },
  {
    id: "cross-1",
    category: "crossbody",
    title: "City Crossbody",
    priceText: "LKR 1,395.90",
    price: 139.99,
    image: { src: "/images/cross.png" },
    badge: "URBAN",
    rating: 4.8,
    reviews: 143,
    descLong:
      "City-ready and hands-free. Lightweight fabric with a scuff-resistant finish, twin zip compartments and an RFID-shielded slot for cards. The webbing strap adjusts from 60–120 cm so it sits exactly where you want it.",
    specs: { Color: "Charcoal", Material: "Technical fabric", Strap: "Webbing, 60–120cm", Weight: "360g" },
  },
  {
    id: "satchel-1",
    category: "satchel",
    title: "Structured Leather Satchel",
    priceText: "LKR 1,994.99",
    price: 199.99,
    image: { bgClass: "bag-satchel" },
    badge: "PREMIUM",
    rating: 4.9,
    reviews: 156,
    descLong:
      "A refined, structured profile crafted from smooth leather. Thoughtful interior organization with a central zip divider, slip pockets and a padded sleeve for a small tablet. Carry by the top handles or clip on the strap when you’re on the move.",
    specs: { Color: "Cognac", Material: "Leather", Strap: "Detachable", Weight: "780g" },
  },
  {
    id: "hobo-1",
    category: "hobo",
    title: "Slouchy Hobo",
    priceText: "LKR 149.99",
    price: 149.99,
    image: { src: "/images/hobo.png" },
    badge: "TRENDING",
    rating: 4.4,
    reviews: 87,
    descLong:
      "Supple pebbled leather drapes naturally for a relaxed look. A single roomy compartment swallows a sweater and water bottle; interior zip and slip pockets keep the small stuff in place. Lightweight, easy and effortlessly cool.",
    specs: { Color: "Black", Material: "Pebbled leather", Strap: "Shoulder", Weight: "540g" },
  },
  {
    id: "clutch-1",
    category: "clutch",
    title: "Evening Box Clutch",
    priceText: "LKR 2,950.00",
    price: 89.99,
    image: { src: "/images/box_cluth.png" },
    badge: "LIMITED",
    rating: 4.3,
    reviews: 95,
    descLong:
      "Sunny twin-panel clutch to brighten any outfit. Satin lining and a detachable chain let you go handheld or shoulder, your choice.",
    specs: { Color: "Sunflower", Strap: "Golden chain", Material: "PU", Weight: "290g" },
  },
  {
    id: "bucket-1",
    category: "bucket",
    title: "Drawstring Bucket Bag",
    priceText: "LKR 1,592.99",
    price: 159.99,
    image: { bgClass: "bag-bucket" },
    badge: "CLASSIC",
    rating: 4.7,
    reviews: 173,
    descLong:
      "Classic bucket shape with a smooth drawstring closure. Lined in soft microfiber with a flat base so it stands on its own. Comes with an adjustable crossbody strap—compact, but ready for day-to-night.",
    specs: { Color: "Taupe", Material: "Microfiber", Strap: "Adjustable", Weight: "510g" },
  },
  {
    id: "mini-1",
    category: "mini",
    title: "Mini Moon Bag",
    priceText: "LKR 1,200.00",
    price: 119.99,
    image: { src: "/images/mini_moon.jpg" },
    badge: "MINI",
    rating: 4.2,
    reviews: 95,
    descLong:
      "A petite crescent that still fits phone, keys and cards. Subtle magnetic closure, smooth lining and a slim, removable strap so you can wear it crossbody or carry it as a clutch.",
    specs: { Color: "Lilac", Material: "Vegan leather", Strap: "Removable", Weight: "280g" },
  },
  {
    id: "top-1",
    category: "top-handle",
    title: "Top-Handle Lady Bag",
    priceText: "LKR 2,190.00",
    price: 219.99,
    image: { src: "/images/top_handle.png" },
    badge: "ICON",
    rating: 4.9,
    reviews: 122,
    descLong:
      "An elegant, structured carry with a sculpted top handle. Secure turn-lock closure, tidy interior pockets and an optional shoulder strap. Sized to fit an iPad mini and diary—boardroom to brunch.",
    specs: { Color: "Ivory", Material: "Leather", Strap: "Detachable", Weight: "690g" },
  },
  {
    id: "quilt-1",
    category: "quilted",
    title: "Quilted Chain Bag",
    priceText: "LKR 1,895.00",
    price: 189.99,
    image: { bgClass: "bag-quilted" },
    badge: "LUXURY",
    rating: 4.8,
    reviews: 189,
    descLong:
      "Soft, diamond-quilted leather, finished with a glossy chain strap you can double up or wear long. Flap front with turn-lock and a tidy interior zip pocket—timeless and dress-up ready.",
    specs: { Color: "Burgundy", Material: "Leather", Strap: "Chain", Weight: "610g" },
  },
  {
    id: "camera-1",
    category: "camera",
    title: "Compact Camera Bag",
    priceText: "LKR 1,200.99",
    price: 129.99,
    image: { bgClass: "bag-camera" },
    badge: "COMPACT",
    rating: 4.3,
    reviews: 78,
    descLong:
      "Boxy camera-style silhouette with dual zips for wide-open access. Wide strap for all-day comfort and a card slot pocket inside. Fits a compact camera or your daily tech and essentials.",
    specs: { Color: "Navy", Material: "Coated canvas", Strap: "Wide webbing", Weight: "430g" },
  },
  {
    id: "baguette-1",
    category: "baguette",
    title: "Retro Baguette Bag",
    priceText: "LKR 1,395.99",
    price: 139.99,
    image: { src: "/images/retro_baguette.png" },
    badge: "’90s",
    rating: 4.6,
    reviews: 134,
    descLong:
      "A ’90s-inspired under-arm baguette with a short shoulder strap and clean hardware. Streamlined flap closure and just-right capacity for phone, wallet and keys—minimal, chic, nostalgic.",
    specs: { Color: "Mint", Material: "Vegan leather", Strap: "Shoulder", Weight: "350g" },
  },
];

const CATEGORIES = [
  "all",
  "tote",
  "shoulder",
  "crossbody",
  "satchel",
  "hobo",
  "clutch",
  "bucket",
  "mini",
  "top-handle",
  "quilted",
  "camera",
  "baguette",
];

/* star row for details modal */
const StarRow = ({ rating = 4.5 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const items = [];
  for (let i = 0; i < 5; i++) {
    const d =
      "M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z";
    const fill =
      i < full ? "#fbbf24" : i === full && half ? "url(#half)" : "rgba(0,0,0,.18)";
    items.push(
      <svg key={i} width="16" height="16" viewBox="0 0 20 19">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="rgba(0,0,0,.18)" />
          </linearGradient>
        </defs>
        <path d={d} fill={fill} />
      </svg>
    );
  }
  return <div className="stars-row">{items}</div>;
};

export default function Handbags() {
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
    const byCat =
      currentCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === currentCategory);
    const q = term.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter((p) => {
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
    setCart((prev) => [...prev, { ...product, cartId: Date.now(), quantity: 1 }]);
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
        {/* Hero (Accessories-style with floating dots + gold band) */}
        <section className="hero">
          {/* Floating dots layer */}
          <div className="dots" aria-hidden="true">
            {Array.from({ length: 36 }).map((_, i) => {
              const left = `${Math.random() * 100}%`;
              const delay = `${-Math.random() * 12}s`;
              const dur = `${10 + Math.random() * 10}s`;
              const drift = `${(Math.random() * 160 - 80).toFixed(0)}px`;
              const scale = (0.7 + Math.random() * 0.8).toFixed(2);
              const sizeCls = Math.random() < 0.18 ? "lg" : Math.random() < 0.5 ? "sm" : "";
              return (
                <span
                  key={i}
                  className={`dot ${sizeCls}`}
                  style={{
                    left,
                    "--delay": delay,
                    "--dur": dur,
                    "--dx": drift,
                    "--scale": scale,
                  }}
                />
              );
            })}
          </div>

          <div className="hero-content">
            <h1>Premium Handbags</h1>
            <p>Discover real, high-quality bags ready for every day.</p>
            <div className="search-container">
              <input
                id="searchInput"
                className="search-input"
                placeholder="Search for the perfect handbag..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <button className="search-btn" id="searchBtn" aria-label="Search">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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

        {/* Main */}
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
                  {c === "top-handle" ? "Top-Handle" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <div id="resultsInfo" className="results-info">
              {resultsLabel}
            </div>
          </section>

          {/* Products grid */}
          <section id="productsGrid" className="products-grid">
            {visibleProducts.map((p) => (
              <div key={p.id} className={`product-card ${p.category}`} data-category={p.category}>
                <div className={`product-image ${p.image.bgClass ? "bg" : ""} ${p.image.bgClass || ""}`}>
                  {p.image.src ? (
                    <img className="fit" src={p.image.src} alt={p.title} onError={imgFallback} />
                  ) : null}
                  <div className="product-badge">{p.badge}</div>
                </div>

                <div className="product-info">
                  <div className="product-category">
                    {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                  </div>
                  <h3 className="product-title">{p.title}</h3>
                  <div className="product-rating">
                    <span className="stars">{"★".repeat(Math.round(p.rating || 4.5))}</span>
                    <span className="rating-text">({p.reviews} reviews)</span>
                  </div>
                  <div className="product-price">
                    <span className="current-price">{p.priceText}</span>
                  </div>
                  <div className="product-actions">
                    <button className="more-btn" onClick={() => openDetails(p)}>
                      More
                    </button>
                    <button className="add-to-cart" onClick={() => addToCart(p)} title="Add to Cart">
                      Add to Cart
                    </button>
                    <button
                      className="wishlist-btn"
                      onClick={() => toggleWishlist(p.id)}
                      title="Toggle wishlist"
                      style={{ color: wishlist.has(p.id) ? "#ef4444" : undefined }}
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
        <button className="floating-cart" onClick={() => setCartOpen(true)} aria-label="Open cart">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
            <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z" />
          </svg>
          <span className="cart-count">{cart.length}</span>
        </button>

        {/* Cart Modal */}
        {cartOpen && (
          <div className="modal" onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}>
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
                        <div className="cart-price">{money(item.price * item.quantity)}</div>
                        <button className="cart-remove" onClick={() => removeFromCart(item.cartId)}>
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
          <div className="modal" onClick={(e) => e.target === e.currentTarget && setDetailsOpen(false)}>
            <div className="modal-panel details-panel">
              <div className="details-grid">
                <div className="prod-photo">
                  <img alt={detailsProduct.title} src={detailsProduct.image?.src} onError={imgFallback} />
                </div>

                <div className="prod-info">
                  <h2 className="prod-title">{detailsProduct.title}</h2>

                  <div className="rating-row">
                    <StarRow rating={detailsProduct.rating} />
                    <div className="rating-meta">
                      {detailsProduct.rating?.toFixed(1)} • {detailsProduct.reviews} reviews
                    </div>
                  </div>

                  <div className="prod-price">{detailsProduct.priceText}</div>

                  <p className="prod-desc">{detailsProduct.descLong}</p>

                  <div className="specs-grid">
                    {Object.entries(detailsProduct.specs || {}).map(([k, v]) => (
                      <div key={k} className="spec-chip">
                        <span className="spec-k">{k}:</span> <span className="spec-v">{v}</span>
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
                    <button className="btn-soft" onClick={() => setDetailsOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div id="toast" className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      </div>
      <Footer/>
    </div>
  );
}
