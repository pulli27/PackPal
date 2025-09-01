import React, { useEffect, useRef } from "react";
import "./Udashboard.css";
import Sidebar from "../Sidebar/Sidebar";

function animateTo(node, end) {
  if (!node) return;
  const start = Number(node.dataset.val || 0);
  const target = Number(end || 0);
  const dur = 800;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const val = Math.round(start + (target - start) * p);
    node.textContent = Number(val).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else node.dataset.val = target;
  };
  requestAnimationFrame(tick);
}

export default function Udashboard({ stats }) {
  const revRef = useRef(null);
  const ordRef = useRef(null);
  const usrRef = useRef(null);

  useEffect(() => {
    const { revenue = 0, orders = 0, users = 0 } = stats || {};
    animateTo(revRef.current, revenue);
    animateTo(ordRef.current, orders);
    animateTo(usrRef.current, users);
  }, [stats]);

  return (
    <>
      {/* 👉 render the sidebar */}
      <Sidebar />

      {/* content area stays shifted by 280px via CSS */}
      <div className="wrap">
        <main className="main">
          <h1 className="title">Dashboard</h1>

          <section className="cards">
            <article className="card">
              <p className="label">Revenue (LKR)</p>
              <div className="number" ref={revRef} data-val="0">0</div>
            </article>

            <article className="card">
              <p className="label">Orders</p>
              <div className="number" ref={ordRef} data-val="0">0</div>
            </article>

            <article className="card">
              <p className="label">Active Users</p>
              <div className="number" ref={usrRef} data-val="0">0</div>
            </article>

            <article className="banner">
              <span className="emoji">💡</span>
              <p>Welcome! Use the sidebar to navigate to each section.</p>
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
