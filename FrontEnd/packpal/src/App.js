import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Pdashboard from "./Components/Productdashboard/Pdashboard";
import SewingInstruction from "./Components/SewingInstruction/SewingInstruction";
import Employee from "./Components/Employee/Employee";
import Reports from "./Components/Reports/Reports";
import Quality from "./Components/Quality/Quality";
import Setting from "./Components/Setting/Setting";

export default function App() {
  return (
    <Routes>
      {/* default -> dashboard */}
      <Route path="/" element={<Navigate to="/maindashboard" replace />} />

      {/* main pages */}
      <Route path="/maindashboard" element={<Pdashboard />} />
      <Route path="/sewing" element={<SewingInstruction />} />
      <Route path="/employee" element={<Employee />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/quality" element={<Quality />} />
      <Route path="/settings" element={<Setting />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/maindashboard" replace />} />
    </Routes>
  );
}
