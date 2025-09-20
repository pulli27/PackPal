import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Make sure these files default-export React components:
import Udashboard from "./Components/Dashboard/Udashboard";
import Login from "./Components/Login/Login";
import UserManagement from "./Components/UserManagement/UserManagement";
import Analytics from "./Components/Analytics/Analytics";
import Payment from "./Components/Payment/Payment";
import Createaccount from "./Components/CreateAccount/Createaccount";
import Orders from "./Components/Orders/Order";
import Settings from "./Components/Settings/Settings"; 




export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Udashboard />} />
      <Route path="/usermanagement" element={<UserManagement />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/createaccount" element={<Createaccount />} />
      <Route path="/order" element={<Orders />} />
      <Route path="/settings" element={<Settings />} />
      

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
