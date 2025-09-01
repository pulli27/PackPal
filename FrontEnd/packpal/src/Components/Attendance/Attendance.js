import React, { useEffect } from "react";
import "./Attendance.css";
import Sidebar from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";

/* storage + helpers */
const StoreA = {
  kE: "employees",
  kA: "attendance",
  get(k, f = []) {
    try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; }
  },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  ensureSeed() {
    if (!localStorage.getItem(this.kE)) {
      localStorage.setItem(this.kE, JSON.stringify([
        { id: "EMP001", name: "John Silva",  designation: "Software Engineer", epf: "EPF001", salary: 75000, bankName: "Commercial Bank", branch: "Colombo 03", accNo: "1234567890" },
        { id: "EMP002", name: "Maria Fernando", designation: "HR Manager",     epf: "EPF002", salary: 85000, bankName: "Peoples Bank",   branch: "Kandy",      accNo: "9876543210" }
      ]));
    }
    if (!localStorage.getItem(this.kA)) {
      localStorage.setItem(this.kA, JSON.stringify([
        { empId: "EMP001", period: "2025-08", workingDays: 22, overtimeHrs: 10, leaveAllowed: 2, noPayLeave: 0, leaveTaken: 1, other: "Good performance" }
      ]));
    }
  }
};

function fillEmpOptions(sel) {
  const emps = StoreA.get(StoreA.kE);
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Employee</option>';
  emps.forEach(e => {
    const o = document.createElement("option");
    o.value = e.id;
    o.textContent = `${e.id} - ${e.name}`;
    sel.appendChild(o);
  });
}

/* add form show/hide */
function showAddAttendanceForm(){ const f=document.getElementById("addAttendanceForm"); if (f) f.style.display="block"; }
function cancelAddAttendanceForm(){
  const f=document.getElementById("addAttendanceForm");
  if (f) f.style.display="none";
  document.querySelectorAll("#addAttendanceForm input, #addAttendanceForm select").forEach(i => i.value = "");
}

