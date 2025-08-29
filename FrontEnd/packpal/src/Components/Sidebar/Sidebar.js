import React, { useEffect, useRef, useState } from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";



/**
 * Sidebar
 * - Mobile close on outside click
 * - Active link highlight
 * - LocalStorage remembers last page
 */
export default function Sidebar({ initialActive = "reports", onNavigate, onLogout }) {
  const [active, setActive] = useState(initialActive);
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Restore last page
  useEffect(() => {
    try {
      const last = localStorage.getItem("financehub:lastPage");
      if (last) setActive(last);
    } catch {}
  }, []);

  // Close on outside click (mobile)
  useEffect(() => {
    const handleDocClick = (e) => {
      if (window.innerWidth <= 768) {
        const btn = document.querySelector(".mobile-menu");
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

  const titleMap = {
    dashboard: "Dashboard",
    salary: "Salary Calculator",
    epf: "EPF/ETF Management",
    reports: "Financial Reports",
    revenue: "Revenue & Sales",
    balance: "Balance Sheet",
    settings: "Settings",
  };

  const navigate = (key) => {
    setActive(key);
    try {
      localStorage.setItem("financehub:lastPage", key);
    } catch {}
    if (window.showNotification) {
      window.showNotification(`Opening ${titleMap[key] || "Feature"}...`, "info");
    }
    onNavigate?.(key);
  };

  const logout = () => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm("Are you sure you want to logout?")) return;
    if (window.showNotification) window.showNotification("Logging out...", "info");
    setTimeout(() => {
      alert("You have been logged out successfully!");
      onLogout?.();
    }, 800);
  };

  return (
    <aside
      ref={sidebarRef}
      id="sidebar"
      className={`sidebar ${open ? "active" : ""}`}
    >
      <div className="sidebar-header">
        <h2>💰 PackPal</h2>
        <p>Product Dashboard Portal</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/maindashboard"
          className={`nav-item ${active === "dashboard" ? "active" : ""}`}
          onClick={(e) => { e.preventDefault();
            navigate("dashboard");}}
        >
          <i className="fas fa-chart-line" /> Dashboard
        </NavLink>

        <NavLink
          to="/sewing"
          className={`nav-item ${active === "sewing" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("sewing");
          }}
        >
          <i className="fas fa-cut" /> Sewing Instruction
        </NavLink>

        <NavLink
          to="/employee"
          className={`nav-item ${active === "employee" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("employee");
          }}
        >
          <i className="fas fa-shield-alt" /> Quality Check
        </NavLink>

        <NavLink
          to="/reports"
          className={`nav-item ${active === "reports" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("reports");
          }}
        >
          <i className="fas fa-boxes" /> Reports
        </NavLink>

        <NavLink
          to="/quality"
          className={`nav-item ${active === "quality" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("quality");
          }}
        >
          <i className="fas fa-users" /> Employee
        </NavLink>

       

        <div className="nav-divider" />

        <a
          href="#"
          className={`nav-item ${active === "settings" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("settings");
          }}
        >
          <i className="fas fa-cog" /> Settings
        </a>
      </nav>

      <div className="logout-section">
        <button className="logout-btn" type="button" onClick={logout}>
          <i className="fas fa-sign-out-alt" /> Logout
        </button>
      </div>
    </aside>
  );
}
