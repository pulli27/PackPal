// src/Components/Header/Header.js
import React from "react";
import {
  FaHome, FaLayerGroup, FaPuzzlePiece, FaTags, FaGift,
  FaChevronDown, FaUser, FaUserPlus, FaShoppingCart,
} from "react-icons/fa";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../../auth/AuthContext"; // << add

export default function Header({
  cartCount = 0,
  onCartClick = () => {},
  onDropdown = () => {},
}) {
  const navigate = useNavigate();
  const { isAuthed, user, logout } = useAuth(); // << read auth

  return (
    <div className="ppx-header">
      <header className="header" id="header">
        <div className="header-content">
          <div className="header-top">
            {/* Brand */}
            <Link to="/" className="logo" aria-label="PackPal Home">
              <img src="/new logo.png" alt="PackPal" className="logo-img" />
              <div className="logo-text">PackPal</div>
            </Link>

            {/* Nav */}
            <nav className="nav" aria-label="Primary">
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/home" className="nav-link"><FaHome /> Home</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="" className="nav-link">
                    <FaLayerGroup /> Collection <FaChevronDown style={{ fontSize: "0.9rem", marginLeft: 6 }} />
                  </NavLink>
                  <div className="dropdown" role="menu" aria-label="Collections">
                    <NavLink to="/kidsbag" className="dropdown-item" onClick={() => onDropdown("Kids Bag")}>
                      <div className="dropdown-title">Kids Bag</div>
                      <div className="dropdown-desc">Fun and colorful bags for children</div>
                    </NavLink>
                    <NavLink to="/totebag" className="dropdown-item" onClick={() => onDropdown("Tote Bag")}>
                      <div className="dropdown-title">Tote Bag</div>
                      <div className="dropdown-desc">Spacious and versatile everyday bags</div>
                    </NavLink>
                    <NavLink to="/handbag" className="dropdown-item" onClick={() => onDropdown("Handbag")}>
                      <div className="dropdown-title">Handbag</div>
                      <div className="dropdown-desc">Elegant bags for special occasions</div>
                    </NavLink>
                    <NavLink to="/clutches" className="dropdown-item" onClick={() => onDropdown("Clutch")}>
                      <div className="dropdown-title">Clutch</div>
                      <div className="dropdown-desc">Compact and stylish evening bags</div>
                    </NavLink>
                  </div>
                </li>
                <li className="nav-item"><NavLink to="/accessories" className="nav-link"><FaPuzzlePiece /> Accessories</NavLink></li>
                <li className="nav-item"><NavLink to="/sale" className="nav-link"><FaTags /> Sales</NavLink></li>
                <li className="nav-item"><NavLink to="/aboutpage" className="nav-link"><FaGift /> About Us</NavLink></li>
              </ul>
            </nav>

            {/* Actions */}
            <div className="header-actions">
              {!isAuthed ? (
                <>
                  <button className="btn" onClick={() => navigate("/login")}>
                    <FaUser /><span>Login</span>
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate("/createaccount")}>
                    <FaUserPlus /><span>Register</span>
                  </button>
                </>
              ) : (
                <>
                  {/* optional user chip */}
                  <div className="user-chip">
                    <span className="user-dot" />
                    {user?.name || user?.email || "Logged in"}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => { logout(); navigate("/"); }}
                    title="Sign out"
                  >
                    Logout
                  </button>
                </>
              )}
              <button className="cart-btn" onClick={onCartClick} aria-label="Open cart">
                <FaShoppingCart />
                <div className="cart-badge" aria-live="polite">{cartCount}</div>
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
