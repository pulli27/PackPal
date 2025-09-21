import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebarhiru.css";

export default function Sidebarhiru() {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close on outside click (mobile)
  useEffect(() => {
    const handleDocClick = (e) => {
      if (window.innerWidth <= 1024) {
        const btn = document.querySelector(".sbx .mobile-menu");
        if (
          sidebarRef.current &&
          !sidebarRef.current.contains(e.target) &&
          (!btn || !btn.contains(e.target))
        ) {
          setOpen(false);
        }
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // Close on ESC (mobile)
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="sbx">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="mobile-menu"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <aside
        ref={sidebarRef}
        className={`sidebar ${open ? "active" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-header">
          <h2>🛍️ PackPal</h2>
          <p>Product Dashboard Portal</p>
        </div>

        <nav className="sidebar-nav" onClick={() => setOpen(false)}>
          <NavLink
            to="/hirudashboard"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-chart-line" /> Dashboard
          </NavLink>

          <NavLink
            to="/sewing"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-cut" /> Sewing Instruction
          </NavLink>

          <NavLink
            to="/quality"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-shield" /> Quality Check
          </NavLink>

          <NavLink
            to="/employee"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-users" /> Employee
          </NavLink>

          <NavLink
            to="/reportshiru"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-boxes" /> Reports
          </NavLink>

          <div className="nav-divider" />

          <NavLink
            to="/settinghiru"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="fas fa-cog" /> Setting
          </NavLink>
        </nav>

        <div className="logout-section">
          <button
            className="logout-btn"
            type="button"
            onClick={() => alert("Logged out")}
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>
    </div>
  );
}
