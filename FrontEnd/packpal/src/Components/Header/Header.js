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
    <header className="header" id="header">
      <div className="header-content">
        {/* Top */}
        <div className="header-top">
          <Link to="/" className="logo">
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
            <button className="cart-btn" onClick={onCartClick} style={{ position: "relative" }}>
              <FaShoppingCart />
              <div className="cart-badge" id="cartBadge">{cartCount}</div>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/" className="nav-link">
                <FaHome /> Home
              </NavLink>
            </li>

            <li className="nav-item" style={{ position: "relative" }}>
              <NavLink to="/collection" className="nav-link">
                <FaLayerGroup /> Collection <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
              </NavLink>
              <div className="dropdown">
                <div className="dropdown-item" onClick={goCategory("kids", "Kids Bag")}>
                  <div className="dropdown-title">Kids Bag</div>
                  <div className="dropdown-desc">Fun and colorful bags for children</div>
                </div>
                <div className="dropdown-item" onClick={goCategory("school-laptop", "School Bag/Laptop Bag")}>
                  <div className="dropdown-title">School Bag/Laptop Bag</div>
                  <div className="dropdown-desc">Durable bags for students and professionals</div>
                </div>
                <div className="dropdown-item" onClick={goCategory("tote", "Tote Bag")}>
                  <div className="dropdown-title">Tote Bag</div>
                  <div className="dropdown-desc">Spacious and versatile everyday bags</div>
                </div>
                <div className="dropdown-item" onClick={goCategory("handbag", "Handbag")}>
                  <div className="dropdown-title">Handbag</div>
                  <div className="dropdown-desc">Elegant bags for special occasions</div>
                </div>
                <div className="dropdown-item" onClick={goCategory("clutch", "Clutch")}>
                  <div className="dropdown-title">Clutch</div>
                  <div className="dropdown-desc">Compact and stylish evening bags</div>
                </div>
              </div>
            </li>

            <li className="nav-item">
              <NavLink to="/accessories" className="nav-link">
                <FaPuzzlePiece /> Accessories
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/sales" className="nav-link">
                <FaTags /> Sales
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/offers" className="nav-link">
                <FaGift /> Offers
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
