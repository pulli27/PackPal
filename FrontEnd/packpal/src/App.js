// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import CartDashboard from "./components/Dashboard/CartDashboard";
import ProductList from "./components/Product/ProductList";
import Discounts from "./components/Discounts/Discounts";
import Finance from "./components/Finance/Finance";
import SalesReports from "./components/Reports/SalesReports";
import Settings from "./components/Settings/Settings"; // ✅ correct import name
import CustomerView from "./components/Product/CustomerView";  // ✅ Import Customer View

import "./App.css";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Routes>
          {/* Redirect root to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<CartDashboard />} />

          {/* Products + Customer View */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/customer-view" element={<CustomerView />} />

          {/* Discounts */}
          <Route path="/discounts" element={<Discounts />} />

          {/* Finance */}
          <Route path="/finance" element={<Finance />} />

          {/* Reports */}
          <Route path="/reports" element={<SalesReports />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} /> {/* ✅ lowercase path */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
