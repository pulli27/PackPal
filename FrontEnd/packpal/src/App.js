import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Udashboard from "./Components/Dashboard/Udashboard";
import Login from "./Components/Login/Login";
import UserManagement from "./Components/UserManagement/UserManagement";
import Analytics from "./Components/Analytics/Analytics";
import Payment from "./Components/Payment/Payment";
import Createaccount from "./Components/CreateAccount/Createaccount";
import Orders from "./Components/Orders/Order";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Udashboard />} />
      <Route path="/usermanagement" element={<UserManagement/>}/>
       <Route path="/payment" element={<Payment/>}/>
        <Route path="/analytics" element={<Analytics/>}/>
   <Route path="/createaccount" element={<Createaccount/>}/>
   <Route path="/order" element={<Orders/>}/>
    </Routes>
  );
}
