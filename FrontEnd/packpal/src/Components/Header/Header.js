// src/components/Header/Header.js
import React from "react";
import {
  FaShoppingBag, FaHome, FaLayerGroup, FaPuzzlePiece, FaTags, FaGift,
  FaChevronDown, FaUser, FaUserPlus, FaShoppingCart,
} from "react-icons/fa";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header({
  cartCount = 0,
  onCartClick = () => {},
  onLogin = () => {},
  onRegister = () => {},
  onDropdown = () => {},
}) {
  const navigate = useNavigate();

  const goCategory = (slug, title) => () => {
    onDropdown(title);
    navigate(`/collection/${slug}`);
  };

  return (
    <div className="ppx-header">{/* UNIQUE SCOPE WRAPPER */}
      <header className="header" id="header">
        <div className="header-content">
          {/* Top bar */}
          <div className="header-top">
            <Link to="/" className="logo" aria-label="PackPal Home">
              <div className="logo-icon"><FaShoppingBag /></div>
              <div className="logo-text">PackPal</div>
            </Link>

            <div className="header-actions">
              <button className="btn" onClick={onLogin}>
                <FaUser /><span>Login</span>
              </button>
              <button className="btn btn-primary" onClick={onRegister}>
                <FaUserPlus /><span>Register</span>
              </button>
              <button className="cart-btn" onClick={onCartClick} style={{ position: "relative" }} aria-label="Open cart">
                <FaShoppingCart />
                <div className="cart-badge" id="cartBadge" aria-live="polite">{cartCount}</div>
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="nav" aria-label="Primary">
            <ul className="nav-list">
              <li className="nav-item">
                <NavLink to="/home" className="nav-link">
                  <FaHome /> Home
                </NavLink>
              </li>

              <li className="nav-item" style={{ position: "relative" }}>
                <NavLink to="/collection" className="nav-link">
                  <FaLayerGroup /> Collection <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
                </NavLink>
                <div className="dropdown" role="menu" aria-label="Collections">
                <NavLink
                  to="/kidsbag"
                  className="dropdown-item"
                  onClick={() => onDropdown("Kids Bag")}
                >
                  <div className="dropdown-title">Kids Bag</div>
                  <div className="dropdown-desc">Fun and colorful bags for children</div>
                </NavLink>

                

                <NavLink
                  to="/totebag"
                  className="dropdown-item"
                  onClick={() => onDropdown("Tote Bag")}
                >
                  <div className="dropdown-title">Tote Bag</div>
                  <div className="dropdown-desc">Spacious and versatile everyday bags</div>
                </NavLink>

                <NavLink
                  to="/handbag"
                  className="dropdown-item"
                  onClick={() => onDropdown("Handbag")}
                >
                  <div className="dropdown-title">Handbag</div>
                  <div className="dropdown-desc">Elegant bags for special occasions</div>
                </NavLink>

                <NavLink
                  to="/clutches"
                  className="dropdown-item"
                  onClick={() => onDropdown("Clutch")}
                >
                  <div className="dropdown-title">Clutch</div>
                  <div className="dropdown-desc">Compact and stylish evening bags</div>
                </NavLink>
              </div>

              </li>

              <li className="nav-item">
                <NavLink to="/accessories" className="nav-link">
                  <FaPuzzlePiece /> Accessories
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/sale" className="nav-link">
                  <FaTags /> Sales
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/aboutpage" className="nav-link">
                  <FaGift /> About Us
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </div>
  );
}
