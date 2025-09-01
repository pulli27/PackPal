import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FinanceDashboard from "./Components/Dashboard/FinanceDashboard";
import SalaryCal from "./Components/SalaryCal/SalaryCal";
import Attendance from "./Components/Attendance/Attendance";
import Advance from "./Components/Advance/Advance";
import SalaryTransfer from "./Components/SalaryTransfer/SalaryTransfer";
import SalaryManagement from "./Components/SalaryManagement/SalaryManagement";
import EpfManagement from "./Components/EpfManagement/EpfManagement";
import FinancialReport from "./Components/FinancialReport/FinancialReport";
import Revenue from "./Components/Revenue/Revenue";
import Setting from "./Components/Setting/Setting";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<FinanceDashboard />} />
      <Route path="/salarycal" element={<SalaryCal />} />
       <Route path="/epf" element={<EpfManagement />} />
       <Route path="/report" element={<FinancialReport />} />
       <Route path="/revenue" element={<Revenue />} />
       <Route path="/setting" element={<Setting />} />

      {/* Finance tabs */}
      <Route path="/finance/employees" element={<SalaryCal />} />
      <Route path="/finance/attendance" element={<Attendance />} />
      <Route path="/finance/advance" element={<Advance />} />
      <Route path="/finance/transfers" element={<SalaryTransfer />} />
      <Route path="/finance/salary" element={<SalaryManagement />} /> 
     
    
    </Routes>
  );
}
