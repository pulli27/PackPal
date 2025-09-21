import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Pdashboard from "./Components/Productdashboard/Pdashboard";
import SewingInstruction from "./Components/SewingInstruction/SewingInstruction";
import Employee from "./Components/Employee/Employee";
import Reportshiru from "./Components/Reports/Reportshiru";
import Quality from "./Components/Quality/Quality";
import Settinghiru from "./Components/Setting/Settinghiru";

export default function App() {
  return (
    <Routes>
      {/* default -> dashboard */}
      <Route path="/" element={<Navigate to="/maindashboard" replace />} />

      {/* main pages */}
      <Route path="/hirudashboard" element={<Pdashboard />} />
      <Route path="/sewing" element={<SewingInstruction />} />
      <Route path="/employee" element={<Employee />} />
      <Route path="/reportshiru" element={<Reportshiru />} />
      <Route path="/quality" element={<Quality />} />
      <Route path="/settinghiru" element={<Settinghiru />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/maindashboard" replace />} />
    </Routes>
  );
}
