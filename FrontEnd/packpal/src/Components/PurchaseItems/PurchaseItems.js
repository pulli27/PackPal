import React, { useEffect, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./PurchaseItems.css";

export default function PurchaseItems() {
  // ===== Stable data (no re-renders) =====
  const settingsRef = useRef({ currency: "USD", autoApprove: "off" });

  const suppliersRef = useRef([
    { name: "Premium Leather Co." },
    { name: "Canvas Works Ltd." },
    { name: "Artisan Crafts Inc." },
    { name: "Modern Bag Solutions" },
    { name: "Ceylon Leather Crafts (Pvt) Ltd." },
    { name: "Precision Accessories" },
  ]);

  // Use a ref so we can mutate (your current approach) without re-rendering
  const purchaseOrdersRef = useRef([
    {
      id: "O-001",
      supplier: "Premium Leather Co.",
      items: "Full-grain leather (50), Top-grain leather (30)",
      orderDate: "2025-08-25",
      deliveryDate: "2025-09-05",
      status: "pending",
    },
    {
      id: "O-002",
      supplier: "Canvas Works Ltd.",
      items: "cotton canvas (100)",
      orderDate: "2025-08-22",
      deliveryDate: "2025-09-01",
      status: "approved",
    },
    {
      id: "O-003",
      supplier: "Artisan Crafts Inc.",
      items: "Zippers (25), Buckles & rings (40)",
      orderDate: "2025-08-20",
      deliveryDate: "2025-08-30",
      status: "delivered",
    },
    {
      id: "O-004",
      supplier: "Modern Bag Solutions",
      items: "Bonded nylon Tex 70 (V-69) (10), Paper Supplies",
      orderDate: "2025-08-28",
      deliveryDate: "2025-09-10",
      status: "pending",
    },
    {
      id: "O-005",
      supplier: "Ceylon Leather Crafts (Pvt) Ltd.",
      items: "Double-sided basting tape (15), PVA fabric glue (20)",
      orderDate: "2025-08-15",
      deliveryDate: "2025-08-25",
      status: "cancelled",
    },
  ]);

  // ===== One-time wiring without missing-deps warning =====
  useEffect(() => {
    // ---- Helpers (scoped to effect) ----
    const $ = (sel) => document.querySelector(sel);
    const $all = (sel) => Array.from(document.querySelectorAll(sel));
    const formatDate = (d) =>
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
      setTimeout(() => el.classList.remove("show"), 1800);
    };

    // ---- PDF tools loader (jsPDF + html2canvas) ----
    function loadScript(src) {
      return new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = res;
        s.onerror = rej;
        document.body.appendChild(s);
      });
    }
    async function ensurePDFTools() {
      if (!window.jspdf?.jsPDF) {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        );
      }
      if (!window.html2canvas) {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        );
      }
      return { jsPDF: window.jspdf.jsPDF, html2canvas: window.html2canvas };
    }

    // Next ID in O-001 style by scanning current orders
    const nextOrderId = () => {
      const nums = purchaseOrdersRef.current
        .map((o) => (typeof o.id === "string" ? o.id.trim() : ""))
        .map((id) => {
          const m = id.match(/^O-(\d{3,})$/);
          return m ? parseInt(m[1], 10) : null;
        })
        .filter((n) => n !== null);
      const max = nums.length ? Math.max(...nums) : 0;
      return `O-${String(max + 1).padStart(3, "0")}`;
    };

    // ===== UI Logic =====
    const refreshPoMetrics = () => {
      const dateEl = $("#poDate");
      if (dateEl) dateEl.textContent = "Last Updated: " + new Date().toLocaleString();

      const list = purchaseOrdersRef.current;
      const p = list.filter((o) => o.status === "pending").length;
      const c = list.filter((o) => o.status === "delivered" || o.status === "approved")
        .length;
      const x = list.filter((o) => o.status === "cancelled").length;

      const setText = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      setText("poPending", p);
      setText("poCompleted", c);
      setText("poCancelled", x);
    };

    const renderTable = () => {
      const tbody = $("#purchaseTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      purchaseOrdersRef.current.forEach((o) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${o.id}</strong></td>
          <td>${o.supplier}</td>
          <td>${o.items}</td>
          <td>${formatDate(o.orderDate)}</td>
          <td>${formatDate(o.deliveryDate)}</td>
          <td><span class="status ${o.status}">${o.status}</span></td>
          <td>
            <button class="btn btn-secondary" data-action="view" data-id="${o.id}">View</button>
            ${
              o.status === "pending"
                ? `<button class="btn btn-success" data-action="approve" data-id="${o.id}">Approve</button>`
                : ""
            }
            <button class="btn btn-secondary" data-action="edit" data-id="${o.id}">Edit</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    };

    // ===== Report (PDF) =====
    function buildPoReportData() {
      const list = purchaseOrdersRef.current;
      const summary = {
        totalOrders: list.length,
        pending: list.filter((o) => o.status === "pending").length,
        approved: list.filter((o) => o.status === "approved").length,
        delivered: list.filter((o) => o.status === "delivered").length,
        cancelled: list.filter((o) => o.status === "cancelled").length,
        reportDate: new Date().toLocaleString(),
      };
      const rows = list.map((o) => ({
        ...o,
        orderDateFmt: formatDate(o.orderDate),
        deliveryDateFmt: formatDate(o.deliveryDate),
      }));
      return { summary, rows };
    }

    function poReportHTML({ summary, rows }) {
      const statCard = (label, value) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#111827">${value}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:6px">${label}</div>
        </div>`;

      const statsHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0 18px">
          ${statCard("Total Orders", summary.totalOrders)}
          ${statCard("Pending", summary.pending)}
          ${statCard("Approved", summary.approved)}
          ${statCard("Delivered", summary.delivered)}
          ${statCard("Cancelled", summary.cancelled)}
          ${statCard("Generated", summary.reportDate)}
        </div>`;

      const tableRows = rows
        .map(
          (r) => `
          <tr>
            <td>${r.id}</td>
            <td>${r.supplier}</td>
            <td>${r.items}</td>
            <td style="text-align:center">${r.orderDateFmt}</td>
            <td style="text-align:center">${r.deliveryDateFmt}</td>
            <td style="text-align:center;text-transform:capitalize">${r.status}</td>
          </tr>`
        )
        .join("");

      return `
        <div style="font-family:Inter, Arial, sans-serif;color:#111827;font-size:14px;line-height:1.45">
          <div style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #2563eb">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:44px;height:44px;border-radius:10px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff">🧾</div>
              <div style="text-align:left">
                <div style="font-weight:800;color:#111827;font-size:22px;margin:0">PackPal — Purchase Orders Summary</div>
                <div style="color:#6b7280;font-size:12px;margin-top:4px">Generated on ${summary.reportDate}</div>
              </div>
            </div>
          </div>

          ${statsHTML}

          <div style="margin:16px 0 6px">
            <h3 style="color:#334155;margin:0 0 8px 0">📋 Orders</h3>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#2563eb;color:#fff">
                  <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Order ID</th>
                  <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Supplier</th>
                  <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Items</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Order Date</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Delivery</th>
                  <th style="padding:8px;border:1px solid #e5e7eb">Status</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    async function exportOrdersPDF() {
      try {
        const { jsPDF, html2canvas } = await ensurePDFTools();

        // Build report content (A4-friendly)
        const data = buildPoReportData();
        const contentHTML = poReportHTML(data);

        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        temp.style.top = "0";
        temp.style.width = "794px"; // A4 width @ ~96dpi
        temp.style.padding = "40px";
        temp.style.background = "#ffffff";
        temp.innerHTML = contentHTML;
        document.body.appendChild(temp);

        const canvas = await html2canvas(temp, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: 794,
          height: temp.scrollHeight,
        });
        document.body.removeChild(temp);

        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgW = 210;
        const pageH = 297;
        const imgH = (canvas.height * imgW) / canvas.width;

        let hLeft = imgH;
        let pos = 0;
        pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
        hLeft -= pageH;
        while (hLeft > 0) {
          pos = hLeft - imgH;
          pdf.addPage();
          pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
          hLeft -= pageH;
        }
        pdf.save(`purchase_orders_${new Date().toISOString().split("T")[0]}.pdf`);
      } catch (e) {
        console.error(e);
        alert("PDF export failed. Please try again.");
      }
    }

    // ===== Modal + Actions =====
    const openCreateModal = () => {
      const sel = $("#modalSupplier");
      if (sel)
        sel.innerHTML =
          '<option value="">Select Supplier</option>' +
          suppliersRef.current.map((s) => `<option>${s.name}</option>`).join("");
      $("#poEditId").value = "";
      $("#purchaseForm").reset();
      $("#poModalTitle").textContent = "Create New Purchase Order";
      $("#poSubmitBtn").textContent = "Create Order";
      const d = new Date();
      d.setDate(d.getDate() + 14);
      $("#modalDelivery").value = d.toISOString().split("T")[0];
      $("#purchaseModal").classList.add("show");
      $("#purchaseModal").setAttribute("aria-hidden", "false");
    };

    const openEditModal = (order) => {
      const sel = $("#modalSupplier");
      if (sel)
        sel.innerHTML =
          '<option value="">Select Supplier</option>' +
          suppliersRef.current.map((s) => `<option>${s.name}</option>`).join("");
      $("#poEditId").value = order.id;
      $("#modalSupplier").value = order.supplier;
      $("#modalItems").value = order.items;
      $("#modalDelivery").value = order.deliveryDate;
      $("#modalPriority").value = "normal";
      $("#poModalTitle").textContent = "Edit Purchase Order";
      $("#poSubmitBtn").textContent = "Update";
      $("#purchaseModal").classList.add("show");
      $("#purchaseModal").setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      $("#purchaseModal").classList.remove("show");
      $("#purchaseModal").setAttribute("aria-hidden", "true");
    };

    const viewOrder = (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      alert(`Order Details:
ID: ${o.id}
Supplier: ${o.supplier}
Items: ${o.items}
Status: ${o.status}
Order Date: ${formatDate(o.orderDate)}
Delivery: ${formatDate(o.deliveryDate)}`);
    };

    const approveOrder = (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      if (
        settingsRef.current.autoApprove === "on" ||
        window.confirm("Approve this order?")
      ) {
        o.status = "approved";
        toast("Order approved");
        renderTable();
        refreshPoMetrics();
      }
    };

    const editOrder = (id) => {
      const o = purchaseOrdersRef.current.find((x) => x.id === id);
      if (!o) return;
      openEditModal(o);
    };

    const bulkApprove = () => {
      if (!window.confirm("Approve all pending orders?")) return;
      purchaseOrdersRef.current.forEach((o) => {
        if (o.status === "pending") o.status = "approved";
      });
      toast("All pending orders approved");
      renderTable();
      refreshPoMetrics();
    };

    // ===== Form/Search/Filter Handlers =====
    const onSearchInput = () => {
      const q = $("#purchaseSearch").value.toLowerCase();
      $all("#purchaseTableBody tr").forEach((r) => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    };

    const onFilterChange = () => {
      const v = $("#statusFilter").value;
      $all("#purchaseTableBody tr").forEach((r) => {
        const st = r.querySelector(".status")?.textContent.trim();
        r.style.display = !v || st === v ? "" : "none";
      });
    };

    const onFormSubmit = (e) => {
      e.preventDefault();
      const editId = $("#poEditId").value;
      const data = {
        supplier: $("#modalSupplier").value,
        items: $("#modalItems").value.trim(),
        deliveryDate: $("#modalDelivery").value,
        status: "pending",
      };
      if (!data.supplier || !data.items)
        return alert("Please fill supplier, items");

      if (!editId) {
        // create new with O-xxx ID
        const newId = nextOrderId();
        purchaseOrdersRef.current.unshift({
          id: newId,
          orderDate: new Date().toISOString().split("T")[0],
          ...data,
        });
        toast(`Order ${newId} created`);
      } else {
        // update existing
        const i = purchaseOrdersRef.current.findIndex((o) => o.id === editId);
        if (i !== -1) {
          purchaseOrdersRef.current[i] = {
            ...purchaseOrdersRef.current[i],
            ...data,
          };
          toast(`Order ${editId} updated`);
        }
      }
      closeModal();
      renderTable();
      refreshPoMetrics();
    };

    // ===== Initial paint & listeners =====
    refreshPoMetrics();
    renderTable();

    const btnCreate = $("#btnCreate");
    const btnExport = $("#btnExport");
    const btnBulkApprove = $("#btnBulkApprove");
    const tableBody = $("#purchaseTableBody");

    const onCreateClick = () => openCreateModal();
    const onExportClick = () => exportOrdersPDF();
    const onBulkClick = () => bulkApprove();

    btnCreate?.addEventListener("click", onCreateClick);
    btnExport?.addEventListener("click", onExportClick);
    btnBulkApprove?.addEventListener("click", onBulkClick);

    // Delegate table button clicks (view/approve/edit)
    const onTableClick = (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (action === "view") return viewOrder(id);
      if (action === "approve") return approveOrder(id);
      if (action === "edit") return editOrder(id);
    };
    tableBody?.addEventListener("click", onTableClick);

    // Modal close handlers
    const onEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    const onClickOutside = (e) => {
      if (e.target.id === "purchaseModal") closeModal();
    };
    document.addEventListener("keydown", onEsc);
    document.addEventListener("click", onClickOutside);

    // Form, search, filter
    const form = $("#purchaseForm");
    form?.addEventListener("submit", onFormSubmit);
    const search = $("#purchaseSearch");
    const filter = $("#statusFilter");
    search?.addEventListener("input", onSearchInput);
    filter?.addEventListener("change", onFilterChange);

    // Modal close buttons
    const btnClose = $("#poCloseBtn");
    const btnCancel = $("#btnCancel");
    const onCloseClick = () => closeModal();
    btnClose?.addEventListener("click", onCloseClick);
    btnCancel?.addEventListener("click", onCloseClick);

    // Cleanup
    return () => {
      btnCreate?.removeEventListener("click", onCreateClick);
      btnExport?.removeEventListener("click", onExportClick);
      btnBulkApprove?.removeEventListener("click", onBulkClick);
      tableBody?.removeEventListener("click", onTableClick);
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("click", onClickOutside);
      form?.removeEventListener("submit", onFormSubmit);
      search?.removeEventListener("input", onSearchInput);
      filter?.removeEventListener("change", onFilterChange);
      btnClose?.removeEventListener("click", onCloseClick);
      btnCancel?.removeEventListener("click", onCloseClick);
    };
  }, []); // ✅ runs once, no missing-deps warning

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="container" id="purchase-items">
          <div className="header">
            <h1>🛒 Purchase Orders Management</h1>
            <div className="date" id="poDate"></div>
          </div>

          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-change">+15%</div>
              <div className="metric-value" id="poPending">0</div>
              <div className="metric-label">Pending Orders</div>
            </div>
            <div className="metric-card">
              <div className="metric-change">+22%</div>
              <div className="metric-value" id="poCompleted">0</div>
              <div className="metric-label">Completed Orders</div>
            </div>
            <div className="metric-card">
              <div className="metric-change">-3%</div>
              <div className="metric-value" id="poCancelled">0</div>
              <div className="metric-label">Cancelled Orders</div>
            </div>
          </div>

          <div className="action-bar">
            <button className="btn btn-primary" id="btnCreate">
              <span>＋</span>Create New Order
            </button>
            <button className="btn btn-secondary" id="btnExport">
              <span>📄</span>Export Orders (PDF)
            </button>
            <button className="btn btn-success" id="btnBulkApprove">
              <span>✓</span>Bulk Approve
            </button>
          </div>

          <div className="table-container">
            <div className="table-header">
              <div className="table-title">📋 Purchase Orders</div>
              <div className="search-filter-bar">
                <input
                  type="text"
                  className="search-box"
                  id="purchaseSearch"
                  placeholder="Search orders..."
                />
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
              <h2 className="modal-title" id="poModalTitle">
                Create New Purchase Order
              </h2>
              <button className="close-modal" id="poCloseBtn" aria-label="Close">
                &times;
              </button>
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
                <textarea
                  className="form-control"
                  id="modalItems"
                  rows="3"
                  placeholder="Enter items (one per line)"
                ></textarea>
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
                <button type="button" className="btn btn-secondary" id="btnCancel">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="poSubmitBtn">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="toast" id="toast"></div>
      </main>
    </div>
  );
}
