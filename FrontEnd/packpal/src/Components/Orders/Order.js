import React, { useMemo, useState } from "react";
import "./Order.css";
import Sidebar from "../Sidebar/Sidebar";

/* ✅ Put constants at the top (not inside JSX) */
const ORDERS = [
  { id: 10412, customer: "Isuri Perera",   status: "Completed",  total: 24700, date: "Aug 05" },
  { id: 10411, customer: "Nimal Fernando", status: "Processing", total: 12980, date: "Aug 05" },
  { id: 10410, customer: "Savindi Guru",   status: "Cancelled",  total: 12450, date: "Aug 04" },
];

const money = (n) => "LKR " + Number(n ?? 0).toLocaleString("en-LK");
const statusClass = (s = "") => {
  const k = s.toLowerCase();
  if (k === "completed") return "completed";
  if (k === "processing") return "processing";
  if (k === "cancelled" || k === "canceled") return "cancelled";
  return "";
};

export default function Orders() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ORDERS;
    return ORDERS.filter((o) => {
      const id = String(o.id).toLowerCase();
      const name = (o.customer || "").toLowerCase();
      return id.includes(query) || name.includes(query);
    });
  }, [q]);

  return (
    <div className="orders-page">
        <Sidebar/>
      <h1 className="page-title">Orders</h1>

      {/* Stats */}
      <section className="stats">
        <article className="stat-card">
          <p className="stat-label">New Orders</p>
          <p className="stat-value" id="newCount">23</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Processing</p>
          <p className="stat-value" id="processingCount">12</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Completed</p>
          <p className="stat-value" id="completedCount">1,241</p>
        </article>
      </section>

      {/* Table */}
      <section className="table-card" aria-labelledby="recentOrdersHeading">
        <div className="table-head">
          <h2 id="recentOrdersHeading">Recent Orders</h2>
          <label className="search">
            <input
              type="search"
              placeholder="Search order # or customer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={5}>No orders found</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="order-id">#{o.id}</td>
                    <td>{o.customer}</td>
                    <td>
                      <span className={`status ${statusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{money(o.total)}</td>
                    <td>{o.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
