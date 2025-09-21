import React, { useEffect, useState } from "react";
import "./Attendance.css";
import Sidebar from "../Sidebar/Sidebarsanu";
import { NavLink } from "react-router-dom";
import { api } from "../../lib/api";

const toast = (m, t = "info") => alert(`${t.toUpperCase()}: ${m}`);

// helpers for 0–31 validation
const clamp0to31 = (v) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 31) return 31;
  return n;
};
const anyOver31 = (obj) =>
  ["workingDays", "leaveAllowed", "noPayLeave", "leaveTaken"].some(
    (k) => Number(obj?.[k] ?? 0) > 31
  );

export default function Attendance() {
  const [employees, setEmployees] = useState([]);   // [{ EmpId, Emp_Name }]
  const [empLoading, setEmpLoading] = useState(true);

  const [rows, setRows] = useState([]);             // attendance rows from DB
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    empId: "", period: "", workingDays: 0, overtimeHrs: 0,
    leaveAllowed: 0, noPayLeave: 0, leaveTaken: 0, other: ""
  });

  const [editing, setEditing] = useState(null);

  async function loadEmployees() {
    try {
      setEmpLoading(true);
      // use the same endpoint used by Advance: /finances/min-list
      const { data } = await api.get("/finances/min-list");
      setEmployees(data.employees || []);
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to load employees (GET /finances/min-list). Check backend & CORS.", "error");
    } finally {
      setEmpLoading(false);
    }
  }

  async function loadAttendance() {
    try {
      setLoading(true);
      const { data } = await api.get("/attendance?includeEmployee=1");
      setRows(data.attendance || []);
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEmployees(); loadAttendance(); }, []);

  // CREATE
  async function create() {
    if (!form.empId || !form.period)
      return toast("Employee and period are required", "warning");

    // enforce <= 31 for specific fields
    if (anyOver31(form)) {
      return toast("Working Days, Leave Allowed, No Pay Leave, and Leave Taken cannot exceed 31.", "warning");
    }

    try {
      const payload = {
        ...form,
        workingDays: Number(form.workingDays || 0),
        overtimeHrs: Number(form.overtimeHrs || 0),
        leaveAllowed: Number(form.leaveAllowed || 0),
        noPayLeave: Number(form.noPayLeave || 0),
        leaveTaken: Number(form.leaveTaken || 0),
      };
      const { data } = await api.post("/attendance", payload);
      // append to end so newest is last
      setRows((p) => [...p, data]);
      setAddOpen(false);
      setForm({ empId: "", period: "", workingDays: 0, overtimeHrs: 0, leaveAllowed: 0, noPayLeave: 0, leaveTaken: 0, other: "" });
      // reload to include joined employee name if backend returns minimal doc
      try { await loadAttendance(); } catch {}
      toast("Attendance added", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Add failed", "error");
    }
  }

  // UPDATE
  async function saveEdit() {
    const id = editing?._id;
    if (!id) return toast("Missing _id", "error");

    // enforce <= 31 for specific fields on edit
    if (anyOver31(editing)) {
      return toast("Working Days, Leave Allowed, No Pay Leave, and Leave Taken cannot exceed 31.", "warning");
    }

    try {
      const payload = {
        empId: editing.empId,
        period: editing.period,
        workingDays: Number(editing.workingDays || 0),
        overtimeHrs: Number(editing.overtimeHrs || 0),
        leaveAllowed: Number(editing.leaveAllowed || 0),
        noPayLeave: Number(editing.noPayLeave || 0),
        leaveTaken: Number(editing.leaveTaken || 0),
        other: editing.other || "",
      };
      const { data } = await api.put(`/attendance/${id}`, payload);
      setRows((p) => p.map((r) => (r._id === id ? data : r)));
      setEditing(null);
      try { await loadAttendance(); } catch {}
      toast("Updated", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Update failed", "error");
    }
  }

  // DELETE
  async function remove(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/attendance/${id}`);
      setRows((p) => p.filter((r) => r._id !== id));
      toast("Deleted", "warning");
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", "error");
    }
  }

  // onChange helpers for add/edit numeric fields to clamp 0–31 live
  const onAddNum = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: clamp0to31(e.target.value) }));
  const onEditNum = (key) => (e) =>
    setEditing((s) => ({ ...s, [key]: clamp0to31(e.target.value) }));

  return (
    <div className="Attendance page-wrap">
      <Sidebar />
      <div className="container">
        <h1>Employee Salary Management</h1>
        <p>Real-time salary insights and employee payroll management</p>

        <div className="section">
          <div className="nav">
            <NavLink to="/finance/employees"  className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>👥 Employees</NavLink>
            <NavLink to="/finance/attendance" className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>📅 Attendance</NavLink>
            <NavLink to="/finance/advance"    className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>💰 Advance</NavLink>
            <NavLink to="/finance/salary"     className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>📊 Salary Management</NavLink>
            <NavLink to="/finance/transfers"  className={({isActive}) => `tab-btn ${isActive ? "active" : ""}`}>💸 Salary Transfers</NavLink>
          </div>

          <h2>Payroll Attendance</h2>

          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            + Add Attendance Record
          </button>

          {addOpen && (
            <div style={{ marginTop: 20 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee</label>
                  <select
                    value={form.empId}
                    onChange={(e) => setForm((s) => ({ ...s, empId: e.target.value }))}
                    disabled={empLoading}
                  >
                    <option value="">
                      {empLoading ? "Loading employees…" : "Select Employee"}
                    </option>
                    {!empLoading &&
                      employees.map((e) => (
                        <option key={e.EmpId} value={e.EmpId}>
                          {e.EmpId} - {e.Emp_Name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Period</label>
                  <input
                    type="month"
                    value={form.period}
                    onChange={(e) => setForm((s) => ({ ...s, period: e.target.value }))}
                  />
                </div>

                <div className="form-group"><label>Working Days</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={form.workingDays}
                    onChange={onAddNum("workingDays")}
                  />
                </div>
                <div className="form-group"><label>Overtime Hours</label>
                  <input
                    type="number"
                    value={form.overtimeHrs}
                    onChange={(e) => setForm((s) => ({ ...s, overtimeHrs: e.target.value }))}
                  />
                </div>
                <div className="form-group"><label>Leave Allowed</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={form.leaveAllowed}
                    onChange={onAddNum("leaveAllowed")}
                  />
                </div>
                <div className="form-group"><label>No Pay Leave</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={form.noPayLeave}
                    onChange={onAddNum("noPayLeave")}
                  />
                </div>
                <div className="form-group"><label>Leave Taken</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={form.leaveTaken}
                    onChange={onAddNum("leaveTaken")}
                  />
                </div>
                <div className="form-group"><label>Other</label>
                  <input
                    type="text"
                    value={form.other}
                    onChange={(e) => setForm((s) => ({ ...s, other: e.target.value }))}
                  />
                </div>
              </div>

              <button className="btn btn-success" onClick={create} disabled={empLoading}>Save Attendance</button>
              <button className="btn btn-warning" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          )}

          <table id="attendanceTable" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Employee</th>
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
            <tbody>
              {loading ? (
                <tr><td colSpan="9">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="9">No attendance yet</td></tr>
              ) : rows.map((r) => (
                <tr key={r._id}>
                  <td>{r.employeeName ? `${r.empId} - ${r.employeeName}` : r.empId}</td>
                  <td>{r.period}</td>
                  <td>{r.workingDays || 0}</td>
                  <td>{r.overtimeHrs || 0}</td>
                  <td>{r.leaveAllowed || 0}</td>
                  <td>{r.noPayLeave || 0}</td>
                  <td>{r.leaveTaken || 0}</td>
                  <td>{r.other || ""}</td>
                  <td className="actions">
                    <button className="btn btn-warning" onClick={() => setEditing(r)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => remove(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          className="att-modal"
          onClick={(e) => { if (e.currentTarget === e.target) setEditing(null); }}
        >
          <div className="att-modal-content">
            <button className="att-modal-close" onClick={() => setEditing(null)}>×</button>
            <h2>Edit Attendance</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Employee</label>
                <select
                  value={editing.empId || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, empId: e.target.value }))}
                  disabled={empLoading}
                >
                  <option value="">
                    {empLoading ? "Loading employees…" : "Select Employee"}
                  </option>
                  {!empLoading &&
                    employees.map((e) => (
                      <option key={e.EmpId} value={e.EmpId}>
                        {e.EmpId} - {e.Emp_Name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Period</label>
                <input
                  type="month"
                  value={editing.period || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, period: e.target.value }))}
                />
              </div>

              <div className="form-group"><label>Working Days</label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={editing.workingDays ?? 0}
                  onChange={onEditNum("workingDays")}
                />
              </div>
              <div className="form-group"><label>Overtime Hours</label>
                <input
                  type="number"
                  value={editing.overtimeHrs ?? 0}
                  onChange={(e) => setEditing((s) => ({ ...s, overtimeHrs: e.target.value }))}
                />
              </div>
              <div className="form-group"><label>Leave Allowed</label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={editing.leaveAllowed ?? 0}
                  onChange={onEditNum("leaveAllowed")}
                />
              </div>
              <div className="form-group"><label>No Pay Leave</label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={editing.noPayLeave ?? 0}
                  onChange={onEditNum("noPayLeave")}
                />
              </div>
              <div className="form-group"><label>Leave Taken</label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={editing.leaveTaken ?? 0}
                  onChange={onEditNum("leaveTaken")}
                />
              </div>
              <div className="form-group"><label>Other</label>
                <input
                  type="text"
                  value={editing.other || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, other: e.target.value }))}
                />
              </div>
            </div>

            <button className="btn btn-success" onClick={saveEdit} disabled={empLoading}>Save Changes</button>
            <button className="btn btn-warning" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
