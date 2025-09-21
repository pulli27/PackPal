// src/Components/PurchaseItems/PurchaseItems.js
import React, { useEffect, useRef } from "react"; 
import Sidebarpul from "../Sidebar/Sidebarpul";
import "./PurchaseItems.css";
import { purchases } from "../../lib/purchases";

/**
 * NOTE: We REMOVED the static imports of 'jspdf' and 'jspdf-autotable'.
 * They are now lazy-loaded inside exportPDF() so your app boots even if users
 * never click “Export Orders (PDF)”. Make sure you’ve run:
 *   npm i jspdf jspdf-autotable
 */

export default function PurchaseItems() {
  const settingsRef = useRef({ currency: "USD", autoApprove: "off" });
  const suppliersRef = useRef([
    { name: "Premium Leather Co." },
    { name: "Canvas Works Ltd." },
    { name: "Artisan Crafts Inc." },
    { name: "Modern Bag Solutions" },
    { name: "Ceylon Leather Crafts (Pvt) Ltd." },
    { name: "Precision Accessories" },
  ]);
  const purchaseOrdersRef = useRef([]);

  useEffect(() => {
    // ---------- helpers ----------
    const $ = (sel) => document.querySelector(sel);
    const $all = (sel) => Array.from(document.querySelectorAll(sel));
    const fmt = (d) =>
      new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    const toast = (msg) => {
      const el = $("#toast");
      if (!el) return;
      el.textContent = msg;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 1400);
    };

    const refreshMetrics = () => {
      const list = purchaseOrdersRef.current;
      const pending = list.filter((o) => o.status === "pending").length;
      const completed = list.filter((o) =>
        ["approved", "delivered"].includes(o.status)
      ).length;
      const cancelled = list.filter((o) => o.status === "cancelled").length;

      const setText = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      setText("poPending", pending);
      setText("poCompleted", completed);
      setText("poCancelled", cancelled);

      const dateEl = document.getElementById("poDate");
      if (dateEl) dateEl.textContent = "Last Updated: " + new Date().toLocaleString();
    };

    const renderTable = () => {
      const tbody = document.getElementById("purchaseTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";
      purchaseOrdersRef.current.forEach((o) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${o.id}</strong></td>
          <td>${o.supplier}</td>
          <td>${o.items}</td>
          <td>${fmt(o.orderDate)}</td>
          <td>${o.deliveryDate ? fmt(o.deliveryDate) : "-"}</td>
          <td><span class="status ${o.status}">${o.status}</span></td>
          <td class="actions">
            <button class="btn btn-ed" data-action="view" data-id="${o.id}">View</button>
            ${
              o.status === "pending"
                ? `<button class="btn btn-suc" data-action="approve" data-id="${o.id}">Approve</button>`
                : ""
            }
            <button class="btn btn-sec" data-action="edit" data-id="${o.id}">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${o.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    };

    async function loadOrders() {
      try {
        const res = await purchases.list();
        const rows = Array.isArray(res?.data?.orders) ? res.data.orders : [];
        purchaseOrdersRef.current = rows.map((o) => ({
          id: o.id,
          supplier: o.supplier,
          items: o.items || "",
          orderDate: o.orderDate
            ? String(o.orderDate).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          deliveryDate: o.deliveryDate ? String(o.deliveryDate).slice(0, 10) : "",
          status: o.status || "pending",
          priority: o.priority || "normal",
          notes: o.notes || "",
        }));
        renderTable();
        refreshMetrics();
      } catch (e) {
        console.warn("Failed to load purchases:", e?.message || e);
      }
    }

    // ---------- PDF export (now lazy-loaded) ----------
    const exportPDF = async () => {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF("p", "pt");
      const orders = purchaseOrdersRef.current;

      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("PackPal — Purchase Orders Summary", 40, 40);

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(40, 48, 555, 48);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text("Generated on " + new Date().toLocaleString(), 40, 66);

      const total = orders.length;
      const pending = orders.filter((o) => o.status === "pending").length;
      const approved = orders.filter((o) => o.status === "approved").length;
      const delivered = orders.filter((o) => o.status === "delivered").length;

      const metrics = [
        { label: "Total Orders", value: total },
        { label: "Pending", value: pending },
        { label: "Approved", value: approved },
        { label: "Delivered", value: delivered },
      ];

      const startX = 40, startY = 90, cardW = 160, cardH = 70, gap = 15;
      let x = startX, y = startY;

      metrics.forEach((m, i) => {
        doc.setDrawColor(225);
        doc.setFillColor(246, 248, 252);
        doc.roundedRect(x, y, cardW, cardH, 10, 10, "F");

        doc.setTextColor(0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(String(m.value), x + cardW / 2, y + 28, { align: "center" });

        doc.setTextColor(110);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(m.label, x + cardW / 2, y + 48, { align: "center" });

        x += cardW + gap;
        if ((i + 1) % 3 === 0) { x = startX; y += cardH + gap; }
      });

      let tableStartY = y + cardH + 25;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33);
      doc.text("Orders", 60, tableStartY);

      const tableData = orders.map((o) => [
        o.id,
        o.supplier,
        o.items,
        o.orderDate,
        o.deliveryDate || "-",
        o.status.charAt(0).toUpperCase() + o.status.slice(1),
      ]);

      autoTable(doc, {
        head: [["ORDER ID", "SUPPLIER", "ITEMS", "ORDER DATE", "DELIVERY", "STATUS"]],
        body: tableData,
        startY: tableStartY + 10,
        styles: { fontSize: 11, cellPadding: 9, textColor: 30 },
        headStyles: {
          fillColor: [237, 242, 255],
          textColor: 30,
          lineWidth: 0.5,
          lineColor: [203, 213, 225],
          fontStyle: "bold",
        },
        bodyStyles: { lineColor: [229, 231, 235], lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 },
          2: { cellWidth: 150 },
          3: { cellWidth: 70 },
          4: { cellWidth: 70 },
          5: { cellWidth: 65 },
        },
        didDrawPage: () => {
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(str, 555, 820, { align: "right" });
        },
      });

      doc.save("PurchaseOrdersSummary.pdf");
    };

    // ---------- modal helpers ----------
    const openCreateModal = () => {
      const sel = document.getElementById("modalSupplier");
      if (sel) {
        sel.innerHTML =
          '<option value="">Select Supplier</option>' +
          suppliersRef.current.map((s) => `<option>${s.name}</option>`).join("");
      }
      document.getElementById("poEditId").value = "";
      document.getElementById("purchaseForm").reset();
      document.getElementById("poModalTitle").textContent = "Create New Purchase Order";
      document.getElementById("poSubmitBtn").textContent = "Create Order";
      const d = new Date();
      d.setDate(d.getDate() + 14);
      document.getElementById("modalDelivery").value = d.toISOString().split("T")[0];
      document.getElementById("purchaseModal").classList.add("show");
      document.getElementById("purchaseModal").setAttribute("aria-hidden", "false");
    };

    const openEditModal = (order) => {
      const sel = document.getElementById("modalSupplier");
      if (sel) {
        sel.innerHTML =
          '<option value="">Select Supplier</option>' +
          suppliersRef.current.map((s) => `<option>${s.name}</option>`).join("");
      }
      document.getElementById("poEditId").value = order.id;
      document.getElementById("modalSupplier").value = order.supplier;
      document.getElementById("modalItems").value = order.items;
      document.getElementById("modalDelivery").value = order.deliveryDate || "";
      document.getElementById("modalPriority").value = order.priority || "normal";
      document.getElementById("poModalTitle").textContent = "Edit Purchase Order";
      document.getElementById("poSubmitBtn").textContent = "Update";
      document.getElementById("purchaseModal").classList.add("show");
      document.getElementById("purchaseModal").setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      document.getElementById("purchaseModal").classList.remove("show");
      document.getElementById("purchaseModal").setAttribute("aria-hidden", "true");
    };

    const viewOrder = (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      alert(`Order Details:
ID: ${o.id}
Supplier: ${o.supplier}
Items: ${o.items}
Status: ${o.status}
Order Date: ${fmt(o.orderDate)}
Delivery: ${o.deliveryDate ? fmt(o.deliveryDate) : "-"}`);
    };

    const approveOrder = async (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      try {
        if (
          settingsRef.current.autoApprove === "on" ||
          window.confirm("Approve this order?")
        ) {
          o.status = "approved"; // optimistic
          renderTable();
          refreshMetrics();
          await purchases.setStatus(id, "approved");
          toast("Order approved");
        }
      } catch (e) {
        o.status = "pending"; // revert
        renderTable();
        refreshMetrics();
        alert(
          "Approve failed: " +
            (e?.response?.data?.message || e?.message || "Network Error")
        );
      } finally {
        await loadOrders();
      }
    };

    const deleteOrder = async (id) => {
      if (!window.confirm(`Delete order ${id}?`)) return;
      try {
        await purchases.remove(id);
        toast(`Order ${id} deleted`);
        await loadOrders();
      } catch (e) {
        alert(
          "Delete failed: " +
            (e?.response?.data?.message || e?.message || "Network Error")
        );
      }
    };

    const editOrder = (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      openEditModal(o);
    };

    const onFormSubmit = async (e) => {
      e.preventDefault();
      const editId = document.getElementById("poEditId").value;
      const data = {
        supplier: document.getElementById("modalSupplier").value,
        items: document.getElementById("modalItems").value.trim(),
        deliveryDate: document.getElementById("modalDelivery").value || undefined,
        priority: document.getElementById("modalPriority").value || "normal",
        status: "pending",
      };
      if (!data.supplier || !data.items)
        return alert("Please fill supplier and items");

      try {
        if (!editId) {
          await purchases.create({
            ...data,
            orderDate: new Date().toISOString().slice(0, 10),
          });
          toast("Order created");
        } else {
          await purchases.update(editId, data);
          toast(`Order ${editId} updated`);
        }
        closeModal();
        await loadOrders();
      } catch (e2) {
        alert(
          "Save failed: " +
            (e2?.response?.data?.message || e2?.message || "Network Error")
        );
      }
    };

    const onBulkClick = async () => {
      if (!window.confirm("Approve all pending orders?")) return;
      const pending = purchaseOrdersRef.current.filter(
        (o) => o.status === "pending"
      );
      if (!pending.length) return;

      // optimistic
      pending.forEach((o) => (o.status = "approved"));
      renderTable();
      refreshMetrics();

      const results = await Promise.allSettled(
        pending.map((o) => purchases.setStatus(o.id, "approved"))
      );
      const rejected = results.filter((r) => r.status === "rejected");
      if (rejected.length) {
        alert(`Bulk approve finished with ${rejected.length} error(s).`);
      } else {
        toast("All pending orders approved");
      }
      await loadOrders();
    };

    // ---------- initial load ----------
    loadOrders();

    // ---------- table/search/filter listeners ----------
    const onTableClick = (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (action === "view") return viewOrder(id);
      if (action === "approve") return approveOrder(id);
      if (action === "edit") return editOrder(id);
      if (action === "delete") return deleteOrder(id);
    };

    const onSearchInput = () => {
      const q = document.getElementById("purchaseSearch").value.toLowerCase();
      $all("#purchaseTableBody tr").forEach((r) => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    };

    const onFilterChange = () => {
      const v = document.getElementById("statusFilter").value;
      $all("#purchaseTableBody tr").forEach((r) => {
        const st = r.querySelector(".status")?.textContent.trim();
        r.style.display = !v || st === v ? "" : "none";
      });
    };

    const closeModalFn = () => closeModal();
    const onEsc = (ev) => { if (ev.key === "Escape") closeModalFn(); };
    const onClickOutside = (ev) => { if (ev.target.id === "purchaseModal") closeModalFn(); };

    document.getElementById("btnCreate")?.addEventListener("click", openCreateModal);
    document.getElementById("btnExport")?.addEventListener("click", exportPDF);
    document.getElementById("btnBulkApprove")?.addEventListener("click", onBulkClick);
    document.getElementById("purchaseTableBody")?.addEventListener("click", onTableClick);
    document.getElementById("purchaseForm")?.addEventListener("submit", onFormSubmit);
    document.getElementById("purchaseSearch")?.addEventListener("input", onSearchInput);
    document.getElementById("statusFilter")?.addEventListener("change", onFilterChange);
    document.getElementById("poCloseBtn")?.addEventListener("click", closeModalFn);
    document.getElementById("btnCancel")?.addEventListener("click", closeModalFn);
    document.addEventListener("keydown", onEsc);
    document.addEventListener("click", onClickOutside);

    // ---------- cleanup ----------
    return () => {
      document.getElementById("btnCreate")?.removeEventListener("click", openCreateModal);
      document.getElementById("btnExport")?.removeEventListener("click", exportPDF);
      document.getElementById("btnBulkApprove")?.removeEventListener("click", onBulkClick);
      document.getElementById("purchaseTableBody")?.removeEventListener("click", onTableClick);
      document.getElementById("purchaseForm")?.removeEventListener("submit", onFormSubmit);
      document.getElementById("purchaseSearch")?.removeEventListener("input", onSearchInput);
      document.getElementById("statusFilter")?.removeEventListener("change", onFilterChange);
      document.getElementById("poCloseBtn")?.removeEventListener("click", closeModalFn);
      document.getElementById("btnCancel")?.removeEventListener("click", closeModalFn);
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("click", onClickOutside);
    };
  }, []);

  // ---------- UI ----------
  return (
    // ▼▼ Namespaced page wrapper
    <div className="po">
      <Sidebarpul />
      <main className="main-content">
        <div className="container" id="purchase-items">
          <div className="header">
            <h1>🛒 Purchase Orders Management</h1>
            <div className="date" id="poDate"></div>
          </div>

          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-value" id="poPending">0</div>
              <div className="metric-label">Pending Orders</div>
            </div>
            <div className="metric-card">
              <div className="metric-value" id="poCompleted">0</div>
              <div className="metric-label">Completed Orders</div>
            </div>
            {/* <div className="metric-card">
              <div className="metric-value" id="poCancelled">0</div>
              <div className="metric-label">Cancelled</div>
            </div> */}
          </div>

          <div className="action-bar">
            <button className="btn btn-pr" id="btnCreate"><span>＋</span>Create New Order</button>
            <button className="btn btn-secondary" id="btnExport"><span>📄</span>Export Orders (PDF)</button>
            <button className="btn btn-success" id="btnBulkApprove"><span>✓</span>Bulk Approve</button>
          </div>

          <div className="table-container">
            <div className="table-header">
              <div className="table-title">📋 Purchase Orders</div>
              <div className="search-filter-bar">
                <input type="text" className="search-box" id="purchaseSearch" placeholder="Search orders..." />
                <select className="filter-select" id="statusFilter">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <table id="purchaseTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="purchaseTableBody"></tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <div className="modal" id="purchaseModal" aria-hidden="true" role="dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" id="poModalTitle">Create New Purchase Order</h2>
              <button className="close-modal" id="poCloseBtn" aria-label="Close">&times;</button>
            </div>
            <form id="purchaseForm">
              <input type="hidden" id="poEditId" defaultValue="" />
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-control" id="modalSupplier">
                  <option value="">Select Supplier</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Items</label>
                <textarea className="form-control" id="modalItems" rows="3" placeholder="Enter items (one per line)"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input type="date" className="form-control" id="modalDelivery" />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" id="modalPriority">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" id="btnCancel">Cancel</button>
                <button type="submit" className="btn btn-pri" id="poSubmitBtn">Create Order</button>
              </div>
            </form>
          </div>
        </div>

        <div className="toast" id="toast"></div>
      </main>
    </div>
  );
}
