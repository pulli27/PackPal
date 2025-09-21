import React, { useEffect, useRef, useState } from "react";
import "./Home.css";
import Footer from "../Footer/Footer";              // ← ADD THIS LINE

import {
  FaShoppingBag, FaSearch, FaUser, FaUserPlus, FaShoppingCart, FaHome, FaLayerGroup,
  FaPuzzlePiece, FaTags, FaGift, FaPlay, FaLaptop, FaChild, FaWallet,
  FaBriefcase, FaSuitcase, FaChevronDown
} from "react-icons/fa";
import { FaBagShopping, FaVolumeHigh, FaVolumeXmark, FaFacebookF, FaInstagram, FaTwitter, FaPlus, FaMinus } from "react-icons/fa6"; /* CHANGED: moved FB/IG/Twitter to fa6 import to avoid dupe */

export default function Home() {
  const headerRef = useRef(null);
  const videoRef   = useRef(null);

  const [cartItems, setCartItems] = useState([]);
  const [notice, setNotice]       = useState(null);

  // hero video sound
  const [muted, setMuted]     = useState(true);
  const [volume, setVolume]   = useState(0.4);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted  = muted;
    videoRef.current.volume = volume;
  }, [muted, volume]);

  // ratings numbers
  const [happy, setHappy]         = useState(0);
  const [designs, setDesigns]     = useState(0);
  const [satisfaction, setSat]    = useState(0);

  useEffect(() => {
    const animate = (target, setter, isPercent = false, duration = 2000) => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const val = target * p;
        setter(isPercent ? +val.toFixed(1) : Math.floor(val));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    animate(25855, setHappy);
    animate(1892, setDesigns);
    animate(98.7,  setSat, true);

    const bump = setInterval(() => setHappy((v) => v + Math.floor(Math.random() * 3)), 10000);
    return () => clearInterval(bump);
  }, []);

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2400);
  };

  const addToCart = (name, price) => {
    setCartItems((prev) => [...prev, { name, price }]);
    showNotification(`Added ${name} to cart!`);
  };

  const cartClick = () => {
    if (!cartItems.length) return showNotification("Your cart is empty.");
    const total = cartItems.reduce((s, i) => s + i.price, 0).toFixed(2);
    showNotification(`Cart: ${cartItems.length} items — Total $${total}`);
  };

  const smoothTo = (e, selector) => {
    e.preventDefault();
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAuth = (type) => (e) => {
    e.preventDefault();
    showNotification(type === "login" ? "Login portal opening..." : "Registration form opening...");
  };

  const onDropdownClick = (title) => () => showNotification(`Browsing ${title}`);

  return (
    <>
      {/* HEADER */}
      <header className="header" id="header" ref={headerRef}>
        <div className="header-content">
          <div className="header-top">
            <a href="/" className="logo" onClick={(e) => e.preventDefault()}>
              <div className="logo-icon"><FaShoppingBag /></div>
              <div className="logo-text">PackPal</div>
            </a>

            <div className="header-actions">
              <a href="/" className="btn" onClick={handleAuth("login")}><FaUser /><span>Login</span></a>
              <a href="/" className="btn btn-primary" onClick={handleAuth("register")}><FaUserPlus /><span>Register</span></a>
              <button className="cart-btn" onClick={cartClick} style={{ position: "relative" }}>
                <FaShoppingCart />
                <div className="cart-badge" id="cartBadge">{cartItems.length}</div>
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="nav">
            <ul className="nav-list">
              <li className="nav-item">
                <a href="#home" className="nav-link" onClick={(e) => smoothTo(e, "#home")}><FaHome /> Home</a>
              </li>

              <li className="nav-item" style={{ position: "relative" }}>
                <a href="#collection" className="nav-link" onClick={(e) => e.preventDefault()}>
                  <FaLayerGroup /> Collection <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
                </a>
                <div className="dropdown">
                  <div className="dropdown-item" onClick={onDropdownClick("Kids Bag")}>
                    <div className="dropdown-title">Kids Bag</div>
                    <div className="dropdown-desc">Fun and colorful bags for children</div>
                  </div>
                  <div className="dropdown-item" onClick={onDropdownClick("School Bag/Laptop Bag")}>
                    <div className="dropdown-title">School Bag/Laptop Bag</div>
                    <div className="dropdown-desc">Durable bags for students and professionals</div>
                  </div>
                  <div className="dropdown-item" onClick={onDropdownClick("Tote Bag")}>
                    <div className="dropdown-title">Tote Bag</div>
                    <div className="dropdown-desc">Spacious and versatile everyday bags</div>
                  </div>
                  <div className="dropdown-item" onClick={onDropdownClick("Handbag")}>
                    <div className="dropdown-title">Handbag</div>
                    <div className="dropdown-desc">Elegant bags for special occasions</div>
                  </div>
                  <div className="dropdown-item" onClick={onDropdownClick("Clutch")}>
                    <div className="dropdown-title">Clutch</div>
                    <div className="dropdown-desc">Compact and stylish evening bags</div>
                  </div>
                </div>
              </li>

              <li className="nav-item">
                <a href="#accessories" className="nav-link" onClick={(e) => smoothTo(e, "#accessories")}><FaPuzzlePiece /> Accessories</a>
              </li>
              <li className="nav-item">
                <a href="#sales" className="nav-link" onClick={(e) => smoothTo(e, "#sales")}><FaTags /> Sales</a>
              </li>
              <li className="nav-item">
                <a href="#offers" className="nav-link" onClick={(e) => smoothTo(e, "#offers")}><FaGift /> Offers</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        {/* HERO with background video */}
        <section className="hero" id="home">
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted={muted}
            loop
            playsInline
          >
            <source src="/images/homepage_videoooo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Sound control */}
          <div className="volume-widget" role="group" aria-label="Video sound">
            <button
              className="vol-toggle"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute video" : "Mute video"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <FaVolumeXmark /> : <FaVolumeHigh />}
              <span className="vol-label">Sound</span>
            </button>

            <div className="vol-steps">
              <button className="vol-btn" onClick={() => { setMuted(false); setVolume(v => Math.max(0, +(v - 0.1).toFixed(2))); }} aria-label="Decrease volume" title="Volume -">
                <FaMinus />
              </button>
              <div className="vol-meter"><div className="vol-fill" style={{ width: `${Math.round(volume * 100)}%` }} /></div>
              <button className="vol-btn" onClick={() => { setMuted(false); setVolume(v => Math.min(1, +(v + 0.1).toFixed(2))); }} aria-label="Increase volume" title="Volume +">
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">Smart Bags for Smart People</h1>
            <p className="hero-subtitle">
              Discover PackPal's innovative collection of bags designed for the modern lifestyle with cutting-edge
              technology and premium materials
            </p>
            <div className="hero-cta">
              <a href="#collection" className="btn btn-primary" onClick={(e) => smoothTo(e, "#collection")}>
                <FaBagShopping /> Explore Collection
              </a>
              <a href="#our-journey" className="btn" onClick={(e) => smoothTo(e, "#our-journey")}>
                <FaPlay /> Our Journey
              </a>
            </div>

            {/* Search */}
            <div className="hero-search">
              <form
                id="searchFormHero"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = e.currentTarget.querySelector("#searchInputHero").value.trim();
                  if (q) showNotification(`Searching for: "${q}"`);
                }}
              >
                <input
                  type="text"
                  className="search-bar search-bar-hero"
                  id="searchInputHero"
                  placeholder="Search for bags..."
                />
                <button className="search-btn search-btn-hero" type="submit">
                  <FaSearch />
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ===== OUR JOURNEY ===== */}
        <section className="section our-journey" id="our-journey">
          <div className="journey-container">
            <div className="journey-text">
              <h2 className="journey-title">Our Journey</h2>
              <p>
                What began as a passion project in a small studio has evolved into a global movement.
                PackPal was born from the belief that exceptional craftsmanship should meet
                cutting-edge design.
              </p>
              <p>
                Every bag tells a story of meticulous attention to detail, premium materials
                sourced from the finest suppliers worldwide, and an unwavering commitment to sustainability.
              </p>
              <p>
                Today, we're not just creating bags – we're crafting experiences that empower
                individuals to carry their dreams with confidence and style.
              </p>
            </div>
            <div className="journey-image">
              <img src="/images/journey-bag.jpg" alt="PackPal bag on pedestal" />
            </div>
          </div>
        </section>

        {/* ===== New Arrivals (3) ===== */}
        <section className="section soft-bg" id="new-arrivals">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Latest designs that blend innovation with style</p>
            </div>

            <div className="products-grid">
              <div
                className="product-card loading"
                data-product="smart-backpack"
                onClick={() => showNotification("Viewing Smart Tech Backpack details...")}
              >
                <div className="product-image"><img src="/images/smart_bag.png" alt="Smart Tech Backpack" /></div>
                <h3 className="product-title">Smart Tech Backpack</h3>
                <div className="product-price">$199.99</div>
                <p className="product-description">
                  Revolutionary backpack with built-in USB charging and anti-theft features.
                </p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Smart Tech Backpack", 199.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>

              <div
                className="product-card loading"
                data-product="kids-adventure"
                onClick={() => showNotification("Viewing Kids Adventure Pack details...")}
              >
                <div className="product-image"><img src="/images/kids.png" alt="Kids Adventure Pack" /></div>
                <h3 className="product-title">Kids Adventure Pack</h3>
                <div className="product-price">$79.99</div>
                <p className="product-description">Colorful and durable backpack designed for young explorers.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Kids Adventure Pack", 79.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>

              <div
                className="product-card loading"
                data-product="designer-tote"
                onClick={() => showNotification("Viewing Designer Tote Bag details...")}
              >
                <div className="product-image"><img src="/images/tote.png" alt="Designer Tote Bag" /></div>
                <h3 className="product-title">Designer Tote Bag</h3>
                <div className="product-price">$149.99</div>
                <p className="product-description">Spacious tote bag crafted from premium materials.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Designer Tote Bag", 149.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Best Selling (3) ===== */}
        <section className="section soft-bg" id="best-selling">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Best Selling Products</h2>
              <p className="section-subtitle">Customer favorites that have earned their reputation</p>
            </div>

            <div className="products-grid">
              <div
                className="product-card loading"
                data-product="signature-handbag"
                onClick={() => showNotification("Viewing Signature Handbag details...")}
              >
                <div className="product-image"><FaShoppingBag /></div>
                <h3 className="product-title">Signature Handbag</h3>
                <div className="product-price">$299.99</div>
                <p className="product-description">Premium leather construction and timeless design.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Signature Handbag", 299.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>

              <div
                className="product-card loading"
                data-product="professional-briefcase"
                onClick={() => showNotification("Viewing Professional Briefcase details...")}
              >
                <div className="product-image"><FaBriefcase /></div>
                <h3 className="product-title">Professional Briefcase</h3>
                <div className="product-price">$249.99</div>
                <p className="product-description">Executive briefcase with multiple compartments.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Professional Briefcase", 249.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>

              <div
                className="product-card loading"
                data-product="travel-duffel"
                onClick={() => showNotification("Viewing Travel Duffel details...")}
              >
                <div className="product-image"><FaSuitcase /></div>
                <h3 className="product-title">Travel Duffel</h3>
                <div className="product-price">$189.99</div>
                <p className="product-description">Spacious duffel with weather-resistant coating.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Travel Duffel", 189.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Ratings Banner (ABOVE FOOTER) ===== */}
        <section className="rating-banner" id="ratings">
          <div className="rating-container">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon happy-icon" />
                <div className="stat-number">{happy.toLocaleString()}</div>
                <div className="stat-label">Happy Customers</div>
                <div className="stat-description">
                  Satisfied clients worldwide who trust our exceptional service and continue to choose us
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon design-icon" />
                <div className="stat-number">{designs.toLocaleString()}</div>
                <div className="stat-label">Unique Designs</div>
                <div className="stat-description">
                  Original, creative solutions crafted with precision and tailored to each client's vision
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon satisfaction-icon" />
                <div className="stat-number">{satisfaction.toFixed(1)}%</div>
                <div className="stat-label">Satisfaction Rate</div>
                <div className="stat-description">
                  Outstanding customer satisfaction score reflecting our dedication to excellence
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (component, at the very end) */}
      <Footer />                                   {/* ← ADD THIS LINE */}

      {/* Toast */}
      {notice && <div className="notification">{notice}</div>}
    </>
  );
}
