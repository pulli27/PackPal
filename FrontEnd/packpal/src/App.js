import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import InventoryDashboard from "./Components/Dashboard/InventoryDashboard";
import ItemInventory from "./Components/ItemInventory/ItemInventory";
import Suppliers from "./Components/Suppliers/Suppliers";
import PurchaseItems from "./Components/PurchaseItems/PurchaseItems";
import ProductInventory from "./Components/ProductInventory/ProductInventory";
import Report from "./Components/Report/Report";
import Settings from "./Components/Settings/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/maindashboard" element={<InventoryDashboard />} />
      <Route path="/iteminventory" element={<ItemInventory />} />
      <Route path="/supplier" element={<Suppliers />} />
      <Route path="/purchase" element={<PurchaseItems />} />
      <Route path="/productinventory" element={<ProductInventory />} />
      <Route path="/report" element={<Report />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}
