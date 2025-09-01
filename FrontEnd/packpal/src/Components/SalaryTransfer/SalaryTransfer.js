import React, { useEffect } from "react";
import "./SalaryTransfer.css";
import Sidebar from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";

function SalaryTransfer() {
  const StoreT = {
    kT: "transfers",
    get(k, f = []) {
      try {
        return JSON.parse(localStorage.getItem(k)) ?? f;
      } catch {
        return f;
      }
    },
    set(k, v) {
      localStorage.setItem(k, JSON.stringify(v));
    },
  };

  const rs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString()}`;

  function renderTransferTable() {
    const tbody = document.querySelector("#transferTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = StoreT.get(StoreT.kT);
    data.forEach((t, i) => {
      const statusClass = t.status === "Paid" ? "status-paid" : "status-pending";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.empId}</td>
        <td>${t.date}</td>
        <td>${t.month}</td>
        <td>${t.empName}</td>
        <td>${rs(t.amount)}</td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
        <td class="actions">
          ${
            t.status === "Pending"
              ? `<button class="btn btn-success" onclick="markAsPaid(${i})">Mark as Paid</button>`
              : "<span>Completed</span>"
          }
          <button class="btn btn-danger" onclick="deleteTransfer(${i})">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function markAsPaid(index) {
    const data = StoreT.get(StoreT.kT);
    data[index].status = "Paid";
    StoreT.set(StoreT.kT, data);
    renderTransferTable();
    window.alert("Salary transfer marked as paid!");
  }

  function deleteTransfer(index) {
    if (!window.confirm("Are you sure you want to delete this transfer record?"))
      return;
    const data = StoreT.get(StoreT.kT);
    data.splice(index, 1);
    StoreT.set(StoreT.kT, data);
    renderTransferTable();
  }

  useEffect(() => {
    renderTransferTable();
  }, []);

  // expose for inline onclick inside generated table
  window.markAsPaid = markAsPaid;
  window.deleteTransfer = deleteTransfer;

  return (
    <div className="salarycal page-wrap">
             <Sidebar />
       
             <div className="container">
                 <h1>Employee Salary Management</h1>
        <p>Real-time salary insights and employee payroll management</p>
               <div className="section">
       <div className="nav">
         <NavLink to="/finance/employees"  className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>
           👥 Employees
         </NavLink>
         <NavLink to="/finance/attendance" className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>
           📅 Attendance
         </NavLink>
         <NavLink to="/finance/advance"    className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>
           💰 Advance
         </NavLink>
         <NavLink to="/finance/salary"     className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>
           📊 Salary Management
         </NavLink>
         <NavLink to="/finance/transfers"  className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>
           💸 Salary Transfers
         </NavLink>
       </div>

          <h2>Salary Transfer Details</h2>

          <table id="transferTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Month</th>
                <th>Employee Name</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{/* rows rendered dynamically */}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalaryTransfer;
