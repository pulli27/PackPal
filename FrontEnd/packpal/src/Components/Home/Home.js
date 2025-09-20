// D:\Git_project2\PackPal\FrontEnd\packpal\src\Components\Home\Home.js
import React, { useRef, useState } from "react";
import "./Home.css";

import {
  FaShoppingBag, FaSearch, FaUser, FaUserPlus, FaShoppingCart, FaHome, FaLayerGroup,
  FaPuzzlePiece, FaTags, FaGift, FaPlay, FaLaptop, FaChild, FaWallet,
  FaBriefcase, FaSuitcase, FaChevronDown, FaFacebookF, FaInstagram, FaTwitter
} from "react-icons/fa";
import { FaBagShopping } from "react-icons/fa6"; // modern bag icon

export default function Home() {
  const headerRef = useRef(null);
  const [cartItems, setCartItems] = useState([]);
  const [notice, setNotice] = useState(null);
  const [inlinePlaying, setInlinePlaying] = useState(false);

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
      {/* Transparent header overlays hero and scrolls away */}
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

          {/* Straight, centered nav row */}
          <nav className="nav">
            <ul className="nav-list">
              <li className="nav-item">
                <a href="#home" className="nav-link" onClick={(e) => smoothTo(e, "#home")}><FaHome /> Home</a>
              </li>

              <li className="nav-item" style={{ position: "relative" }}>
                <a href="#collection" className="nav-link" onClick={(e) => e.preventDefault()}>
                  <FaLayerGroup />
                  Collection
                  <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
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
                <a href="#accessories" className="nav-link" onClick={(e) => smoothTo(e, "#accessories")}>
                  <FaPuzzlePiece /> Accessories
                </a>
              </li>
              <li className="nav-item">
                <a href="#sales" className="nav-link" onClick={(e) => smoothTo(e, "#sales")}>
                  <FaTags /> Sales
                </a>
              </li>
              <li className="nav-item">
                <a href="#offers" className="nav-link" onClick={(e) => smoothTo(e, "#offers")}>
                  <FaGift /> Offers
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* HERO with BACKGROUND VIDEO */}
        <section className="hero" id="home">
          {/* Place file at public/Videos/packpal-intro.mp4 */}
          <video className="hero-video" autoPlay muted loop playsInline>
            <source src="/Videos/packpal-intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

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
              <a href="#offers" className="btn" onClick={(e) => smoothTo(e, "#offers")}>
                <FaPlay /> Watch Our Story
              </a>
            </div>

            {/* Search below buttons */}
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

        {/* Video Section */}
        <section className="section video-section" id="video">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Video</h2>
              <p className="section-subtitle">
                See how PackPal revolutionizes the way you carry your essentials
              </p>
            </div>

            <div className="video-wrapper">
              {!inlinePlaying ? (
                <div
                  className="video-player"
                  onClick={() => setInlinePlaying(true)}
                  role="button"
                  aria-label="Play showcase video"
                >
                  <div className="play-button"><FaPlay /></div>
                </div>
              ) : (
                <video width="100%" height="100%" controls autoPlay style={{ display: "block" }}>
                  <source src="https://samplelib.com/lib/preview/mp4/sample-960x540.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="section" id="new-arrivals">
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
                <div className="product-image"><FaLaptop /></div>
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
                <div className="product-image"><FaChild /></div>
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
                <div className="product-image"><FaBagShopping /></div>
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

              <div
                className="product-card loading"
                data-product="evening-clutch"
                onClick={() => showNotification("Viewing Premium Evening Clutch details...")}
              >
                <div className="product-image"><FaWallet /></div>
                <h3 className="product-title">Premium Evening Clutch</h3>
                <div className="product-price">$129.99</div>
                <p className="product-description">
                  Sophisticated clutch with metallic finish and detachable chain.
                </p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Premium Evening Clutch", 129.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Best Selling */}
        <section className="section" id="best-selling" style={{ background: "rgba(0,0,0,.2)" }}>
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

              <div
                className="product-card loading"
                data-product="crossbody-bag"
                onClick={() => showNotification("Viewing Urban Crossbody details...")}
              >
                <div className="product-image"><FaBagShopping /></div>
                <h3 className="product-title">Urban Crossbody</h3>
                <div className="product-price">$119.99</div>
                <p className="product-description">Versatile crossbody with secure pockets.</p>
                <button
                  className="product-btn"
                  onClick={(e) => { e.stopPropagation(); addToCart("Urban Crossbody", 119.99); }}
                >
                  <FaBagShopping /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="ultra-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>PackPal</h3>
            <p>Smart Bags for Smart People.</p>
            <p className="footer-copy">© 2025 PackPal. All rights reserved.</p>
          </div>

          <div className="footer-links">
            <a href="#collection" onClick={(e)=>smoothTo(e,"#collection")}>Collections</a>
            <a href="#sales" onClick={(e)=>smoothTo(e,"#sales")}>Sales</a>
            <a href="#offers" onClick={(e)=>smoothTo(e,"#offers")}>Offers</a>
            <a href="#accessories" onClick={(e)=>smoothTo(e,"#accessories")}>Accessories</a>
          </div>

          <div className="footer-socials">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
          </div>
        </div>
      </footer>

      {/* Notification toast */}
      {notice && <div className="notification">{notice}</div>}
    </>
  );
}
