// src/App.js
import React from "react";
import Pdashboard from "./Components/Productdashboard/Pdashboard"
import SewingInstruction from "./Components/SewingInstruction/SewingInstruction"
import Employee from "./Components/Employee/Employee"
import Reports from "./Components/Reports/Reports"



export default function App() {
  return (
    <div>
      <Pdashboard />
      <SewingInstruction />
      <Employee/>
      <Reports/>
    
      
    </div>
  );
}
