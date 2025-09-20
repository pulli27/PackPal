// src/Components/Clutches/Clutches.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Clutches.css";

function Clutches() {
  const navigate = useNavigate();

  /* ---------- Data ---------- */
  
  const PRODUCTS = [
    {id:'c2',   title:'Elegant Style C2', price:2500 , img:'images/c2.jpg',        category:'Classic', isNew:true,  discountPct:10, desc:'Soft pastel flap clutch with tassel accents—perfect for semi-formal events.', specs:{Color:'Blush', Strap:'Detachable', Material:'Vegan leather', Weight:'260g'}, rating:4.6, reviews:112},
    {id:'c8',   title:'Stylish C8',       price:2850 , img:'images/c8.jpg',        category:'Bold',    isNew:false, discountPct:0,  desc:'Vibrant statement clutch with tassel closure that turns heads.',           specs:{Color:'Amber', Strap:'Wristlet',   Material:'PU',            Weight:'280g'}, rating:4.2, reviews:87},
    {id:'c23',  title:'Classic C23',      price:2500 , img:'images/c23.jpg',       category:'Classic', isNew:true,  discountPct:15, desc:'Round emerald clutch for elegant evenings and weddings.',                 specs:{Color:'Emerald', Strap:'Chain',     Material:'Acrylic',       Weight:'300g'}, rating:4.8, reviews:154},
    {id:'c234', title:'Modern C234',      price:3000 , img:'images/c234.jpg',      category:'Modern',  isNew:false, discountPct:0,  desc:'Jewel-tone beaded clutch with gold chain for modern glam.',                specs:{Color:'Purple',  Strap:'Chain',     Material:'Beads',         Weight:'320g'}, rating:4.4, reviews:63},
    {id:'cbx',  title:'Crystal Box',      price:3200 , img:'images/clutch04.jpeg', category:'Crystal', isNew:false, discountPct:20, desc:'Black crystal box clutch with bead handle—compact & luxe.',                specs:{Color:'Black',   Strap:'Bead handle',Material:'Crystal/Metal', Weight:'350g'}, rating:4.7, reviews:201},
    {id:'tw1',  title:'Twin Style',       price:2950 , img:'images/clutches2.jpg', category:'Modern',  isNew:true,  discountPct:0,  desc:'Sunny twin-panel clutch to brighten any outfit.',                          specs:{Color:'Sunflower',Strap:'Golden chain',Material:'PU',          Weight:'290g'}, rating:4.3, reviews:95},
    {id:'mesh', title:'Statement Mesh',   price:3800 , img:'images/clutchh1.jpg',  category:'Mesh',    isNew:false, discountPct:12, desc:'Icy blue mesh pouch with soft silhouette and roomy interior.',             specs:{Color:'Ice Blue',Strap:'Drawstring', Material:'Mesh',          Weight:'260g'}, rating:4.1, reviews:72},
    {id:'gala', title:'Golden Gala',      price:3500 , img:'images/clutchh11.jpg', category:'Crystal', isNew:false, discountPct:0,  desc:'Sparkly silver-white clutch for premium occasions.',                       specs:{Color:'Silver',  Strap:'Chain',      Material:'Sequins',       Weight:'300g'}, rating:4.9, reviews:319},
  ];

  /* ---------- Helpers ---------- */
  const LKR = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const money = (n) => LKR.format(n);
  const finalPrice = (p) =>
    p.discountPct && p.discountPct > 0 ? p.price * (1 - p.discountPct / 100) : p.price;

  /* ---------- State ---------- */
  const [filters, setFilters] = useState({ q: "", category: "All" });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pacpal_cart") || "[]"); }
    catch { return []; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalId, setModalId] = useState(null);

  /* ---------- Derived ---------- */
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))],
    [PRODUCTS]
  );

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchQ = !q || p.title.toLowerCase().includes(q);
      const matchC = filters.category === "All" || p.category === filters.category;
      return matchQ && matchC;
    });
  }, [filters, PRODUCTS]);

  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const cartTotal = cart.reduce((a, c) => a + c.qty * c.price, 0);

  /* ---------- Effects ---------- */
  useEffect(() => {
    localStorage.setItem("pacpal_cart", JSON.stringify(cart));
  }, [cart]);

  /* ---------- Cart Ops ---------- */
  const addToCart = (id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const price = finalPrice(p);
    setCart((prev) => {
      const i = prev.findIndex((it) => it.id === id);
      if (i > -1) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
        } else {
        return [...prev, { id: p.id, title: p.title, price, img: p.img, qty: 1 }];
      }
    });
    setDrawerOpen(true);
  };

  const incItem = (id) => {
    setCart((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it))
    );
  };
  const decItem = (id) => {
    setCart((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: it.qty - 1 } : it))
        .filter((it) => it.qty > 0)
    );
  };
  const removeAll = (id) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
  };

  /* ---------- UI helpers ---------- */
  const ratingSnippet = (rating, reviews) => {
    const r = (Math.round(rating * 10) / 10).toFixed(1);
    return (
      <div
        className="rating-row"
        aria-label={`Rated ${r} out of 5 from ${reviews} reviews`}
      >
        {/* using CSS variable for stars; string key works in JS */}
        <span className="stars" style={{ ["--rating"]: r }} aria-hidden="true" />
        <span className="rating-num">
          {r} • {reviews.toLocaleString()} reviews
        </span>
      </div>
    );
  };

  const modalProduct = modalId ? PRODUCTS.find((p) => p.id === modalId) : null;
  const closeModal = () => setModalId(null);

  return (
    <div className="clutches-page">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <div className="logo">PackPal</div>
          <ul className="nav-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#clutches" className="active">Clutches</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className="nav-right">
            <button
              onClick={() => setDrawerOpen(true)}
              className="cart-btn"
              id="openCart"
            >
              Cart <span id="cartCount" className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1>Premium Clutch Collection</h1>
          <p>Explore our curated selection of elegant clutches—perfect for every occasion.</p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input
            id="searchInput"
            type="text"
            placeholder="Search clutches by name…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <div id="chipRow" className="chips">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip${filters.category === c ? " active" : ""}`}
              onClick={() => setFilters((f) => ({ ...f, category: c }))}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="main-content" id="clutches">
        {filtered.length === 0 ? (
          <div id="empty" className="empty">No products match your search.</div>
        ) : (
          <section id="grid" className="products-grid">
            {filtered.map((p) => {
              const now = finalPrice(p);
              const hasDisc = p.discountPct && p.discountPct > 0;
              return (
                <article className="product-card" key={p.id}>
                  <div className="product-image">
                    {p.isNew && <span className="badge-new">NEW</span>}
                    {hasDisc && <span className="badge-off">-{p.discountPct}%</span>}
                    <img src={p.img} alt={p.title} />
                  </div>
                  <div className="product-info">
                    <div className="product-category">{p.category}</div>
                    <h3 className="product-title">{p.title}</h3>
                    {ratingSnippet(p.rating, p.reviews)}
                    <div className="price-row">
                      <div className="price-now">{money(now)}</div>
                      {hasDisc && (
                        <>
                          <div className="price-old">{money(p.price)}</div>
                          <div className="price-save">Save {p.discountPct}%</div>
                        </>
                      )}
                    </div>
                    <div className="product-actions">
                      <button
                        className="btn btn-ghost more"
                        onClick={() => setModalId(p.id)}
                      >
                        More
                      </button>
                      <button
                        className="btn btn-primary add"
                        onClick={() => addToCart(p.id)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Drawer (Cart) */}
      <aside
        id="drawer"
        className={`drawer${drawerOpen ? " open" : ""}`}
        aria-hidden={drawerOpen ? "false" : "true"}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDrawerOpen(false);
        }}
      >
        <div className="drawer-header">
          <div className="drawer-title">Shopping Cart</div>
          <button className="close-x" id="closeCart" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        <div id="cartList" className="drawer-list">
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b" }}>
              Your cart is empty.
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.img} alt={item.title} />
                <div style={{ flex: 1 }}>
                  <div className="ci-title">{item.title}</div>
                  <div className="qty-wrap">
                    <button className="qty-btn dec" onClick={() => decItem(item.id)} aria-label="Decrease quantity">−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn inc" onClick={() => incItem(item.id)} aria-label="Increase quantity">+</button>
                    <button className="remove remove-all" onClick={() => removeAll(item.id)} title="Remove all">✕</button>
                  </div>
                </div>
                <div className="ci-price">{money(item.price * item.qty)}</div>
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer">
          <div className="total-row">
            <span>Total:</span>
            <span id="cartTotal">{money(cartTotal)}</span>
          </div>
          <button
            className="checkout"
            onClick={() => {
              // adjust this route if you have a real checkout page
              navigate("/checkout");
            }}
          >
            Checkout
          </button>
        </div>
      </aside>

      {/* Modal (More) */}
      {modalProduct && (
        <div
          id="modal"
          className="modal open"
          aria-hidden="false"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-img">
              <img id="mImg" src={modalProduct.img} alt={modalProduct.title} />
            </div>
            <div className="modal-body">
              <h3 id="mTitle">{modalProduct.title}</h3>
              <div className="modal-rating" aria-live="polite">
                <span
                  id="mStars"
                  className="stars"
                  style={{ ["--rating"]: (Math.round(modalProduct.rating * 10) / 10).toFixed(1) }}
                  aria-hidden="true"
                />
                <span id="mRatingText" className="rating-num">
                  {(Math.round(modalProduct.rating * 10) / 10).toFixed(1)} • {modalProduct.reviews.toLocaleString()} reviews
                </span>
              </div>

              <div className="modal-price-row">
                <div id="mPriceNow" className="modal-price-now">
                  {money(finalPrice(modalProduct))}
                </div>
                {modalProduct.discountPct > 0 && (
                  <div id="mPriceOld" className="modal-price-old">
                    {money(modalProduct.price)}
                  </div>
                )}
              </div>

              <p id="mDesc" className="modal-desc">{modalProduct.desc}</p>

              <div className="specs" id="mSpecs">
                {Object.entries(modalProduct.specs || {}).map(([k, v]) => (
                  <div className="spec" key={k}>
                    {k}: {v}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  id="mAdd"
                  className="btn btn-primary"
                  onClick={() => {
                    addToCart(modalProduct.id);
                    closeModal();
                  }}
                >
                  Add to Cart
                </button>
                <button id="mClose" className="modal-close" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clutches;
