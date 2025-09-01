import React, { useMemo, useState } from "react";
import "./UserManagement.css";
import Sidebar from "../Sidebar/Sidebar";


const initialUsers = [
  { id:"1", firstName:"Isuri",   lastName:"Perera",    email:"isuri@paypal.com",   role:"Admin",   joinDate:"2025-08-27", lastLogin:"2025-08-29", status:"Active" },
  { id:"2", firstName:"Nimal",   lastName:"Fernando",  email:"nimal@shop.lk",      role:"Manager", joinDate:"2025-08-29", lastLogin:"2025-08-29", status:"Active" },
  { id:"3", firstName:"Sajith",  lastName:"Silva",     email:"sajith@bags.lk",     role:"Staff",   joinDate:"2025-08-28", lastLogin:"2025-08-28", status:"Pending" },
  { id:"4", firstName:"Tharushi",lastName:"Dias",      email:"tharu@packpal.com",  role:"Staff",   joinDate:"2025-08-20", lastLogin:"2025-08-26", status:"Suspended" },
  { id:"5", firstName:"Anjana",  lastName:"Kumara",    email:"anjana@packpal.com", role:"Manager", joinDate:"2025-08-17", lastLogin:"2025-08-27", status:"Active" },
  { id:"6", firstName:"Dinithi", lastName:"Senanayake",email:"dini@packpal.com",   role:"Staff",   joinDate:"2025-08-29", lastLogin:"2025-08-29", status:"Pending" },
  { id:"7", firstName:"Ruwan",   lastName:"Jayasinghe",email:"ruwan@packpal.com",  role:"Admin",   joinDate:"2025-08-01", lastLogin:"2025-08-26", status:"Active" },
  { id:"8", firstName:"Savindi", lastName:"Gunasekara",email:"savindi@packpal.com",role:"Staff",   joinDate:"2025-08-10", lastLogin:"2025-08-25", status:"Active" }
];

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [editing, setEditing] = useState(null); // { ...user } or null

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter(u => {
      const hay = (u.firstName + " " + u.lastName + " " + u.email).toLowerCase();
      const byText = !t || hay.includes(t);
      const byRole = role === "All" || u.role === role;
      return byText && byRole;
    });
  }, [users, q, role]);

  // stats
  const today = new Date().toISOString().slice(0,10);
  const statTotal = users.length;
  const statNew = users.filter(u => u.joinDate === today).length;
  const statPending = users.filter(u => u.status === "Pending").length;

  function pill(status) {
    const cls = status === "Active" ? "active" : status === "Pending" ? "pending" : "suspended";
    return <span className={`pill ${cls}`}>{status}</span>;
  }

  function openEdit(u)  { setEditing({...u}); }
  function closeEdit()  { setEditing(null); }
  function saveEdit(e) {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === editing.id ? editing : u));
    closeEdit();
  }
  function del(id) {
    if (!window.confirm("Delete this user?")) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  }
  function exportCsv() {
    const cols = ["firstName","lastName","email","role","joinDate","lastLogin","status"];
    const csv = [cols.join(",")]
      .concat(filtered.map(u => cols.map(k => `"${(u[k] ?? "").toString().replace(/"/g,'""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "users.csv"; document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); a.remove();
  }

  return (
    <div className="um-wrap">
        <Sidebar/>
        
      <main className="um-main">
        <h1 className="um-title">User Management</h1>

        <section className="um-stats">
          <article className="um-stat">
            <p className="um-stat__label">Total Users</p>
            <div className="um-stat__value" aria-live="polite">{statTotal}</div>
          </article>
          <article className="um-stat">
            <p className="um-stat__label">New Today</p>
            <div className="um-stat__value" aria-live="polite">{statNew}</div>
          </article>
          <article className="um-stat">
            <p className="um-stat__label">Pending Approval</p>
            <div className="um-stat__value" aria-live="polite">{statPending}</div>
          </article>
        </section>

        <section className="um-card">
          <header className="um-card__head">
            <h2 className="um-card__title">All Users</h2>
            <div className="um-tools">
              <input
                className="um-input"
                type="search"
                placeholder="Search users by name, email..."
                value={q}
                onChange={(e)=>setQ(e.target.value)}
              />
              <select
                className="um-select"
                value={role}
                onChange={(e)=>setRole(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
              <button className="um-btn" onClick={exportCsv}>⬇ Export</button>
            </div>
          </header>

          <div className="um-table-wrap">
            <table className="um-table" aria-describedby="tableDesc">
              <caption id="tableDesc" className="sr-only">List of users with actions</caption>
              <thead>
                <tr>
                  <th>First Name</th><th>Last Name</th><th>Email</th>
                  <th>Role</th><th>Join Date</th><th>Last Login</th>
                  <th>Status</th><th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>{u.firstName}</td>
                    <td>{u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.joinDate}</td>
                    <td>{u.lastLogin}</td>
                    <td>{pill(u.status)}</td>
                    <td>
                      <button className="um-btn small" onClick={()=>openEdit(u)}>✎ Edit</button>
                      <button className="um-btn small danger" onClick={()=>del(u.id)}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {editing && (
          <div className="um-modal show" role="dialog" aria-modal="true" aria-labelledby="editTitle">
            <div className="um-modal__dialog">
              <header className="um-modal__head">
                <h3 id="editTitle">Edit User</h3>
                <button className="um-iconbtn" onClick={closeEdit} aria-label="Close">✕</button>
              </header>

              <form className="um-form" onSubmit={saveEdit}>
                <div className="um-field">
                  <label>First Name</label>
                  <input value={editing.firstName} onChange={e=>setEditing({...editing, firstName:e.target.value})} required />
                </div>
                <div className="um-field">
                  <label>Last Name</label>
                  <input value={editing.lastName} onChange={e=>setEditing({...editing, lastName:e.target.value})} required />
                </div>
                <div className="um-field">
                  <label>Email</label>
                  <input type="email" value={editing.email} onChange={e=>setEditing({...editing, email:e.target.value})} required />
                </div>
                <div className="um-field">
                  <label>Role</label>
                  <select value={editing.role} onChange={e=>setEditing({...editing, role:e.target.value})}>
                    <option>Admin</option><option>Manager</option><option>Staff</option>
                  </select>
                </div>
                <div className="um-field">
                  <label>Status</label>
                  <select value={editing.status} onChange={e=>setEditing({...editing, status:e.target.value})}>
                    <option>Active</option><option>Pending</option><option>Suspended</option>
                  </select>
                </div>
                <footer className="um-modal__foot">
                  <button type="button" className="um-btn ghost" onClick={closeEdit}>Cancel</button>
                  <button type="submit" className="um-btn primary">Save</button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
