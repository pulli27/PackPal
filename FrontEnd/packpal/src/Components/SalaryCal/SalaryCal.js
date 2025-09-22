import React, { useEffect, useState } from "react";
import "./SalaryCal.css";
import Sidebar from "../Sidebar/Sidebarsanu";
import { NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { api } from "../../lib/api";

const rs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString()}`;
const toast = (msg, type = "info") => alert(`${type.toUpperCase()}: ${msg}`);

// === Validation helpers ===
// Final (strict) sanitizer: letters + single spaces, trimmed
const sanitizeLettersOnly = (v) =>
  String(v || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Live (typing) sanitizer: letters + spaces, collapse multiples, DO NOT trim
const sanitizeLettersOnlyLive = (v) =>
  String(v || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s{2,}/g, " ");

// Validator: letters and single spaces between words
const isLettersOnly = (v) => {
  const s = String(v || "").trim();
  if (!s) return false;
  return /^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(s);
};

// Digits only for account no
const sanitizeDigitsOnly = (v) => String(v || "").replace(/\D/g, "");
const isDigitsOnly = (v) => /^[0-9]+$/.test(String(v || ""));

// Block scientific notation chars in numeric fields
const blockExpKeys = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
};

export default function SalaryCal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    EmpId: "",
    Emp_Name: "",
    Designation: "",
    Epf_No: "",
    Base_Sal: "",
    Bank_Name: "",
    branch: "",
    Acc_No: "",
  });
  const [editing, setEditing] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/finances");
      const list = (data.finances || []).slice().sort((a, b) => {
        const ta = a.createdAt
          ? new Date(a.createdAt).getTime()
          : parseInt(a._id.substring(0, 8), 16) * 1000;
        const tb = b.createdAt
          ? new Date(b.createdAt).getTime()
          : parseInt(b._id.substring(0, 8), 16) * 1000;
        return ta - tb;
      });
      setRows(list);
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

 
  async function create() {
    if (!form.EmpId || !form.Emp_Name || !form.Base_Sal)
      return toast("EmpId, Name, Salary required", "warning");

    if (!isLettersOnly(form.Emp_Name))
      return toast("Name: letters only (A–Z), no numbers/symbols.", "warning");
    if (form.Designation && !isLettersOnly(form.Designation))
      return toast("Designation: letters only (A–Z), no numbers/symbols.", "warning");
    if (form.Bank_Name && !isLettersOnly(form.Bank_Name))
      return toast("Bank Name: letters only (A–Z), no numbers/symbols.", "warning");
    if (form.branch && !isLettersOnly(form.branch))
      return toast("Branch: letters only (A–Z), no numbers/symbols.", "warning");

    if (form.Acc_No && !isDigitsOnly(form.Acc_No))
      return toast("Account No: digits only.", "warning");

    try {
      const payload = {
        ...form,
        // finalize by trimming here
        Emp_Name: sanitizeLettersOnly(form.Emp_Name),
        Designation: sanitizeLettersOnly(form.Designation),
        Bank_Name: sanitizeLettersOnly(form.Bank_Name),
        branch: sanitizeLettersOnly(form.branch),
        Acc_No: sanitizeDigitsOnly(form.Acc_No),
        Base_Sal: Number(String(form.Base_Sal).replace(/[^\d.]/g, "")) || 0,
      };
      const { data } = await api.post("/finances", payload);
      setRows((p) => [...p, data]);
      setForm({
        EmpId: "",
        Emp_Name: "",
        Designation: "",
        Epf_No: "",
        Base_Sal: "",
        Bank_Name: "",
        branch: "",
        Acc_No: "",
      });
      setAddOpen(false);
      toast("Employee added", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Add failed", "error");
    }
  }

  // ---------- EDIT SAVE ----------
  async function saveEdit() {
    const id = editing?._id;
    if (!id) return toast("Update failed: missing _id", "error");

    if (!editing.EmpId || !editing.Emp_Name || editing.Base_Sal === "")
      return toast("EmpId, Name, Salary required", "warning");

    // validate final (trimmed) values
    if (!isLettersOnly(editing.Emp_Name))
      return toast("Name: letters only (A–Z), no numbers/symbols.", "warning");
    if (editing.Designation && !isLettersOnly(editing.Designation))
      return toast("Designation: letters only (A–Z), no numbers/symbols.", "warning");
    if (editing.Bank_Name && !isLettersOnly(editing.Bank_Name))
      return toast("Bank Name: letters only (A–Z), no numbers/symbols.", "warning");
    if (editing.branch && !isLettersOnly(editing.branch))
      return toast("Branch: letters only (A–Z), no numbers/symbols.", "warning");

    if (editing.Acc_No && !isDigitsOnly(editing.Acc_No))
      return toast("Account No: digits only.", "warning");

    const payload = {
      EmpId: editing.EmpId,
      // finalize by trimming here
      Emp_Name: sanitizeLettersOnly(editing.Emp_Name),
      Designation: sanitizeLettersOnly(editing.Designation),
      Epf_No: editing.Epf_No,
      Base_Sal:
        editing.Base_Sal === ""
          ? ""
          : Number(String(editing.Base_Sal).replace(/[^\d.]/g, "")) || 0,
      Bank_Name: sanitizeLettersOnly(editing.Bank_Name),
      branch: sanitizeLettersOnly(editing.branch),
      Acc_No: sanitizeDigitsOnly(editing.Acc_No),
    };

    try {
      const { data } = await api.put(`/finances/${id}`, payload);
      setRows((prev) => prev.map((r) => (r._id === id ? data : r)));
      setEditing(null);
      toast("Updated", "success");
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Update failed";
      toast(`Update failed: ${msg}`, "error");
    }
  }

  // Delete
  async function remove(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/finances/${id}`);
      setRows((p) => p.filter((r) => r._id !== id));
      toast("Deleted", "warning");
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", "error");
    }
  }

  // Sanitizing on type for Add form fields (LIVE: keep spaces)
  const handleAddChange = (k, val) => {
    let v = val;
    if (k === "Emp_Name" || k === "Designation" || k === "Bank_Name" || k === "branch") {
      v = sanitizeLettersOnlyLive(v); // ← no trim while typing
    }
    if (k === "Acc_No") v = sanitizeDigitsOnly(v);
    if (k === "Base_Sal") v = String(v).replace(/[^\d.]/g, ""); // strips e/E/+/- and any symbols
    setForm((s) => ({ ...s, [k]: v }));
  };

  // Sanitizing on type for Edit form fields (LIVE: keep spaces)
  const handleEditChange = (k, val) => {
    let v = val;
    if (k === "Emp_Name" || k === "Designation" || k === "Bank_Name" || k === "branch") {
      v = sanitizeLettersOnlyLive(v); // ← no trim while typing
    }
    if (k === "Acc_No") v = sanitizeDigitsOnly(v);
    if (k === "Base_Sal") v = String(v).replace(/[^\d.]/g, "");
    setEditing((s) => ({ ...s, [k]: v }));
  };

  return (
    <div className="salarycal page-wrap">
      <Sidebar />
      <div className="container">
        <h1>Employee Salary Management</h1>
        <p>Real-time salary insights and employee payroll management</p>

        <div className="section">
          <div className="nav">
            <NavLink
              to="/finance/employees"
              className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
            >
              👥 Employees
            </NavLink>
            <NavLink
              to="/finance/attendance"
              className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
            >
              📅 Attendance
            </NavLink>
            <NavLink
              to="/finance/advance"
              className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
            >
              💰 Advance
            </NavLink>
            <NavLink
              to="/finance/salary"
              className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
            >
              📊 Salary Management
            </NavLink>
            <NavLink
              to="/finance/transfers"
              className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
            >
              💸 Salary Transfers
            </NavLink>
          </div>

          <h2>Employee Information</h2>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            + Add Employee Details
          </button>

          {addOpen && (
            <div style={{ marginTop: 20 }}>
              <div className="form-grid">
                {[
                  ["EmpId", "Employee ID"],
                  ["Emp_Name", "Name"],
                  ["Designation", "Designation"],
                  ["Epf_No", "EPF No"],
                  ["Base_Sal", "Basic Salary"],
                  ["Bank_Name", "Bank Name"],
                  ["branch", "Branch"],
                  ["Acc_No", "Account No"],
                ].map(([k, label]) => (
                  <div className="form-group" key={k}>
                    <label>{label}</label>
                    <input
                      type={k === "Base_Sal" ? "number" : "text"}
                      value={form[k]}
                      onChange={(e) => handleAddChange(k, e.target.value)}
                      inputMode={k === "Base_Sal" || k === "Acc_No" ? "decimal" : "text"}
                      step={k === "Base_Sal" ? "0.01" : undefined}
                      onKeyDown={
                        k === "Base_Sal" || k === "Acc_No" ? blockExpKeys : undefined
                      }
                      pattern={
                        k === "Emp_Name" || k === "Designation" || k === "Bank_Name" || k === "branch"
                          ? "[A-Za-z ]+"
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
              <button className="btn btn-success" onClick={create}>
                Save Employee
              </button>
              <button
                className="btn btn-warning"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
            </div>
          )}

          <table id="employeeTable" style={{ marginTop: 20 }}>
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
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7">No employees yet</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td>{r.EmpId}</td>
                    <td>{r.Emp_Name}</td>
                    <td>{r.Designation || ""}</td>
                    <td>{r.Epf_No || ""}</td>
                    <td>{rs(r.Base_Sal)}</td>
                    <td>
                      {[r.Bank_Name, r.branch, r.Acc_No].filter(Boolean).join(" - ")}
                    </td>
                    <td className="actions">
                      <button
                        className="btn btn-warning"
                        onClick={() => setEditing(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => remove(r._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div
          className="salary-modal open"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.currentTarget === e.target) setEditing(null);
          }}
        >
          <div className="salary-modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Employee</h3>
              <button
                className="salary-modal-close"
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {[
                "EmpId",
                "Emp_Name",
                "Designation",
                "Epf_No",
                "Base_Sal",
                "Bank_Name",
                "branch",
                "Acc_No",
              ].map((k) => (
                <div className="form-group" key={k}>
                  <label>{k}</label>
                  <input
                    type={k === "Base_Sal" ? "number" : "text"}
                    value={editing?.[k] ?? ""}
                    onChange={(e) => handleEditChange(k, e.target.value)}
                    inputMode={k === "Base_Sal" || k === "Acc_No" ? "decimal" : "text"}
                    step={k === "Base_Sal" ? "0.01" : undefined}
                    onKeyDown={
                      k === "Base_Sal" || k === "Acc_No" ? blockExpKeys : undefined
                    }
                    pattern={
                      k === "Emp_Name" || k === "Designation" || k === "Bank_Name" || k === "branch"
                        ? "[A-Za-z ]+"
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-warning"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
