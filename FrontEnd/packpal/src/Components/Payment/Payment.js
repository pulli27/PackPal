
import React, { useMemo, useState } from "react";
import "./Payment.css";

import Sidebar from "../Sidebar/Sidebar";
function Payment() {

// Filter payments by status and search
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("tableSearch");
  const statusFilter = document.getElementById("statusFilter");
  const table = document.getElementById("paymentsTable");
  const rows = table.querySelectorAll("tbody tr");

  function filterTable() {
    const searchText = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const customer = cells[2].innerText.toLowerCase();
      const status = cells[4].innerText.toLowerCase();

      const matchesSearch = customer.includes(searchText);
      const matchesStatus = statusValue === "all" || status === statusValue;

      if (matchesSearch && matchesStatus) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  searchInput.addEventListener("keyup", filterTable);
  statusFilter.addEventListener("change", filterTable);
});


  return (
    <div>
        <Sidebar/>
      
<div class="stats">
      <div class="card">
        <p>Total Payments Received</p>
        <h2>LKR 6,250</h2>
      </div>
      <div class="card">
        <p>Pending Payments</p>
        <h2>LKR 1,200</h2>
      </div>
      <div class="card">
        <p>Overdue Payments</p>
        <h2>LKR 350</h2>
      </div>
      <div class="card">
        <p>This Month</p>
        <h2>LKR 3,000</h2>
      </div>
    </div>

    <div class="table-container">
      <div class="table-actions">
        <input type="text" id="tableSearch" placeholder="Search..." />
        <select id="statusFilter">
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <table id="paymentsTable">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#1024</td><td>1234</td><td>John Doe</td>
            <td>$500</td><td><span class="status paid">Paid</span></td>
            <td>02/18/2024</td><td>⬇️</td>
          </tr>
          <tr>
            <td>#1023</td><td>1233</td><td>Jane Smith</td>
            <td>$300</td><td><span class="status pending">Pending</span></td>
            <td>02/15/2024</td><td>⬇️</td>
          </tr>
          <tr>
            <td>#1022</td><td>1232</td><td>Michael Brown</td>
            <td>$450</td><td><span class="status failed">Failed</span></td>
            <td>02/10/2024</td><td>⬇️</td>
          </tr>
          <tr>
            <td>#1021</td><td>1231</td><td>Emily White</td>
            <td>$350</td><td><span class="status paid">Paid</span></td>
            <td>02/09/2024</td><td>⬇️</td>
          </tr>
          <tr>
            <td>#1020</td><td>1230</td><td>David Wilson</td>
            <td>$275</td><td><span class="status failed">Failed</span></td>
            <td>02/06/2024</td><td>⬇️</td>
          </tr>
          <tr>
            <td>#1019</td><td>1229</td><td>David Wilson</td>
            <td>$275</td><td><span class="status paid">Paid</span></td>
            <td>02/06/2024</td><td>⬇️</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>


  )
}

export default Payment
