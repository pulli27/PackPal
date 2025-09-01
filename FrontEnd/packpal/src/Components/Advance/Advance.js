import React, { useEffect } from "react";
import "./Advance.css"; // or create Advance.css with similar styles
import Sidebar from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";

function Advance() {
  /* storage */
  const StoreAdv = {
    kE: "employees",
    kAd: "advances",
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
      if (!localStorage.getItem(this.kAd)) {
        localStorage.setItem(this.kAd, JSON.stringify([
          { empId: "EMP001", period: "2025-08", costOfLiving: 15000, food: 8000, conveyance: 5000, medical: 3000, bonus: 10000, reimbursements: 2000 }
        ]));
      }
    }
  };

  const rs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString()}`;

  function fillEmpOptions(sel) {
    const emps = StoreAdv.get(StoreAdv.kE);
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Employee</option>';
    emps.forEach(e => {
      const o = document.createElement("option");
      o.value = e.id;
      o.textContent = `${e.id} - ${e.name}`;
      sel.appendChild(o);
    });
  }

  /* form show/hide */
  function showAddAdvanceForm(){ const f = document.getElementById("addAdvanceForm"); if (f) f.style.display = "block"; }
  function cancelAddAdvanceForm(){
    const f = document.getElementById("addAdvanceForm");
    if (f) f.style.display = "none";
    document.querySelectorAll("#addAdvanceForm input, #addAdvanceForm select").forEach(i => i.value = "");
  }

  /* table */
  function renderAdvanceTable(){
    const tbody = document.querySelector("#advanceTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = StoreAdv.get(StoreAdv.kAd);
    data.forEach((adv,i)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${adv.empId}</td>
        <td>${adv.period}</td>
        <td>${rs(adv.costOfLiving)}</td>
        <td>${rs(adv.food)}</td>
        <td>${rs(adv.conveyance)}</td>
        <td>${rs(adv.medical)}</td>
        <td>${rs(adv.bonus)}</td>
        <td>${rs(adv.reimbursements)}</td>
        <td class="actions">
          <button class="btn btn-warning" onclick="editAdvance(${i})">Edit</button>
          <button class="btn btn-danger" onclick="deleteAdvance(${i})">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  /* CRUD */
  function addAdvance(){
    const rec = {
      empId: document.getElementById("advEmpId")?.value,
      period: document.getElementById("advPeriod")?.value,
      costOfLiving: parseFloat(document.getElementById("advCostOfLiving")?.value) || 0,
      food: parseFloat(document.getElementById("advFood")?.value) || 0,
      conveyance: parseFloat(document.getElementById("advConveyance")?.value) || 0,
      medical: parseFloat(document.getElementById("advMedical")?.value) || 0,
      bonus: parseFloat(document.getElementById("advBonus")?.value) || 0,
      reimbursements: parseFloat(document.getElementById("advReimbursements")?.value) || 0
    };
    if (!rec.empId || !rec.period) return window.alert("Please fill in required fields");
    const data = StoreAdv.get(StoreAdv.kAd);
    data.push(rec);
    StoreAdv.set(StoreAdv.kAd, data);
    cancelAddAdvanceForm();
    renderAdvanceTable();
    window.alert("Advance record added successfully!");
  }

  function editAdvance(index){
    const adv = StoreAdv.get(StoreAdv.kAd)[index];
    const emps = StoreAdv.get(StoreAdv.kE);
    const body = document.getElementById("modalBody");
    if (!body) return;
    body.innerHTML = `
      <div class="form-grid">
        <div class="form-group"><label>Employee ID</label>
          <select id="editAdvEmpId">${emps.map(e=>`<option value="${e.id}" ${e.id===adv.empId?'selected':''}>${e.id} - ${e.name}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Period</label><input type="month" id="editAdvPeriod" value="${adv.period}"></div>
        <div class="form-group"><label>Cost of Living</label><input type="number" id="editAdvCostOfLiving" value="${adv.costOfLiving||0}"></div>
        <div class="form-group"><label>Food</label><input type="number" id="editAdvFood" value="${adv.food||0}"></div>
        <div class="form-group"><label>Conveyance</label><input type="number" id="editAdvConveyance" value="${adv.conveyance||0}"></div>
        <div class="form-group"><label>Medical</label><input type="number" id="editAdvMedical" value="${adv.medical||0}"></div>
        <div class="form-group"><label>Bonus</label><input type="number" id="editAdvBonus" value="${adv.bonus||0}"></div>
        <div class="form-group"><label>Reimbursements</label><input type="number" id="editAdvReimbursements" value="${adv.reimbursements||0}"></div>
      </div>
      <button class="btn btn-success" onclick="saveAdvance(${index})">Save Changes</button>
      <button class="btn btn-warning" onclick="closeModal()">Cancel</button>`;
    const title = document.getElementById("modalTitle");
    const modal = document.getElementById("editModal");
    if (title) title.textContent = "Edit Advance";
    if (modal) modal.style.display = "block";
  }

  function saveAdvance(index){
    const data = StoreAdv.get(StoreAdv.kAd);
    data[index] = {
      empId: document.getElementById("editAdvEmpId")?.value,
      period: document.getElementById("editAdvPeriod")?.value,
      costOfLiving: parseFloat(document.getElementById("editAdvCostOfLiving")?.value) || 0,
      food: parseFloat(document.getElementById("editAdvFood")?.value) || 0,
      conveyance: parseFloat(document.getElementById("editAdvConveyance")?.value) || 0,
      medical: parseFloat(document.getElementById("editAdvMedical")?.value) || 0,
      bonus: parseFloat(document.getElementById("editAdvBonus")?.value) || 0,
      reimbursements: parseFloat(document.getElementById("editAdvReimbursements")?.value) || 0
    };
    StoreAdv.set(StoreAdv.kAd, data);
    closeModal();
    renderAdvanceTable();
    window.alert("Record updated successfully!");
  }

  function deleteAdvance(index){
    if (!window.confirm("Are you sure you want to delete this advance record?")) return;
    const data = StoreAdv.get(StoreAdv.kAd);
    data.splice(index, 1);
    StoreAdv.set(StoreAdv.kAd, data);
    renderAdvanceTable();
  }

  /* modal + boot */
  function closeModal(){ const m = document.getElementById("editModal"); if (m) m.style.display = "none"; }

  // expose globals for inline handlers inside dynamic HTML
  window.showAddAdvanceForm = showAddAdvanceForm;
  window.cancelAddAdvanceForm = cancelAddAdvanceForm;
  window.addAdvance = addAdvance;
  window.editAdvance = editAdvance;
  window.saveAdvance = saveAdvance;
  window.deleteAdvance = deleteAdvance;
  window.closeModal = closeModal;

  useEffect(() => {
    StoreAdv.ensureSeed();
    fillEmpOptions(document.getElementById("advEmpId"));
    renderAdvanceTable();

    const onWinClick = (e) => {
      const m = document.getElementById("editModal");
      if (e.target === m) closeModal();
    };
    window.addEventListener("click", onWinClick);
    return () => window.removeEventListener("click", onWinClick);
  }, []);

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
          <h2>Payroll Advance</h2>

          <button className="btn btn-primary" type="button" onClick={() => window.showAddAdvanceForm()}>
            + Add Advance Record
          </button>

          <div id="addAdvanceForm" style={{ display: "none", marginTop: 20 }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <select id="advEmpId">
                  <option value="">Select Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <input type="month" id="advPeriod" />
              </div>
              <div className="form-group">
                <label>Cost of Living</label>
                <input type="number" id="advCostOfLiving" placeholder="Enter cost of living" />
              </div>
              <div className="form-group">
                <label>Food</label>
                <input type="number" id="advFood" placeholder="Enter food allowance" />
              </div>
              <div className="form-group">
                <label>Conveyance</label>
                <input type="number" id="advConveyance" placeholder="Enter conveyance" />
              </div>
              <div className="form-group">
                <label>Medical</label>
                <input type="number" id="advMedical" placeholder="Enter medical" />
              </div>
              <div className="form-group">
                <label>Bonus</label>
                <input type="number" id="advBonus" placeholder="Enter bonus" />
              </div>
              <div className="form-group">
                <label>Reimbursements</label>
                <input type="number" id="advReimbursements" placeholder="Enter reimbursements" />
              </div>
            </div>

            <button className="btn btn-success" type="button" onClick={() => window.addAdvance()}>
              Save Advance
            </button>
            <button className="btn btn-warning" type="button" onClick={() => window.cancelAddAdvanceForm()}>
              Cancel
            </button>
          </div>

          <table id="advanceTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Period</th>
                <th>Cost of Living</th>
                <th>Food</th>
                <th>Conveyance</th>
                <th>Medical</th>
                <th>Bonus</th>
                <th>Reimbursements</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{/* filled by renderAdvanceTable() */}</tbody>
          </table>
        </div>
      </div>

      {/* Scoped modal to avoid global conflicts */}
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

export default Advance;
