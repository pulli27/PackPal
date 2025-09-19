// src/App.js
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import CartDashboard from "./components/Dashboard/CartDashboard";
import ProductList from "./components/Product/ProductList";
import Discounts from "./components/Discounts/Discounts";
import Finance from "./components/Finance/Finance";
import SalesReports from "./components/Reports/SalesReports";
import Settings from "./components/Settings/Settings";

// public pages
import CustomerView from "./pages/CustomerView";
import Cart from "./pages/Cart";

import "./App.css";

function App() {
  const location = useLocation();
  const hideSidebar = ["/customer", "/cart"].includes(location.pathname);

  return (
    <div className="app">
      {!hideSidebar && <Sidebar />}
      <main className={`content ${hideSidebar ? "full" : ""}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<CartDashboard />} />
          <Route path="/products" element={<ProductList />} />

          {/* Public views */}
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/discounts" element={<Discounts />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<SalesReports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
