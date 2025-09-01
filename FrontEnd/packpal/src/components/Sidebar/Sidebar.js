import React from "react"
import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar()  {
  return (
   <div className="sidebar">
      <h2 className="logo">  <h2>Smart Bag System</h2></h2>
      <ul className="nav-list">
        <li>
          <Link to="/dashboard">📊 Dashboard</Link>
        </li>
        <li>
          <Link to="/products">🛒 Products</Link>
        </li>
        <li>
          <Link to="/discounts">💸 Discounts</Link>
        </li>
        <li>
          <Link to="/finance">💰 Finance</Link>
        </li>
        <li>
          <Link to="/reports">📑 Reports</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
