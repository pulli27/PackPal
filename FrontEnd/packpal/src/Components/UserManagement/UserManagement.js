// src/Components/UserManagement/UserManagement.js
import React, { useMemo, useState, useEffect } from "react";
import "./UserManagement.css";
import Sidebar from "../Sidebaris/Sidebaris";

// ✅ jsPDF + autotable (function import)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function slugify(s = "") {  
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function genEmail(firstName, lastName, domain = "packpal.com") {
  const f = slugify(firstName);
  const l = slugify(lastName);
  if (!f && !l) return "";
  return `${f}.${l}@${domain}`.replace(/^\./, "").replace(/\.@/, "@");
}

function genPassword(first, last) {
  const base = `${first}${last}` || "PackPal";
  const lower = base.toLowerCase().slice(0, 3) || "abc";
  const upper = base.toUpperCase().slice(0, 2) || "PP";
  const num = Math.floor(1000 + Math.random() * 9000);
  const sym = "!@#$%^&*"[Math.floor(Math.random() * 8)];
  const pad = Math.random().toString(36).slice(2, 6);
  return `${upper}${lower}${num}${sym}${pad}`;
}

// 👉 helper: push customers to localStorage so Orders page can read them
function syncCustomersToLocalStorage(users = []) {
  try {
    const customers = users
      .filter(
        (u) => String(u.role || "").toLowerCase() === "customer"
      )
      .map((u) => ({
        _id: u._id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ").trim(),
        email: u.email || "",
        createdAt: u.createdAt || "",
        status: u.status || "active",
      }));
    localStorage.setItem("packpal_customers", JSON.stringify(customers));
  } catch (e) {
    console.warn("Could not write packpal_customers to localStorage:", e);
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Inventory Manager",
    password: "",
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);

  const isLocked = (u) => (u?.role || "").toLowerCase() === "customer";

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users || []);
        } else {
          console.error("Fetch users failed:", data);
        }
      } catch (err) {
        console.error("Network error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // 🔁 Whenever users change, also refresh localStorage copy of customers
  useEffect(() => {
    syncCustomersToLocalStorage(users);
  }, [users]);

  useEffect(() => {
    if (!adding) return;
    const { firstName, lastName } = newUser;
    if (!emailTouched) {
      const email = genEmail(firstName, lastName);
      setNewUser((u) => ({ ...u, email }));
    }
    if (!pwdTouched) {
      const password = genPassword(firstName, lastName);
      setNewUser((u) => ({ ...u, password }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newUser.firstName, newUser.lastName, adding, emailTouched, pwdTouched]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => {
      const hay = (u.firstName + " " + u.lastName + " " + u.email).toLowerCase();
      const byText = !t || hay.includes(t);
      const byRole =
        role === "All" || (u.role || "").toLowerCase() === role.toLowerCase();
      return byText && byRole;
    });
  }, [users, q, role]);

  const today = new Date().toISOString().slice(0, 10);
  const statTotal = users.length;
  const statNew = users.filter((u) => u.createdAt?.slice(0, 10) === today).length;
  const statPending = users.filter((u) => (u.status || "").toLowerCase() === "pending").length;

  function pill(status = "") {
    const s = (status || "").toLowerCase();
    const cls = s === "active" ? "active" : s === "pending" ? "pending" : "suspended";
    return <span className={`pill ${cls}`}>{status}</span>;
  }

  function openEdit(u) {
    if (isLocked(u)) return;
    setEditing({ ...u });
  }
  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (isLocked(editing)) return;
    try {
      const res = await fetch(`${API_BASE}/users/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u._id === data.user._id ? data.user : u)));
        closeEdit();
      } else {
        alert("Update failed: " + (data.message || res.statusText));
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  async function del(id) {
    const user = users.find((u) => u._id === id);
    if (isLocked(user)) return;
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      if (res.ok) setUsers((prev) => prev.filter((u) => u._id !== id));
      else {
        const data = await res.json();
        alert("Delete failed: " + (data.message || res.statusText));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function openAdd() {
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: "Inventory Manager",
      password: "",
    });
    setEmailTouched(false);
    setPwdTouched(false);
    setAdding(true);
  }
  function closeAdd() {
    setAdding(false);
  }
  async function saveAdd(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => [...prev, data.user]);
        closeAdd();
      } else {
        alert("Add failed: " + (data.message || res.statusText));
      }
    } catch (err) {
      console.error("Add error:", err);
    }
  }

  // CSV export (kept)
  function exportCsv() {
    const cols = ["firstName", "lastName", "email", "role", "createdAt", "status"];
    const csv = [cols.join(",")]
      .concat(
        filtered.map((u) =>
          cols.map((k) => `"${(u[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  // ✅ PDF export using autoTable(doc, ...)
  function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Title + meta
    doc.setFontSize(20);
    doc.text("Users", 40, 40);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total: ${filtered.length}`, 40, 76);

    const columns = [
      { header: "First Name", dataKey: "firstName" },
      { header: "Last Name", dataKey: "lastName" },
      { header: "Email", dataKey: "email" },
      { header: "Role", dataKey: "role" },
      { header: "Created", dataKey: "createdAt" },
      { header: "Status", dataKey: "status" },
    ];

    const rows = filtered.map((u) => ({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      role: u.role || "",
      createdAt: (u.createdAt || "").slice(0, 10),
      status: (u.status || "").toLowerCase(),
    }));

    autoTable(doc, {
      columns,
      body: rows,
      startY: 100,
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [53, 79, 197] },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 100,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    doc.save("users.pdf");
  }

  return (
    <div className={`um-wrap ${adding || editing ? "has-modal" : ""}`}>
      <Sidebar />

      <main className="um-main">
        <h1 className="um-title">User Management</h1>

        <section className="um-stats">
          <article className="um-stat">
            <p className="um-stat__label">Total Users</p>
            <div className="um-stat__value">{statTotal}</div>
          </article>
          <article className="um-stat">
            <p className="um-stat__label">New Today</p>
            <div className="um-stat__value">{statNew}</div>
          </article>
          <article className="um-stat">
            <p className="um-stat__label">Pending Approval</p>
            <div className="um-stat__value">{statPending}</div>
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
                onChange={(e) => setQ(e.target.value)}
              />
              <select className="um-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Cart Manager">Cart Manager</option>
                <option value="User Manager">User Manager</option>
                <option value="customer">Customer</option>
              </select>

              <button className="um-btn" onClick={exportCsv}>⬇ Export CSV</button>
              <button className="um-btn" onClick={exportPdf}>📄 Export PDF</button>
              <button className="um-btn primary" onClick={openAdd}>➕ Add Employee</button>
            </div>
          </header>

          {loading ? (
            <p>Loading users…</p>
          ) : (
            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const locked = isLocked(u);
                    return (
                      <tr key={u._id}>
                        <td>{u.firstName}</td>
                        <td>{u.lastName}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.createdAt?.slice(0, 10)}</td>
                        <td>{pill(u.status)}</td>
                        <td>
                          <button
                            className={`um-btn small ${locked ? "disabled" : ""}`}
                            onClick={() => !locked && openEdit(u)}
                            disabled={locked}
                          >
                            ✎ Edit
                          </button>
                          <button
                            className={`um-btn small danger ${locked ? "disabled" : ""}`}
                            onClick={() => !locked && del(u._id)}
                            disabled={locked}
                          >
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add Employee Modal */}
        {adding && (
          <div className="um-modal show" role="dialog" aria-modal="true" aria-labelledby="addTitle">
            <div className="um-modal__dialog">
              <header className="um-modal__head">
                <h3 id="addTitle">Add Employee</h3>
                <button className="um-iconbtn" onClick={closeAdd}>✕</button>
              </header>
              <form className="um-form" onSubmit={saveAdd}>
                <div className="um-field">
                  <label>First Name</label>
                  <input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Last Name</label>
                  <input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => { setNewUser({ ...newUser, email: e.target.value }); setEmailTouched(true); }}
                    onBlur={() => setEmailTouched(true)}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Cart Manager">Cart Manager</option>
                    <option value="User Manager">User Manager</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="um-field">
                  <label>Password</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => { setNewUser({ ...newUser, password: e.target.value }); setPwdTouched(true); }}
                    onBlur={() => setPwdTouched(true)}
                    required
                  />
                </div>
                <footer className="um-modal__foot">
                  <button type="button" className="um-btn ghost" onClick={closeAdd}>
                    Cancel
                  </button>
                  <button type="submit" className="um-btn primary">
                    Add
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editing && (
          <div className="um-modal show" role="dialog" aria-modal="true" aria-labelledby="editTitle">
            <div className="um-modal__dialog">
              <header className="um-modal__head">
                <h3 id="editTitle">Edit User</h3>
                <button className="um-iconbtn" onClick={closeEdit}>✕</button>
              </header>
              <form className="um-form" onSubmit={saveEdit}>
                <div className="um-field">
                  <label>First Name</label>
                  <input
                    value={editing.firstName}
                    onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Last Name</label>
                  <input
                    value={editing.lastName}
                    onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    required
                  />
                </div>
                <div className="um-field">
                  <label>Role</label>
                  <select
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                    disabled={isLocked(editing)}
                  >
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Cart Manager">Cart Manager</option>
                    <option value="User Manager">User Manager</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="um-field">
                  <label>Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    disabled={isLocked(editing)}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <footer className="um-modal__foot">
                  <button type="button" className="um-btn ghost" onClick={closeEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="um-btn primary" disabled={isLocked(editing)}>
                    Save
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
