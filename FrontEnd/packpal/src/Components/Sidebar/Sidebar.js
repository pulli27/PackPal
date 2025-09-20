// src/Components/Sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({
  initialActive = "report",
  onNavigate,
  onLogout,
}) {
  const [active, setActive] = useState(initialActive);
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();

  // Restore last page once
  useEffect(() => {
    try {
      const last = localStorage.getItem("financehub:lastPage");
      if (last) setActive(last);
    } catch {}
  }, []);

  // Keep active state in sync with route changes
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const map = {
      "/maindashboard": "dashboard",
      "/iteminventory": "itemInventory",
      "/productinventory": "productInventory",
      "/purchase": "purchase",
      "/supplier": "suppliers",
    
      "/settings": "settings",
      
      "/orders": "orders",
      "/login": "login",
      "/usermanagement": "usermanagement",
    };
    const key = map[path];
    if (key) setActive(key);
  }, [location.pathname]);

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

  // Close with ESC on mobile
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && window.innerWidth <= 768) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const titleMap = {
    dashboard: "Dashboard",
    itemInventory: "Item Inventory",
    productInventory: "Product Inventory",
    purchase: "Purchase Items",
    suppliers: "Suppliers",
    
    settings: "Settings",
    orders: "Orders",
    login: "Login",
    usermanagement: "User Management",
  };

  const handleNavigate = (key) => {
    setActive(key);
    try {
      localStorage.setItem("financehub:lastPage", key);
    } catch {}
    if (window.showNotification) {
      window.showNotification(`Opening ${titleMap[key] || "Feature"}...`, "info");
    }
    onNavigate?.(key);
    if (window.innerWidth <= 768) setOpen(false);
  };

  const logout = () => {
    // eslint-disable-next-line no-restricted-globals
    const ok = window.confirm("Are you sure you want to logout?");
    if (!ok) return;
    if (window.showNotification) window.showNotification("Logging out...", "info");
    setTimeout(() => {
      alert("You have been logged out successfully!");
      onLogout?.();
    }, 800);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mobile-menu"
        aria-label="Toggle menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-bars" />
      </button>

      <aside
        ref={sidebarRef}
        id="sidebar"
        className={`sidebar ${open ? "active" : ""}`}
        aria-label="Sidebar"
      >
        <div className="sidebar-header">
          <h2>📦 PackPal</h2>
          <p>User Management System</p>
        </div>

        <nav className="sidebar-nav" role="navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${isActive || active === "dashboard" ? "active" : ""}`
            }
            onClick={() => handleNavigate("dashboard")}
          >
            <i className="fa-solid fa-chart-line" /> <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/usermanagement"
            className={({ isActive }) =>
              `nav-item ${isActive || active === "usermanagement" ? "active" : ""}`
            }
            onClick={() => handleNavigate("usermanagement")}
          >
            <i className="fa-solid fa-users-gear" /> <span>User management</span>
          </NavLink>

          <NavLink
            to="/order"
            className={({ isActive }) =>
              `nav-item ${isActive || active === "order" ? "active" : ""}`
            }
            onClick={() => handleNavigate("order")}
          >
            <i className="fa-solid fa-box-open" /> <span>Orders</span>
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `nav-item ${isActive || active === "login" ? "active" : ""}`
            }
            onClick={() => handleNavigate("login")}
          >
            <i className="fa-solid fa-right-to-bracket" /> <span>Login</span>
          </NavLink>

         
       

         
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive || active === "settings" ? "active" : ""}`
            }
            onClick={() => handleNavigate("settings")}
          >
            <i className="fa-solid fa-gear" /> <span>Setting</span>
          </NavLink>

          <div className="nav-divider" />
        </nav>

        <div className="logout-section">
          <button className="logout-btn" type="button" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket" /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
