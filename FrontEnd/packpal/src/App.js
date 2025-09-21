import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

/* Use the EXACT casing of your folders: "Components" */
import InventoryDashboard from "./Components/Dashboard/InventoryDashboard";
import ItemInventory from "./Components/ItemInventory/ItemInventory";
import Suppliers from "./Components/Suppliers/Suppliers";
import PurchaseItems from "./Components/PurchaseItems/PurchaseItems";
import ProductInventory from "./Components/ProductInventory/ProductInventory";
import Report from "./Components/Report/Report";
import Settingspul from "./Components/Settings/Settingspul";

/* Other modules — keep these only if the files actually exist */
import CartDashboard from "./Components/Dashboard/CartDashboard";
import ProductList from "./Components/Product/ProductList";
import Discounts from "./Components/Discounts/Discounts";
import Finance from "./Components/Finance/Finance";
import SalesReports from "./Components/Reports/SalesReports";
import Settingssa from "./Components/Settings/Settingssa";
import CustomerView from "./pages/CustomerView";
import Cart from "./pages/Cart";

import Udashboard from "./Components/Dashboard/Udashboard";
import Login from "./Components/Login/Login";
import UserManagement from "./Components/UserManagement/UserManagement";
import Createaccount from "./Components/CreateAccount/Createaccount";
import Orders from "./Components/Orders/Order";
import Settingsis from "./Components/Settings/Settingsis"; 

/* 404 fallback */
function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404 – Page not found</h2>
      <p>Route didn’t match.</p>
      <a href="/maindashboard">Go to Dashboard</a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* default: go to dashboard */}
      <Route path="/" element={<Navigate to="/maindashboard" replace />} />

      {/* Core inventory routes */}
      <Route path="/maindashboard" element={<InventoryDashboard />} />
      <Route path="/iteminventory" element={<ItemInventory />} />
      <Route path="/supplier" element={<Suppliers />} />
      <Route path="/purchase" element={<PurchaseItems />} />
      <Route path="/productinventory" element={<ProductInventory />} />
      <Route path="/report" element={<Report />} />
      <Route path="/settingspul" element={<Settingspul />} />

      {/* Other modules — make sure these components exist at the paths above */}
      <Route path="/dashboard" element={<CartDashboard />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/discounts" element={<Discounts />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/reports" element={<SalesReports />} />
      <Route path="/settingssa" element={<Settingssa />} />
      <Route path="/customer" element={<CustomerView/>}/>
      <Route path="/cart" element={<Cart/>}/>

      <Route path="/login" element={<Login />} />
            <Route path="/isudashboard" element={<Udashboard />} />
            <Route path="/usermanagement" element={<UserManagement />} />
            <Route path="/createaccount" element={<Createaccount />} />
            <Route path="/order" element={<Orders />} />
            <Route path="/settingsis" element={<Settingsis />} />

      {/* catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
