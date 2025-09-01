import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ onLogout }) {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

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

  const logout = () => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm("Are you sure you want to logout?")) return;
    alert("You have been logged out successfully!");
    onLogout?.();
  };

  return (
    <aside ref={sidebarRef} id="sidebar" className={`sidebar ${open ? "active" : ""}`}>
      <div className="sidebar-header">
        <h2>💰 PackPal</h2>
        <p>Finance Dashboard Portal</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => setOpen(false)}
        >
          <i className="fas fa-chart-line" /> Dashboard
        </NavLink>

        <NavLink
          to="/salarycal"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => setOpen(false)}
        >
          <i className="fas fa-calculator" /> Employee Salary
        </NavLink>

        <NavLink
          to="/epf"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => setOpen(false)}
        >
          <i className="fas fa-piggy-bank" /> EPF/ETF Management
        </NavLink>

        {/* Convert the rest to NavLink when you create routes */}
       <NavLink
          to="/report"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => setOpen(false)}
        >
          <i className="fas fa-file-alt" /> Financial Reports
        </NavLink>

        <NavLink
          to="/revenue"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => setOpen(false)}
        >
          <i className="fas fa-chart-bar" /> Revenue & Sales
        </NavLink>
       <div className="nav-divider" />
       <NavLink
          to="/setting"
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          
        >
          <i className="fas fa-cog" />Settings
         
        </NavLink>

       

      
      </nav>

      <div className="logout-section">
        <button className="logout-btn" type="button" onClick={logout}>
          <i className="fas fa-sign-out-alt" /> Logout
        </button>
      </div>
    </aside>
  );
}
