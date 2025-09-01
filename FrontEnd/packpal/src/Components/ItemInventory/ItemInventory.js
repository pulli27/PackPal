import React, { useEffect, useRef } from "react";
import "./ItemInventory.css";
import Sidebar from "../Sidebar/Sidebar";
import axios from "axios";

const fetchHandler = async () =>{
  return await axios.get(URL).then((res) => res.data);
}
export default function ItemInventory() {
  // keep inventory & editing index in refs so handlers always read the latest values
  const inventoryRef = useRef([
    { id: "1001", name: "Leather Backpack",  description: "Brown leather bag", quantity: 450, unitPrice: 80.0,  avgDailyUsage: 3, leadTimeDays: 3 },
    { id: "1002", name: "Canvas Tote",       description: "Beige shoulder bag", quantity: 300, unitPrice: 25.0,  avgDailyUsage: 2, leadTimeDays: 2 },
    { id: "1003", name: "Laptop Briefcase",  description: "Black laptop bag",   quantity: 12,  unitPrice: 110.0, avgDailyUsage: 1, leadTimeDays: 5 },
    { id: "1004", name: "Travel Duffel",     description: "Large blue bag",     quantity: 500, unitPrice: 20.0,  avgDailyUsage: 2, leadTimeDays: 2 },
    { id: "1005", name: "Travel Duffel",     description: "Large blue bag",     quantity: 10,  unitPrice: 110.0, avgDailyUsage: 1, leadTimeDays: 7 }
  ]);
  const editingIndexRef = useRef(-1);

  useEffect(() => {
    /* ===== Helpers & State ===== */
    const SAFETY_STOCK = 40;

    const $ = (id) => document.getElementById(id);
    const toNum = (v) => Number(v) || 0;

    const computeReorderLevel = (item) =>
      Math.max(0, Math.round((toNum(item.avgDailyUsage) * toNum(item.leadTimeDays)) + SAFETY_STOCK));
    const totalPriceOf = (item) => (toNum(item.unitPrice) * toNum(item.quantity));

    /* ===== UI Control ===== */
    function showInlineForm(show = true) {
      const c = $("inlineForm");
      if (c) c.style.display = show ? "block" : "none";
      if (show) $("itemId")?.focus();
    }

    function updateRopPreview() {
      const preview =
        (toNum($("avgDailyUsage")?.value) * toNum($("leadTimeDays")?.value)) + SAFETY_STOCK;
      if ($("reorderLevel")) $("reorderLevel").value = Math.max(0, Math.round(preview));
      if ($("safetyStock")) $("safetyStock").value = SAFETY_STOCK;
    }

    function resetForm() {
      $("itemForm")?.reset();
      if ($("formTitle")) $("formTitle").textContent = "Add New Item";
      if ($("reorderLevel")) $("reorderLevel").value = 0;
      if ($("avgDailyUsage")) $("avgDailyUsage").value = 0;
      if ($("leadTimeDays")) $("leadTimeDays").value = 0;
      if ($("safetyStock")) $("safetyStock").value = SAFETY_STOCK;
      editingIndexRef.current = -1;
      updateRopPreview();
    }

    function updateStats() {
      const inventory = inventoryRef.current;
      const totalItems = inventory.length;
      const low = inventory.filter((i) => toNum(i.quantity) <= computeReorderLevel(i)).length;
      const value = inventory.reduce((s, i) => s + totalPriceOf(i), 0);
      if ($("totalItems")) $("totalItems").textContent = totalItems;
      if ($("lowStockItems")) $("lowStockItems").textContent = low;
      if ($("totalValue")) $("totalValue").textContent = `LKR ${value.toLocaleString()}`;
    }

    function renderTable(list = inventoryRef.current) {
      const tbody = $("inventoryBody");
      if (!tbody) return;
      tbody.innerHTML = "";
      list.forEach((item, index) => {
        const rop = computeReorderLevel(item);
        const totalPrice = totalPriceOf(item);
        const tr = document.createElement("tr");
        if (toNum(item.quantity) <= rop) tr.classList.add("low-stock");
        tr.innerHTML = `
          <td class="item-id">${item.id}</td>
          <td class="item-name">${item.name}</td>
          <td>${item.description}</td>
          <td class="quantity">${item.quantity}</td>
          <td class="reorder-level">${rop}</td>
          <td class="price">LKR ${totalPrice.toLocaleString()}</td>
          <td class="unit-price">LKR ${toNum(item.unitPrice).toFixed(2)}</td>
          <td>
            <div class="action-cell">
              <button class="btn-edit"   onclick="window.__inv_editItem(${index})">Edit</button>
              <button class="btn-delete" onclick="window.__inv_deleteItem(${index})">Delete</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      updateStats();
    }

    /* ===== CRUD (bound to window so row buttons work) ===== */
    function editItem(index) {
      const it = inventoryRef.current[index];
      showInlineForm(true);
      if ($("formTitle")) $("formTitle").textContent = "Edit Item";
      $("itemId").value = it.id;
      $("itemName").value = it.name;
      $("description").value = it.description;
      $("quantity").value = it.quantity;
      $("unitPrice").value = it.unitPrice;
      $("avgDailyUsage").value = toNum(it.avgDailyUsage);
      $("leadTimeDays").value = toNum(it.leadTimeDays);
      $("safetyStock").value = SAFETY_STOCK;
      updateRopPreview();
      editingIndexRef.current = index;
      $("inlineForm")?.scrollIntoView({ behavior: "smooth" });
    }

    function deleteItem(index) {
      const item = inventoryRef.current[index];
      if (window.confirm(`Delete "${item.name}" (ID: ${item.id})?`)) {
        inventoryRef.current.splice(index, 1);
        renderTable();
      }
    }

    window.__inv_editItem = editItem;
    window.__inv_deleteItem = deleteItem;

    /* ===== Report builders ===== */
    function buildInventoryReport() {
      const inventory = inventoryRef.current;
      const lowStockItems = inventory.filter((i) => toNum(i.quantity) <= computeReorderLevel(i));
      const totalValue = inventory.reduce((s, i) => s + totalPriceOf(i), 0);
      const avgUnit = inventory.reduce((s, i) => s + toNum(i.unitPrice), 0) / (inventory.length || 1);
      const totalQty = inventory.reduce((s, i) => s + toNum(i.quantity), 0);

      const inventoryWithCalcs = inventory.map((item) => ({
        ...item,
        reorderLevel: computeReorderLevel(item),
        totalPrice: totalPriceOf(item),
        isLowStock: toNum(item.quantity) <= computeReorderLevel(item),
      }));

      return {
        summary: {
          totalItems: inventory.length,
          totalQuantity: totalQty,
          totalValue,
          avgUnitPrice: avgUnit,
          lowStockCount: lowStockItems.length,
          fixedSafetyStock: SAFETY_STOCK,
          reportDate: new Date().toLocaleString(),
        },
        inventory: inventoryWithCalcs,
        lowStockItems: lowStockItems.map((i) => ({
          ...i,
          reorderLevel: computeReorderLevel(i),
          totalPrice: totalPriceOf(i),
        })),
      };
    }

    function inventoryReportHTML(reportData) {
      const { summary, inventory: items, lowStockItems } = reportData;
      return `
        <div class="report-header">
          <h1 class="report-title">📋 Inventory Management Report</h1>
          <p class="report-subtitle">Generated on ${summary.reportDate}</p>
        </div>

        <div class="report-stats">
          <div class="report-stat"><div class="report-stat-number">${summary.totalItems}</div><div class="report-stat-label">Total Items</div></div>
          <div class="report-stat"><div class="report-stat-number">${summary.totalQuantity.toLocaleString()}</div><div class="report-stat-label">Total Quantity</div></div>
          <div class="report-stat"><div class="report-stat-number">LKR ${summary.totalValue.toLocaleString()}</div><div class="report-stat-label">Total Value</div></div>
          <div class="report-stat"><div class="report-stat-number" style="color:#e74c3c">${summary.lowStockCount}</div><div class="report-stat-label">Low Stock Items</div></div>
          <div class="report-stat"><div class="report-stat-number">LKR ${summary.avgUnitPrice.toFixed(2)}</div><div class="report-stat-label">Avg Unit Price</div></div>
          <div class="report-stat"><div class="report-stat-number">${summary.fixedSafetyStock}</div><div class="report-stat-label">Safety Stock</div></div>
        </div>

        ${lowStockItems.length ? `
        <div style="margin:30px 0">
          <h3 style="color:#e74c3c;margin-bottom:15px">⚠️ Low Stock Alert</h3>
          <table class="report-table">
            <thead><tr>
              <th>Item ID</th><th>Item Name</th><th>Current Qty</th><th>Reorder Level</th><th>Shortage</th><th>Unit Price</th>
            </tr></thead>
            <tbody>
              ${lowStockItems.map(i => `
                <tr class="low-stock-highlight">
                  <td>${i.id}</td><td>${i.name}</td><td>${i.quantity}</td>
                  <td>${i.reorderLevel}</td><td>${i.reorderLevel - i.quantity}</td>
                  <td>LKR ${toNum(i.unitPrice).toFixed(2)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>` : ""}

        <div style="margin:30px 0">
          <h3 style="color:#2c3e50;margin-bottom:15px">📦 Complete Inventory</h3>
          <table class="report-table">
            <thead><tr>
              <th>Item ID</th><th>Item Name</th><th>Description</th><th>Quantity</th>
              <th>Reorder Level</th><th>Unit Price</th><th>Total Value</th>
            </tr></thead>
            <tbody>
              ${items.map(i => `
                <tr ${i.isLowStock ? 'class="low-stock-highlight"' : ""}>
                  <td>${i.id}</td><td>${i.name}</td><td>${i.description}</td>
                  <td>${i.quantity}</td><td>${i.reorderLevel}</td>
                  <td>LKR ${toNum(i.unitPrice).toFixed(2)}</td>
                  <td>LKR ${i.totalPrice.toLocaleString()}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="report-actions">
          <button class="report-btn btn-pdf"  onclick="window.__inv_exportToPDF()">📄 Export to PDF</button>
          <button class="report-btn btn-print" onclick="window.__inv_printReport()">🖨️ Print Report</button>
          <button class="report-btn btn-json"  onclick="window.__inv_downloadJSON()">📊 Download JSON</button>
        </div>`;
    }

    function generateReport() {
      const data = buildInventoryReport();
      if ($("reportContent")) $("reportContent").innerHTML = inventoryReportHTML(data);
      if ($("reportModal")) $("reportModal").style.display = "block";
    }
    window.__inv_generateReport = generateReport;

    function closeReportModal() {
      if ($("reportModal")) $("reportModal").style.display = "none";
    }

    // PDF
    function exportToPDF() {
      try {
        const btn = document.querySelector(".btn-pdf");
        if (!window.jspdf || !window.html2canvas) {
          alert("PDF tools not found. Add jsPDF and html2canvas scripts in public/index.html.");
          return;
        }
        const txt = btn?.innerHTML;
        if (btn) {
          btn.innerHTML = "⏳ Generating PDF...";
          btn.disabled = true;
        }

        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        temp.style.top = "0";
        temp.style.width = "794px";
        temp.style.padding = "40px";
        temp.style.fontFamily = "Arial, sans-serif";
        temp.style.fontSize = "14px";
        temp.style.lineHeight = "1.4";
        temp.style.color = "#333";
        temp.style.background = "#fff";

        const data = buildInventoryReport();
        const contentHTML = inventoryReportHTML(data)
          .replace(/class="report-actions"[\s\S]*<\/div>\s*$/, "");

        temp.innerHTML = `
          <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #667eea;">
            <h1 style="color:#2c3e50;font-size:28px;margin-bottom:10px;font-weight:bold;">📋 Inventory Management Report</h1>
            <p style="color:#7f8c8d;font-size:16px;margin:0;">Generated on ${data.summary.reportDate}</p>
          </div>
          ${contentHTML}`;

        document.body.appendChild(temp);

        window.html2canvas(temp, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: 794,
          height: temp.scrollHeight
        })
          .then((canvas) => {
            document.body.removeChild(temp);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const img = canvas.toDataURL("image/png");
            const imgW = 210, pageH = 297;
            const imgH = (canvas.height * imgW) / canvas.width;
            let hLeft = imgH, pos = 0;
            pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
            hLeft -= pageH;
            while (hLeft >= 0) {
              pos = hLeft - imgH;
              pdf.addPage();
              pdf.addImage(img, "PNG", 0, pos, imgW, imgH);
              hLeft -= pageH;
            }
            pdf.save(`inventory_report_${new Date().toISOString().split("T")[0]}.pdf`);
            if (btn) {
              btn.innerHTML = txt;
              btn.disabled = false;
            }
          })
          .catch((err) => {
            if (document.body.contains(temp)) document.body.removeChild(temp);
            if (btn) {
              btn.innerHTML = txt;
              btn.disabled = false;
            }
            console.error(err);
            alert("PDF generation failed. Please try again.");
          });
      } catch (err) {
        console.error(err);
        alert("Export failed.");
      }
    }

    function printReport() {
      const src = $("reportContent")?.innerHTML || "";
      const w = window.open("", "_blank");
      const doc = `
        <!DOCTYPE html><html><head><title>Inventory Report</title>
        <meta charset="utf-8"/>
        <style>
          body{font-family:Arial, sans-serif;margin:0;padding:20px;color:#333}
          .report-header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px}
          .report-title{font-size:24px;margin-bottom:10px}
          .report-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin:20px 0}
          .report-stat{text-align:center;padding:15px;border:1px solid #333}
          .report-stat-number{font-size:18px;font-weight:bold}
          .report-table{width:100%;border-collapse:collapse;margin:15px 0}
          .report-table th{background:#f0f0f0;padding:8px;text-align:left;border:1px solid #333}
          .report-table td{padding:6px 8px;border:1px solid #333}
          .low-stock-highlight{background:#f9e3e3}
          .report-actions{display:none}
          @media print{ @page{ margin:16mm } }
        </style></head><body>${src}</body></html>`;
      w.document.open();
      w.document.write(doc);
      w.document.close();
      w.focus();
      w.print();
    }

    function downloadJSON() {
      const data = buildInventoryReport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_report_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // expose report actions on window for modal buttons
    window.__inv_exportToPDF = exportToPDF;
    window.__inv_printReport  = printReport;
    window.__inv_downloadJSON = downloadJSON;

    /* ===== Named Listeners (attach once, remove on cleanup) ===== */
    const addBtn = $("addBtn");
    const cancelBtn = $("cancelBtn");
    const clearBtn = $("clearBtn");
    const searchInput = $("searchInput");
    const avg = $("avgDailyUsage");
    const lead = $("leadTimeDays");
    const form = $("itemForm");

    function onAdd() {
      resetForm();
      showInlineForm(true);
      $("inlineForm")?.scrollIntoView({ behavior: "smooth" });
    }
    function onCancel() {
      showInlineForm(false);
      resetForm();
    }
    function onClear() { resetForm(); }
    function onAvg() { updateRopPreview(); }
    function onLead() { updateRopPreview(); }

    function onSearch(e) {
      const term = (e.target.value || "").toLowerCase();
      const inventory = inventoryRef.current;
      const filtered = inventory.filter(
        (i) =>
          i.id.toLowerCase().includes(term) ||
          i.name.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term)
      );
      const mapped = filtered.map((item) => ({ item, index: inventory.indexOf(item) }));
      const tbody = $("inventoryBody");
      if (!tbody) return;
      tbody.innerHTML = "";
      mapped.forEach(({ item, index }) => {
        const rop = computeReorderLevel(item);
        const tr = document.createElement("tr");
        if (toNum(item.quantity) <= rop) tr.classList.add("low-stock");
        tr.innerHTML = `
          <td class="item-id">${item.id}</td>
          <td class="item-name">${item.name}</td>
          <td>${item.description}</td>
          <td class="quantity">${item.quantity}</td>
          <td class="reorder-level">${rop}</td>
          <td class="price">LKR ${totalPriceOf(item).toLocaleString()}</td>
          <td class="unit-price">LKR ${toNum(item.unitPrice).toFixed(2)}</td>
          <td>
            <div class="action-cell">
              <button class="btn-edit"   onclick="window.__inv_editItem(${index})">Edit</button>
              <button class="btn-delete" onclick="window.__inv_deleteItem(${index})">Delete</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      updateStats();
    }

    function onSubmit(e) {
      e.preventDefault();
      const data = {
        id: $("itemId").value.trim(),
        name: $("itemName").value.trim(),
        description: $("description").value.trim(),
        quantity: parseInt($("quantity").value, 10) || 0,
        unitPrice: parseFloat($("unitPrice").value) || 0,
        avgDailyUsage: parseInt($("avgDailyUsage").value, 10) || 0,
        leadTimeDays: parseInt($("leadTimeDays").value, 10) || 0,
      };

      const list = inventoryRef.current;

      // Optional: prevent duplicate IDs (comment out if not needed)
      const dupIndex = list.findIndex((i) => i.id === data.id && editingIndexRef.current !== list.indexOf(i));
      if (dupIndex !== -1) {
        alert(`Item ID ${data.id} already exists.`);
        return;
      }

      if (editingIndexRef.current === -1) list.push(data);
      else list[editingIndexRef.current] = data;

      renderTable();
      resetForm();
      showInlineForm(false);
    }

    // attach
    addBtn?.addEventListener("click", onAdd);
    cancelBtn?.addEventListener("click", onCancel);
    clearBtn?.addEventListener("click", onClear);
    avg?.addEventListener("input", onAvg);
    lead?.addEventListener("input", onLead);
    searchInput?.addEventListener("input", onSearch);
    form?.addEventListener("submit", onSubmit);

    // Modal close (clicking outside)
    function clickHandler(e) {
      const m = $("reportModal");
      if (e.target === m) closeReportModal();
    }
    window.addEventListener("click", clickHandler);

    // Initial render & ensure form hidden initially (if your CSS doesn't already)
    showInlineForm(false);
    renderTable();

    // Cleanup — remove listeners so Strict Mode dev double-mount won't double-bind
    return () => {
      addBtn?.removeEventListener("click", onAdd);
      cancelBtn?.removeEventListener("click", onCancel);
      clearBtn?.removeEventListener("click", onClear);
      avg?.removeEventListener("input", onAvg);
      lead?.removeEventListener("input", onLead);
      searchInput?.removeEventListener("input", onSearch);
      form?.removeEventListener("submit", onSubmit);

      window.removeEventListener("click", clickHandler);
      delete window.__inv_editItem;
      delete window.__inv_deleteItem;
      delete window.__inv_exportToPDF;
      delete window.__inv_printReport;
      delete window.__inv_downloadJSON;
      delete window.__inv_generateReport;
    };
  }, []);

  return (
    <div className="page-shell">
      <Sidebar />

      <div className="main-content">
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>Item Inventory</h1>

            <div className="search">
              <input id="searchInput" type="text" placeholder=" 🔍 Search items..." />
            </div>
            <button className="add-btn" id="addBtn">Add New Item</button>
          </div>

          {/* Inline Add/Edit Form */}
          <div id="inlineForm" className="form-card">
            <div className="form-header">
              <div>
                <div className="form-title" id="formTitle">Add New Item</div>
                <div className="hint">
                  Reorder Level = <b>Avg Daily Usage × Lead Time</b> + <b>Safety Stock (fixed at 40)</b>.<br />
                  The value updates automatically and is read-only.
                  <br /><br /><b>Total price</b> is calculated automatically.
                </div>
              </div>
              <button className="btn btn-light" id="cancelBtn" type="button">Cancel</button>
            </div>

            <form id="itemForm">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="itemId">Item ID</label>
                  <input id="itemId" required />
                </div>
                <div className="form-group">
                  <label htmlFor="itemName">Item Name</label>
                  <input id="itemName" required />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input id="description" required />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input id="quantity" type="number" min="0" required />
                </div>

                <div className="form-group">
                  <label htmlFor="avgDailyUsage">Avg Daily Usage</label>
                  <input id="avgDailyUsage" type="number" min="0" step="1" defaultValue="0" required />
                </div>
                <div className="form-group">
                  <label htmlFor="leadTimeDays">Lead Time (days)</label>
                  <input id="leadTimeDays" type="number" min="0" step="1" defaultValue="0" required />
                </div>

                <div className="form-group">
                  <label htmlFor="safetyStock">Safety Stock (fixed)</label>
                  <input id="safetyStock" type="number" defaultValue="40" disabled style={{ background: "#f3f4f6", cursor: "not-allowed" }} title="Safety Stock is fixed at 40" />
                </div>

                <div className="form-group">
                  <label htmlFor="reorderLevel">Reorder Level (auto)</label>
                  <input id="reorderLevel" type="number" min="0" readOnly style={{ background: "#f9fafb" }} />
                </div>

                <div className="form-group">
                  <label htmlFor="unitPrice">Unit Price</label>
                  <input id="unitPrice" type="number" step="0.01" min="0" required />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Item</button>
                <button type="button" className="btn btn-light" id="clearBtn">Clear</button>
              </div>
            </form>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="metric-card">
              <div className="stat-number" style={{ color: "#ffffffff" }} id="totalItems">0</div>
              <div className="stat">Total Items</div>
            </div>
            <div className="metric-card">
              <div className="stat-number" style={{ color: "#ca1c09ff" }} id="lowStockItems">0</div>
              <div className="stat">Low Stock Items</div>
            </div>
            <div className="metric-card">
              <div className="stat-number" style={{ color: "#ffffffff" }} id="totalValue">LKR 0</div>
              <div className="stat">Total Inventory Value</div>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table id="inventoryTable">
              <thead>
                <tr>
                  <th>ITEM ID</th>
                  <th>ITEM NAME</th>
                  <th>DESCRIPTION</th>
                  <th>QUANTITY</th>
                  <th>REORDER LEVEL</th>
                  <th>TOTAL PRICE</th>
                  <th>UNIT PRICE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody id="inventoryBody"></tbody>
            </table>
          </div>

          {/* Generate report */}
          <div className="report-section">
            <button
              className="generate-report-btn"
              onClick={() => window.__inv_generateReport && window.__inv_generateReport()}
            >
              📊 Generate Report
            </button>
          </div>
        </div>

        {/* Report Modal */}
        <div id="reportModal" className="modal">
          <div className="modal-content">
            <span
              className="close"
              onClick={() => {
                const el = document.getElementById("reportModal");
                if (el) el.style.display = "none";
              }}
            >
              &times;
            </span>
            <div id="reportContent"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
