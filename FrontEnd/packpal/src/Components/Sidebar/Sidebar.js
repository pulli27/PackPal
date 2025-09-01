import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  // close on outside click (mobile)
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

  return (
    <aside ref={sidebarRef} id="sidebar" className={`sidebar ${open ? "active" : ""}`}>
      <div className="sidebar-header">
        <h2>🛍️ PackPal</h2>
        <p>Product Dashboard Portal</p>
      </div>

      <nav className="sidebar-nav">
        {/* IMPORTANT: no preventDefault — let NavLink navigate */}
        <NavLink to="/maindashboard" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-chart-line" /> Dashboard
        </NavLink>

        <NavLink to="/sewing" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-cut" /> Sewing Instruction
        </NavLink>
        
        <NavLink to="/quality" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-shield" /> Quality Check
        </NavLink>

        <NavLink to="/employee" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-users" /> Employee
        </NavLink>

        <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-boxes" /> Reports
        </NavLink>

        <div className="nav-divider" />

        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? "active":""}`}>
          <i className="fas fa-cog" /> Setting
        </NavLink>
      </nav>

      <div className="logout-section">
        <button className="logout-btn" type="button" onClick={() => alert("Logged out")}>
          <i className="fas fa-sign-out-alt" /> Logout
        </button>
      </div>
    </aside>
  );
}
