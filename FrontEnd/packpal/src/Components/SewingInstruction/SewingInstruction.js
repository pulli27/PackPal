import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SewingInstruction.css";
import Sidebar from "../Sidebar/Sidebar";
import { api } from "../../lib/api"; // ⬅️ use your shared axios client

export default function SewingInstruction() {
  // ---------- utilities ----------
  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD for <input type="date">
    } catch {
      return String(d).slice(0, 10);
    }
  };

  // ---------- state ----------
  const [items, setItems] = useState([]);        // now from server
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // { id } or null
  const [viewItem, setViewItem] = useState(null);

  const formRef = useRef(null);
  const viewRef = useRef(null);

  const [form, setForm] = useState({
    bag: "",
    details: "",
    person: "",
    deadline: "",
    priority: "High",
    status: "In Progress",
  });

  // dialogs open/close
  useEffect(() => {
    if (!formRef.current) return;
    if (editing) formRef.current.showModal();
    else if (formRef.current.open) formRef.current.close();
  }, [editing]);

  useEffect(() => {
    if (!viewRef.current) return;
    if (viewItem) viewRef.current.showModal();
    else if (viewRef.current.open) viewRef.current.close();
  }, [viewItem]);

  // ---------- load from server on mount ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/sewing-instructions");
        // Map server documents to UI structure (use _id as id)
        const mapped = (data.items || []).map((i) => ({
          id: i._id,
          bag: i.bag,
          details: i.details || "",
          person: i.person,
          deadline: formatDate(i.deadline),
          priority: i.priority,
          status: i.status,
        }));
        if (mounted) setItems(mapped);
      } catch (e) {
        console.error(e);
        alert("Failed to load sewing instructions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // ---------- helpers ----------
  const resetForm = () =>
    setForm({
      bag: "",
      details: "",
      person: "",
      deadline: "",
      priority: "High",
      status: "In Progress",
    });

  const openCreate = () => { resetForm(); setEditing({ id: null }); };
  const openEdit = (row) => {
    setForm({
      bag: row.bag,
      details: row.details || "",
      person: row.person,
      deadline: row.deadline,
      priority: row.priority,
      status: row.status,
    });
    setEditing({ id: row.id });
  };
  const openView = (row) => setViewItem(row);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this instruction?")) return;
    try {
      await api.delete(`/api/sewing-instructions/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.id.replace("f_", "")]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bag || !form.person || !form.deadline) {
      alert("Bag, Person and Deadline are required");
      return;
    }

    // Payload in the same shape as backend expects
    const payload = {
      bag: form.bag,
      details: form.details || "",
      person: form.person,
      deadline: form.deadline, // "YYYY-MM-DD"
      priority: form.priority,
      status: form.status,
    };

    try {
      if (editing?.id) {
        // update
        const { data } = await api.put(`/api/sewing-instructions/${editing.id}`, payload);
        const updated = data.after;
        setItems((prev) =>
          prev.map((x) =>
            x.id === editing.id
              ? {
                  id: updated._id,
                  bag: updated.bag,
                  details: updated.details || "",
                  person: updated.person,
                  deadline: formatDate(updated.deadline),
                  priority: updated.priority,
                  status: updated.status,
                }
              : x
          )
        );
      } else {
        // create
        const { data } = await api.post("/api/sewing-instructions", payload);
        const created = data.item;
        setItems((prev) => [
          {
            id: created._id,
            bag: created.bag,
            details: created.details || "",
            person: created.person,
            deadline: formatDate(created.deadline),
            priority: created.priority,
            status: created.status,
          },
          ...prev,
        ]);
      }
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };

  const BadgePriority = ({ p }) => {
    const cls = p === "High" ? "high" : p === "Medium" ? "medium" : "low";
    return <span className={`badge ${cls}`}>{p}</span>;
  };
  const BadgeStatus = ({ s }) => {
    const map = { "In Progress": "info", Pending: "pending", "Quality Check": "qc", Done: "low" };
    return <span className={`badge ${map[s] || "pending"}`}>{s}</span>;
  };

  const Eye = () => (
    <svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>
  );
  const Pen = () => (
    <svg viewBox="0 0 24 24"><path d="M3 21l3-1 14-14-2-2L4 18l-1 3Z" /></svg>
  );
  const Trash = () => (
    <svg viewBox="0 0 24 24"><path d="M3 6h18M9 6V4h6v2M7 6l1 14h8l1-14" /></svg>
  );

  if (loading) return <div><Sidebar /><div className="container">Loading…</div></div>;

  return (
    <div>
      <Sidebar/>
      <header className="topbar">
        <h1 className="page-title">Sewing Instructions</h1>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={()=>{
            // simple CSV client-side export remains the same
            const header = ["Bag Type","Sewing Person","Deadline","Priority","Status","Details"];
            const rows = (items||[]).map(i=>[i.bag,i.person,i.deadline,i.priority,i.status,i.details||""]);
            const toCSV = rows => rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
            const blob = new Blob([toCSV([header, ...rows])],{type:"text/csv;charset=utf-8;"});
            const url = URL.createObjectURL(blob); const a = document.createElement("a");
            a.href=url; a.download="sewing_instructions.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
          }}>
            <span className="icon">📄</span> Generate Report
          </button>
          <button className="avatar" title="Profile">👤</button>
        </div>
      </header>

      <main className="container">
        <section className="section-head">
          <h2>Sewing Instructions</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            <span className="icon">➕</span> Add Instruction
          </button>
        </section>

        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>BAG TYPE</th>
                  <th>SEWING PERSON</th>
                  <th>DEADLINE</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <p className="bag-title">{i.bag}</p>
                      <p className="bag-sub">{i.details}</p>
                    </td>
                    <td>{i.person}</td>
                    <td className="nowrap">{i.deadline}</td>
                    <td><BadgePriority p={i.priority} /></td>
                    <td><BadgeStatus s={i.status} /></td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn icon-view" title="View" onClick={() => setViewItem(i)}><Eye /></button>
                        <button className="icon-btn icon-edit" title="Edit" onClick={() => openEdit(i)}><Pen /></button>
                        <button className="icon-btn icon-del" title="Delete" onClick={() => handleDelete(i.id)}><Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:"center", padding:"16px"}}>No instructions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Create/Edit dialog */}
      <dialog ref={formRef} className="modal" onClose={() => setEditing(null)}>
        <form className="modal-card" onSubmit={handleSubmit} method="dialog">
          <h3>{editing?.id ? "Edit Instruction" : "Add Instruction"}</h3>
          <div className="grid">
            <label>
              Bag Type
              <input id="f_bag" type="text" value={form.bag} onChange={handleChange} required />
            </label>
            <label>
              Sewing Person
              <input id="f_person" type="text" value={form.person} onChange={handleChange} required />
            </label>
            <label>
              Deadline
              <input id="f_deadline" type="date" value={form.deadline} onChange={handleChange} required />
            </label>
            <label>
              Priority
              <select id="f_priority" value={form.priority} onChange={handleChange} required>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </label>
            <label className="span-2">
              Details
              <textarea id="f_details" rows="3" value={form.details} onChange={handleChange} placeholder="materials, size, notes" />
            </label>
            <label>
              Status
              <select id="f_status" value={form.status} onChange={handleChange} required>
                <option>In Progress</option><option>Pending</option><option>Quality Check</option><option>Done</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => { formRef.current?.close(); setEditing(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </dialog>

      {/* View dialog */}
      <dialog ref={viewRef} className="modal" onClose={() => setViewItem(null)}>
        <div className="modal-card">
          <h3>Instruction</h3>
          {viewItem && (
            <div className="view-body">
              <p><strong>Bag:</strong> {viewItem.bag}</p>
              <p><strong>Details:</strong> {viewItem.details || "-"}</p>
              <p><strong>Person:</strong> {viewItem.person}</p>
              <p><strong>Deadline:</strong> {viewItem.deadline}</p>
              <p><strong>Priority:</strong> {viewItem.priority}</p>
              <p><strong>Status:</strong> {viewItem.status}</p>
            </div>
          )}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => { viewRef.current?.close(); setViewItem(null); }}>Close</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
