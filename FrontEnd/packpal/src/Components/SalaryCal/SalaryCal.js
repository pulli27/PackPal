import React, { useEffect,useState } from "react";
import "./SalaryCal.css";
import Sidebar from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";


/* ====== Simple toast helper (same pattern you used) ====== */
const showNotification = (message, type = "info") => {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const colors = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  const icons  = { success:"fa-check-circle", error:"fa-exclamation-circle", warning:"fa-exclamation-triangle", info:"fa-info-circle" };
  const n = document.createElement("div");
  n.className = "notification";
  n.style.cssText = `
    position:fixed; top:20px; right:20px; background:#fff; color:${colors[type]};
    padding:15px 20px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.15);
    border-left:4px solid ${colors[type]}; z-index:10000; display:flex; align-items:center; gap:10px;
    max-width:420px; animation:sal-slideIn .3s ease; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  `;
  n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  if (!document.querySelector("#sal-toast-anim")) {
    const style = document.createElement("style");
    style.id = "sal-toast-anim";
    style.textContent = `
      @keyframes sal-slideIn { from { transform:translateX(100%); opacity:0; } to{ transform:translateX(0); opacity:1; } }
      @keyframes sal-slideOut { from { transform:translateX(0); opacity:1; } to{ transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => { n.style.animation = "sal-slideOut .3s ease"; setTimeout(() => n.remove(), 300); }, 3000);
};

/* ====== Local storage & helpers ====== */
const Store = {
  kE: "employees",
  kA: "attendance",
  kAd: "advances",
  kT: "transfers",
  get(k, f = []) {
    try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; }
  },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  ensureSeed() {
    if (!localStorage.getItem(this.kE)) {
      this.set(this.kE, [
        { id: "EMP001", name: "John Silva",  designation: "Software Engineer", epf: "EPF001", salary: 75000, bankName: "Commercial Bank", branch: "Colombo 03", accNo: "1234567890" },
        { id: "EMP002", name: "Maria Fernando", designation: "HR Manager",     epf: "EPF002", salary: 85000, bankName: "Peoples Bank",    branch: "Kandy",      accNo: "9876543210" },
      ]);
      this.set(this.kA, [
        { empId: "EMP001", period: "2025-08", workingDays: 22, overtimeHrs: 10, leaveAllowed: 2, noPayLeave: 0, leaveTaken: 1, other: "Good performance" },
      ]);
      this.set(this.kAd, [
        { empId: "EMP001", period: "2025-08", costOfLiving: 15000, food: 8000, conveyance: 5000, medical: 3000, bonus: 10000, reimbursements: 2000 },
      ]);
      this.set(this.kT, []);
    }
  },
};
const rs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString()}`;

/* ====== UI actions (DOM-based) ====== */
function showAddEmployeeForm() {
  const el = document.getElementById("addEmployeeForm");
  if (el) el.style.display = "block";
}
function cancelAddEmployeeForm() {
  const el = document.getElementById("addEmployeeForm");
  if (el) el.style.display = "none";
  document.querySelectorAll("#addEmployeeForm input").forEach((i) => (i.value = ""));
}

function renderEmployeeTable() {
  const tbody = document.querySelector("#employeeTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const employees = Store.get(Store.kE);
  employees.forEach((emp, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.designation || ""}</td>
      <td>${emp.epf || ""}</td>
      <td>${rs(emp.salary)}</td>
      <td>${emp.bankName || ""} - ${emp.branch || ""} - ${emp.accNo || ""}</td>
      <td class="actions">
        <button class="btn btn-warning" onclick="editEmployee(${i})">Edit</button>
        <button class="btn btn-danger" onclick="deleteEmployee(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function addEmployee() {
  const emp = {
    id: document.getElementById("empId")?.value.trim(),
    name: document.getElementById("empName")?.value.trim(),
    designation: document.getElementById("empDesignation")?.value.trim(),
    epf: document.getElementById("empEpf")?.value.trim(),
    salary: parseFloat(document.getElementById("empSalary")?.value),
    bankName: document.getElementById("empBankName")?.value.trim(),
    branch: document.getElementById("empBranch")?.value.trim(),
    accNo: document.getElementById("empAccNo")?.value.trim(),
  };
  const employees = Store.get(Store.kE);
  if (!emp.id || !emp.name || isNaN(emp.salary)) {
    showNotification("Please fill in required fields (ID, Name, Salary).", "error");
    return;
  }
  if (employees.some((e) => e.id === emp.id)) {
    showNotification("Employee ID already exists.", "warning");
    return;
  }

  employees.push(emp);
  Store.set(Store.kE, employees);
  cancelAddEmployeeForm();
  renderEmployeeTable();
  showNotification("Employee added successfully!", "success");
}

function editEmployee(index) {
  const e = Store.get(Store.kE)[index];
  const body = document.getElementById("modalBody");
  if (!body) return;
  body.innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label>Employee ID</label><input type="text" id="editEmpId" value="${e.id}"></div>
      <div class="form-group"><label>Name</label><input type="text" id="editEmpName" value="${e.name}"></div>
      <div class="form-group"><label>Designation</label><input type="text" id="editEmpDesignation" value="${e.designation || ""}"></div>
      <div class="form-group"><label>EPF No</label><input type="text" id="editEmpEpf" value="${e.epf || ""}"></div>
      <div class="form-group"><label>Basic Salary</label><input type="number" id="editEmpSalary" value="${e.salary}"></div>
      <div class="form-group"><label>Bank Name</label><input type="text" id="editEmpBankName" value="${e.bankName || ""}"></div>
      <div class="form-group"><label>Branch</label><input type="text" id="editEmpBranch" value="${e.branch || ""}"></div>
      <div class="form-group"><label>Account No</label><input type="text" id="editEmpAccNo" value="${e.accNo || ""}"></div>
    </div>
    <button class="btn btn-success" onclick="saveEmployee(${index})">Save Changes</button>
    <button class="btn btn-warning" onclick="closeModal()">Cancel</button>`;
  const title = document.getElementById("modalTitle");
  const modal = document.getElementById("editModal");
  if (title) title.textContent = "Edit Employee";
  if (modal) modal.style.display = "block";
}

function saveEmployee(index) {
  const employees = Store.get(Store.kE);
  employees[index] = {
    id: document.getElementById("editEmpId")?.value.trim(),
    name: document.getElementById("editEmpName")?.value.trim(),
    designation: document.getElementById("editEmpDesignation")?.value.trim(),
    epf: document.getElementById("editEmpEpf")?.value.trim(),
    salary: parseFloat(document.getElementById("editEmpSalary")?.value),
    bankName: document.getElementById("editEmpBankName")?.value.trim(),
    branch: document.getElementById("editEmpBranch")?.value.trim(),
    accNo: document.getElementById("editEmpAccNo")?.value.trim(),
  };
  Store.set(Store.kE, employees);
  closeModal();
  renderEmployeeTable();
  showNotification("Record updated successfully!", "success");
}

function deleteEmployee(index) {
  if (!window.confirm("Are you sure you want to delete this employee?")) return;
  const employees = Store.get(Store.kE);
  employees.splice(index, 1);
  Store.set(Store.kE, employees);
  renderEmployeeTable();
  showNotification("Employee deleted.", "warning");
}

function closeModal() {
  const m = document.getElementById("editModal");
  if (m) m.style.display = "none";
}

/* Expose globals for inline onclick handlers in the table rows */
window.showAddEmployeeForm = showAddEmployeeForm;
window.cancelAddEmployeeForm = cancelAddEmployeeForm;
window.addEmployee = addEmployee;
window.editEmployee = editEmployee;
window.saveEmployee = saveEmployee;
window.deleteEmployee = deleteEmployee;
window.closeModal = closeModal;

export default function SalaryCal() {
  
  useEffect(() => {
    Store.ensureSeed();
    renderEmployeeTable();

    // Welcome toast (mirrors EPF page behavior)
    const t = setTimeout(() => {
      showNotification("Welcome to Employee Salary Management!", "success");
    }, 400);

    // Close modal when clicking outside
    const onWinClick = (e) => {
      const m = document.getElementById("editModal");
      if (e.target === m) closeModal();
    };
    window.addEventListener("click", onWinClick);

    return () => {
      clearTimeout(t);
      window.removeEventListener("click", onWinClick);
    };
  }, []);

  return (
    <div className="salarycal page-wrap">
      <Sidebar />
      
      <div className="container">
        <h1>Employee Salary Management</h1>
        <p>Real-time salary insights and employee payroll management</p>

        <div className="section">
          <div className="nav">
            <NavLink to="/finance/employees"  className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>
              👥 Employees
            </NavLink>
            <NavLink to="/finance/attendance" className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>
              📅 Attendance
            </NavLink>
            <NavLink to="/finance/advance"    className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>
              💰 Advance
            </NavLink>
            <NavLink to="/finance/salary"     className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>
              📊 Salary Management
            </NavLink>
            <NavLink to="/finance/transfers"  className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>
              💸 Salary Transfers
            </NavLink>
          </div>

          <h2>Employee Information</h2>

          <button
            className="btn btn-primary"
            type="button"
            onClick={() => window.showAddEmployeeForm()}
          >
            + Add New Employee
          </button>

          <div id="addEmployeeForm" style={{ display: "none", marginTop: 20 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <input type="text" id="empId" placeholder="Enter employee ID" />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" id="empName" placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" id="empDesignation" placeholder="Enter designation" />
              </div>
              <div className="form-group">
                <label>EPF No</label>
                <input type="text" id="empEpf" placeholder="Enter EPF number" />
              </div>
              <div className="form-group">
                <label>Basic Salary</label>
                <input type="number" id="empSalary" placeholder="Enter basic salary" />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" id="empBankName" placeholder="Enter bank name" />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input type="text" id="empBranch" placeholder="Enter branch" />
              </div>
              <div className="form-group">
                <label>Account No</label>
                <input type="text" id="empAccNo" placeholder="Enter account number" />
              </div>
            </div>

            <button className="btn btn-success" type="button" onClick={() => window.addEmployee()}>
              Save Employee
            </button>
            <button className="btn btn-warning" type="button" onClick={() => window.cancelAddEmployeeForm()}>
              Cancel
            </button>
          </div>

          <table id="employeeTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>EPF No</th>
                <th>Basic Salary</th>
                <th>Bank Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{/* populated dynamically */}</tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div id="editModal" className="salary-modal">
        <div className="salary-modal-content">
          <span className="salary-modal-close" onClick={() => window.closeModal()}>&times;</span>
          <h2 id="modalTitle">Edit Record</h2>
          <div id="modalBody"></div>
        </div>
      </div>
    </div>
  );
}