/* table render */
function renderAttendanceTable(){
  const tbody = document.querySelector("#attendanceTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = StoreA.get(StoreA.kA);
  data.forEach((att,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${att.empId}</td>
      <td>${att.period}</td>
      <td>${att.workingDays || 0}</td>
      <td>${att.overtimeHrs || 0}</td>
      <td>${att.leaveAllowed || 0}</td>
      <td>${att.noPayLeave || 0}</td>
      <td>${att.leaveTaken || 0}</td>
      <td>${att.other || ""}</td>
      <td class="actions">
        <button class="btn btn-warning" onclick="editAttendance(${i})">Edit</button>
        <button class="btn btn-danger" onclick="deleteAttendance(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/* CRUD */
function addAttendance(){
  const rec = {
    empId: document.getElementById("attEmpId")?.value,
    period: document.getElementById("attPeriod")?.value,
    workingDays: parseInt(document.getElementById("attWorkingDays")?.value) || 0,
    overtimeHrs: parseInt(document.getElementById("attOvertimeHrs")?.value) || 0,
    leaveAllowed: parseInt(document.getElementById("attLeaveAllowed")?.value) || 0,
    noPayLeave: parseInt(document.getElementById("attNoPayLeave")?.value) || 0,
    leaveTaken: parseInt(document.getElementById("attLeaveTaken")?.value) || 0,
    other: (document.getElementById("attOther")?.value || "").trim()
  };
  if (!rec.empId || !rec.period) return window.alert("Please fill in required fields");
  const data = StoreA.get(StoreA.kA);
  data.push(rec);
  StoreA.set(StoreA.kA, data);
  cancelAddAttendanceForm();
  renderAttendanceTable();
  window.alert("Attendance record added successfully!");
}

function editAttendance(index){
  const att = StoreA.get(StoreA.kA)[index];
  const emps = StoreA.get(StoreA.kE);
  const body = document.getElementById("modalBody");
  if (!body) return;
  body.innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label>Employee ID</label>
        <select id="editAttEmpId">${emps.map(e=>`<option value="${e.id}" ${e.id===att.empId?'selected':''}>${e.id} - ${e.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Period</label><input type="month" id="editAttPeriod" value="${att.period}"></div>
      <div class="form-group"><label>Working Days</label><input type="number" id="editAttWorkingDays" value="${att.workingDays||0}"></div>
      <div class="form-group"><label>Overtime Hours</label><input type="number" id="editAttOvertimeHrs" value="${att.overtimeHrs||0}"></div>
      <div class="form-group"><label>Leave Allowed</label><input type="number" id="editAttLeaveAllowed" value="${att.leaveAllowed||0}"></div>
      <div class="form-group"><label>No Pay Leave</label><input type="number" id="editAttNoPayLeave" value="${att.noPayLeave||0}"></div>
      <div class="form-group"><label>Leave Taken</label><input type="number" id="editAttLeaveTaken" value="${att.leaveTaken||0}"></div>
      <div class="form-group"><label>Other</label><input type="text" id="editAttOther" value="${att.other||''}"></div>
    </div>
    <button class="btn btn-success" onclick="saveAttendance(${index})">Save Changes</button>
    <button class="btn btn-warning" onclick="closeModal()">Cancel</button>`;
  const title = document.getElementById("modalTitle");
  const modal = document.getElementById("editModal");
  if (title) title.textContent = "Edit Attendance";
  if (modal) modal.style.display = "block";
}

function saveAttendance(index){
  const data = StoreA.get(StoreA.kA);
  data[index] = {
    empId: document.getElementById("editAttEmpId")?.value,
    period: document.getElementById("editAttPeriod")?.value,
    workingDays: parseInt(document.getElementById("editAttWorkingDays")?.value) || 0,
    overtimeHrs: parseInt(document.getElementById("editAttOvertimeHrs")?.value) || 0,
    leaveAllowed: parseInt(document.getElementById("editAttLeaveAllowed")?.value) || 0,
    noPayLeave: parseInt(document.getElementById("editAttNoPayLeave")?.value) || 0,
    leaveTaken: parseInt(document.getElementById("editAttLeaveTaken")?.value) || 0,
    other: (document.getElementById("editAttOther")?.value || "").trim()
  };
  StoreA.set(StoreA.kA, data);
  closeModal();
  renderAttendanceTable();
  window.alert("Record updated successfully!");
}

function deleteAttendance(index){
  if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
  const data = StoreA.get(StoreA.kA);
  data.splice(index, 1);
  StoreA.set(StoreA.kA, data);
  renderAttendanceTable();
}

/* modal + boot */
function closeModal(){ const m=document.getElementById("editModal"); if (m) m.style.display="none"; }

/* expose to window for inline handlers */
window.showAddAttendanceForm = showAddAttendanceForm;
window.cancelAddAttendanceForm = cancelAddAttendanceForm;
window.addAttendance = addAttendance;
window.editAttendance = editAttendance;
window.saveAttendance = saveAttendance;
window.deleteAttendance = deleteAttendance;
window.closeModal = closeModal;

export default function Attendance() {
  useEffect(() => {
    StoreA.ensureSeed();
    fillEmpOptions(document.getElementById("attEmpId"));
    renderAttendanceTable();

    const onWinClick = (e) => {
      const m = document.getElementById("editModal");
      if (e.target === m) closeModal();
    };
    window.addEventListener("click", onWinClick);
    return () => window.removeEventListener("click", onWinClick);
  }, []);

  return (
    <div className="Attendance page-wrap">
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

        
          <h2>Payroll Attendance</h2>

          {/* Tabs INSIDE the section as requested */}
         
          <button className="btn btn-primary" type="button" onClick={() => window.showAddAttendanceForm()}>
            + Add Attendance Record
          </button>

          <div id="addAttendanceForm" style={{ display: "none", marginTop: 20 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <select id="attEmpId">
                  <option value="">Select Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <input type="month" id="attPeriod" />
              </div>
              <div className="form-group">
                <label>Working Days</label>
                <input type="number" id="attWorkingDays" placeholder="Enter working days" />
              </div>
              <div className="form-group">
                <label>Overtime Hours</label>
                <input type="number" id="attOvertimeHrs" placeholder="Enter overtime hours" />
              </div>
              <div className="form-group">
                <label>Leave Allowed</label>
                <input type="number" id="attLeaveAllowed" placeholder="Enter leave allowed" />
              </div>
              <div className="form-group">
                <label>No Pay Leave</label>
                <input type="number" id="attNoPayLeave" placeholder="Enter no pay leave" />
              </div>
              <div className="form-group">
                <label>Leave Taken</label>
                <input type="number" id="attLeaveTaken" placeholder="Enter leave taken" />
              </div>
              <div className="form-group">
                <label>Other</label>
                <input type="text" id="attOther" placeholder="Enter other details" />
              </div>
            </div>

            <button className="btn btn-success" type="button" onClick={() => window.addAttendance()}>
              Save Attendance
            </button>
            <button className="btn btn-warning" type="button" onClick={() => window.cancelAddAttendanceForm()}>
              Cancel
            </button>
          </div>

          <table id="attendanceTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Period</th>
                <th>Working Days</th>
                <th>Overtime Hrs</th>
                <th>Leave Allowed</th>
                <th>No Pay Leave</th>
                <th>Leave Taken</th>
                <th>Other</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{/* filled by renderAttendanceTable() */}</tbody>
          </table>
        </div>
      </div>

      {/* Scoped modal classes to avoid global conflicts */}
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
