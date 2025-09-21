import React from "react";
import {
  FaShoppingBag,
  FaHome,
  FaLayerGroup,
  FaPuzzlePiece,
  FaTags,
  FaGift,
  FaChevronDown,
  FaUser,
  FaUserPlus,
  FaShoppingCart,
} from "react-icons/fa";
import "./Header.css"
/**
 * Header (extracted from Home)
 *
 * Props:
 * - cartCount: number
 * - onCartClick: () => void
 * - onLogin: () => void
 * - onRegister: () => void
 * - onDropdown: (title: string) => void   // optional
 */
export default function Header({
  cartCount = 0,
  onCartClick = () => {},
  onLogin = () => {},
  onRegister = () => {},
  onDropdown = () => {},
}) {
  const smoothTo = (e, selector) => {
    e.preventDefault();
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dropdownClick = (title) => () => onDropdown(title);

  return (
    <header className="header" id="header">
      <div className="header-content">
        {/* Top bar */}
        <div className="header-top">
          <a href="/" className="logo" onClick={(e) => e.preventDefault()}>
            <div className="logo-icon">
              <FaShoppingBag />
            </div>
            <div className="logo-text">PackPal</div>
          </a>

          <div className="header-actions">
            <a href="/" className="btn" onClick={(e) => { e.preventDefault(); onLogin(); }}>
              <FaUser />
              <span>Login</span>
            </a>
            <a
              href="/"
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                onRegister();
              }}
            >
              <FaUserPlus />
              <span>Register</span>
            </a>
            <button className="cart-btn" onClick={onCartClick} style={{ position: "relative" }}>
              <FaShoppingCart />
              <div className="cart-badge" id="cartBadge">
                {cartCount}
              </div>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <a href="#home" className="nav-link" onClick={(e) => smoothTo(e, "#home")}>
                <FaHome /> Home
              </a>
            </li>

            <li className="nav-item" style={{ position: "relative" }}>
              <a href="#collection" className="nav-link" onClick={(e) => e.preventDefault()}>
                <FaLayerGroup /> Collection <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
              </a>
              <div className="dropdown">
                <div className="dropdown-item" onClick={dropdownClick("Kids Bag")}>
                  <div className="dropdown-title">Kids Bag</div>
                  <div className="dropdown-desc">Fun and colorful bags for children</div>
                </div>
                <div className="dropdown-item" onClick={dropdownClick("School Bag/Laptop Bag")}>
                  <div className="dropdown-title">School Bag/Laptop Bag</div>
                  <div className="dropdown-desc">Durable bags for students and professionals</div>
                </div>
                <div className="dropdown-item" onClick={dropdownClick("Tote Bag")}>
                  <div className="dropdown-title">Tote Bag</div>
                  <div className="dropdown-desc">Spacious and versatile everyday bags</div>
                </div>
                <div className="dropdown-item" onClick={dropdownClick("Handbag")}>
                  <div className="dropdown-title">Handbag</div>
                  <div className="dropdown-desc">Elegant bags for special occasions</div>
                </div>
                <div className="dropdown-item" onClick={dropdownClick("Clutch")}>
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
  );
}
