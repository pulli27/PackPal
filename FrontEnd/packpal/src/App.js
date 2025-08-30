import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import InventoryDashboard from "./Components/Dashboard/InventoryDashboard";
import ItemInventory from "./Components/ItemInventory/ItemInventory";
import Suppliers from "./Components/Suppliers/Suppliers";

export default function App() {
  return (
    <Routes>
      <Route path="/maindashboard" element={<InventoryDashboard />} />
      <Route path="/iteminventory" element={<ItemInventory />} />
      <Route path="/supplier" element={<Suppliers />} />
    </Routes>
  );
}
