import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Make sure these files default-export React components:
import Udashboard from "./Components/Dashboard/Udashboard";
import Login from "./Components/Login/Login";
import UserManagement from "./Components/UserManagement/UserManagement";

import Createaccount from "./Components/CreateAccount/Createaccount";
import Orders from "./Components/Orders/Order";
import Settingsis from "./Components/Settings/Settingsis"; 




export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/isudashboard" element={<Udashboard />} />
      <Route path="/usermanagement" element={<UserManagement />} />
      
      <Route path="/createaccount" element={<Createaccount />} />
      <Route path="/order" element={<Orders />} />
      <Route path="/settingsis" element={<Settingsis />} />
      

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
