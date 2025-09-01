import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import CartDashboard from "./components/Dashboard/CartDashboard";
import ProductList from "./components/Product/ProductList";
import Discounts from "./components/Discounts/Discounts";
import Finance from "./components/Finance/Finance";
import SalesReports from "./components/Reports/SalesReports";

import "./App.css";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Routes>
          {/* redirect root to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<CartDashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/discounts" element={<Discounts />} /> 
           <Route path="/finance" element={<Finance />} /> 
          /<Route path="/reports" element={<SalesReports />} /> 
        </Routes>
      </main>
    </div>
  );
}

export default App;
