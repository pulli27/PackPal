// src/Components/ProductInventory/ProductInventory.js
import React, { useEffect, useRef } from "react"; 
import "./ProductInventory.css";
import Sidebar from "../Sidebar/Sidebar";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const INVENTORY_PATH = "/api/products";
const READ_ONLY = true;

function ProductInventory() {
  let products = [];
  const currentFilters = { search: "", category: "", status: "" };
  const $ = (sel) => document.querySelector(sel);
  const mountedRef = useRef(false);

  /* ---------------- Helpers ---------------- */
  function showNotification(message, type = "success") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 50);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  const money = (n) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

  // Compute UNIT PRICE after discount
  function discountedUnitPrice(p) {
    const base = Number(p.unitPrice || 0);
    const type = String(p.discountType || "").trim().toLowerCase();
    const valRaw = p.discountValue;
    if (valRaw === null || valRaw === undefined) return base;

    const value = Number(valRaw);
    if (!Number.isFinite(value) || value <= 0) return base;

    // percent types
    const isPercent =
      type === "percent" ||
      type === "percentage" ||
      type === "%" ||
      type === "pc" ||
      type === "pct";

    // flat/amount types
    const isFlat =
      type === "flat" ||
      type === "amount" ||
      type === "value" ||
      type === "lkr" ||
      type === "rs" ||
      type === "rs." ||
      type === "priceoff";

    if (isPercent) {
      const pct = Math.max(0, Math.min(100, value));
      return Math.max(0, base * (1 - pct / 100));
    }
    if (isFlat) {
      return Math.max(0, base - value);
    }
    // If discountType unknown but a numeric value exists, treat as flat
    return Math.max(0, base - value);
  }

  // Map Mongo doc -> UI product shape (with createdAtTs for stable sorting)
  function toUiProduct(item) {
    const sku = item.sku || item.code || item.itemCode || item._id || "";
    const name = item.name || item.productName || "Unnamed";
    const category = item.category || "Uncategorized";
    const stock = Number(item.stock ?? item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    const createdAt = item.createdAt || "";
    const updatedAt = item.updatedAt || "";
    const createdAtTs = createdAt ? new Date(createdAt).getTime() : 0;

    return {
      sku: String(sku),
      name: String(name),
      category: String(category),
      stock,
      unitPrice,
      img: item.img || "",
      rating: item.rating ?? null,
      discountType: item.discountType || "",
      discountValue: item.discountValue ?? null,
      createdAt,
      updatedAt,
      createdAtTs,
    };
  }

  /* ---------- React-bound filter handlers ---------- */
  const handleSearch = (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    applyFilters();
  };
  const handleCategory = (e) => {
    currentFilters.category = e.target.value;
    applyFilters();
  };
  const handleStatus = (e) => {
    currentFilters.status = e.target.value;
    applyFilters();
  };

  // Helper to get an array of products that match current filters (for PDF/CSV export)
  function getFilteredProducts() {
    return products.filter((p) => {
      const status =
        p.stock === 0 ? "out-of-stock" : p.stock <= 20 ? "low-stock" : "in-stock";
      const matchesSearch =
        !currentFilters.search ||
        p.name.toLowerCase().includes(currentFilters.search) ||
        String(p.sku).toLowerCase().includes(currentFilters.search);
      const matchesCategory =
        !currentFilters.category || p.category === currentFilters.category;
      const matchesStatus = !currentFilters.status || currentFilters.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  /* --------------- Rendering --------------- */
  // Row WITHOUT visible SKU column; SKU kept in data-sku for searching
  function generateTableRow(product) {
    const unitAfterDiscount = discountedUnitPrice(product);
    const totalValue = product.stock * unitAfterDiscount;

    let status = "in-stock";
    let statusText = "In Stock";
    if (product.stock === 0) {
      status = "out-of-stock";
      statusText = "Out of Stock";
    } else if (product.stock <= 20) {
      status = "low-stock";
      statusText = "Low Stock";
    }

    const actionsHtml = READ_ONLY
      ? `<div class="action-buttons">
           <button class="action-btn view-btn" onclick="viewProduct('${product.sku}')">View</button>
         </div>`
      : `<div class="action-buttons">
           <button class="action-btn view-btn" onclick="viewProduct('${product.sku}')">View</button>
           <button class="action-btn edit-btn" onclick="editProduct('${product.sku}')">Edit</button>
           <button class="action-btn delete-btn" onclick="deleteProduct('${product.sku}')">Delete</button>
         </div>`;

    return `
      <tr data-category="${product.category}" data-status="${status}" data-sku="${product.sku}">
        <td><span class="product-name">${product.name}</span></td>
        <td><span class="category-tag category-${product.category.toLowerCase()}">${product.category}</span></td>
        <td><span class="stock-amount">${product.stock} units</span></td>
        <td><span class="unit-price">${money(unitAfterDiscount)}</span></td>
        <td><span class="value-amount">${money(totalValue)}</span></td>
        <td><span class="status ${status}">${statusText}</span></td>
        <td>${actionsHtml}</td>
      </tr>
    `;
  }

  function populateTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    tbody.innerHTML = products.map(generateTableRow).join("");
    updateStats();
    applyFilters();
  }

  function updateStats() {
    const totalProducts = products.length;
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    // IMPORTANT: use discounted unit price for total value
    const totalValue = products.reduce((s, p) => s + p.stock * discountedUnitPrice(p), 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length;

    $("#totalProductsStat").textContent = totalProducts;
    $("#totalUnitsStat").textContent = totalUnits;
    $("#totalValueStat").textContent = money(totalValue);
    $("#lowStockStat").textContent = lowStock;
    $("#totalCount").textContent = totalProducts;
  }

  /* ----------- Filters/Search ----------- */
  function applyFilters() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll("tr");
    let visibleCount = 0;

    rows.forEach((row) => {
      const productName = row.cells[0].textContent.toLowerCase();
      const sku = (row.dataset.sku || "").toLowerCase(); // hidden but searchable
      const category = row.getAttribute("data-category");
      const status = row.getAttribute("data-status");

      let show = true;
      if (
        currentFilters.search &&
        !productName.includes(currentFilters.search) &&
        !sku.includes(currentFilters.search)
      )
        show = false;
      if (currentFilters.category && category !== currentFilters.category) show = false;
      if (currentFilters.status && status !== currentFilters.status) show = false;

      row.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    $("#visibleCount").textContent = visibleCount;
    updateFilterBadges();
    if (visibleCount === 0) showEmptyState();
    else hideEmptyState();
  }

  function updateFilterBadges() {
    const c = document.getElementById("filterBadges");
    if (!c) return;
    c.innerHTML = "";
    if (currentFilters.search) addFilterBadge("Search", currentFilters.search, "search");
    if (currentFilters.category) addFilterBadge("Category", currentFilters.category, "category");
    if (currentFilters.status) {
      const label = currentFilters.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
      addFilterBadge("Status", label, "status");
    }
  }
  function addFilterBadge(type, value, filterType) {
    const c = document.getElementById("filterBadges");
    const badge = document.createElement("div");
    badge.className = "filter-badge";
    badge.innerHTML = `${type}: ${value} <span class="remove-filter" onclick="removeFilter('${filterType}')">×</span>`;
    c.appendChild(badge);
  }
  function removeFilter(filterType) {
    currentFilters[filterType] = "";
    if (filterType === "search") $("#searchInput").value = "";
    if (filterType === "category") $("#categoryFilter").value = "";
    if (filterType === "status") $("#statusFilter").value = "";
    applyFilters();
  }
  window.removeFilter = removeFilter;

  function showEmptyState() {
    const wrap = document.querySelector(".table-wrapper");
    if (!wrap || document.getElementById("emptyState")) return;
    const el = document.createElement("div");
    el.id = "emptyState";
    el.className = "empty-state";
    el.innerHTML = `<div class="empty-state-icon">📭</div><h3>No products found</h3><p>Try adjusting your search criteria or filters</p>`;
    wrap.appendChild(el);
  }
  function hideEmptyState() {
    const el = document.getElementById("emptyState");
    if (el) el.remove();
  }

  /* ---------- Sorting ---------- */
  let sortDirection = {};
  function sortTable(columnIndex) {
    const dir = sortDirection[columnIndex] === "asc" ? "desc" : "asc";
    sortDirection[columnIndex] = dir;

    products.sort((a, b) => {
      let av, bv;
      switch (columnIndex) {
        case 0: av = a.name.toLowerCase();     bv = b.name.toLowerCase(); break;
        case 1: av = a.category.toLowerCase(); bv = b.category.toLowerCase(); break;
        case 2: av = a.stock;                  bv = b.stock; break;
        case 3: av = discountedUnitPrice(a);   bv = discountedUnitPrice(b); break; // sort by discounted price
        case 4: av = a.stock * discountedUnitPrice(a); bv = b.stock * discountedUnitPrice(b); break; // sort by discounted total
        default: return 0;
      }
      if (dir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    populateTable();

    document.querySelectorAll("#inventoryTable thead th").forEach((th, idx) => {
      th.textContent = th.textContent.replace(" ↑", "").replace(" ↓", "");
      if (idx === columnIndex) th.textContent += dir === "asc" ? " ↑" : " ↓";
    });
  }

  /* ---------------- Modals ---------------- */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
    document.body.style.overflow = "hidden";
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
    document.body.style.overflow = "auto";
  }

  function viewProduct(sku) {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    const unitAfterDiscount = discountedUnitPrice(p);
    const totalValue = p.stock * unitAfterDiscount;
    let status = "In Stock";
    if (p.stock === 0) status = "Out of Stock";
    else if (p.stock <= 20) status = "Low Stock";

    const ratingLine =
      p.rating != null
        ? `<div class="detail-item"><div class="detail-label">Rating</div><div class="detail-value">${p.rating}</div></div>`
        : "";

    const hasDiscount = p.discountValue != null && Number(p.discountValue) > 0;
    const discLine = hasDiscount
      ? `<div class="detail-item"><div class="detail-label">Discount</div>
           <div class="detail-value">${p.discountType || "Flat"} ${p.discountValue}</div></div>`
      : "";

    const priceLine = hasDiscount
      ? `<div class="detail-item"><div class="detail-label">Original Unit Price</div><div class="detail-value"><s>${money(p.unitPrice)}</s></div></div>
         <div class="detail-item"><div class="detail-label">Discounted Unit Price</div><div class="detail-value">${money(unitAfterDiscount)}</div></div>`
      : `<div class="detail-item"><div class="detail-label">Unit Price</div><div class="detail-value">${money(unitAfterDiscount)}</div></div>`;

    const imgLine = p.img
      ? `<div class="detail-item" style="grid-column:1/-1">
           <div class="detail-label">Image</div>
           <div class="detail-value"><img alt="${p.name}" src="${p.img}" style="max-width:240px;border-radius:10px"/></div>
         </div>`
      : "";
    const created = p.createdAt ? new Date(p.createdAt).toLocaleString() : "";
    const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "";

    $("#productDetails").innerHTML = `
      <div class="detail-item"><div class="detail-label">Product Name</div><div class="detail-value">${p.name}</div></div>
      <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${p.category}</div></div>
      <div class="detail-item"><div class="detail-label">Current Stock</div><div class="detail-value">${p.stock} units</div></div>
      ${priceLine}
      <div class="detail-item"><div class="detail-label">Total Value</div><div class="detail-value">${money(totalValue)}</div></div>
      ${ratingLine}
      ${discLine}
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status ${status
        .toLowerCase()
        .replace(" ", "-")}">${status}</span></div></div>
      ${imgLine}
      ${created ? `<div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${created}</div></div>` : ""}
      ${updated ? `<div class="detail-item"><div class="detail-label">Updated</div><div class="detail-value">${updated}</div></div>` : ""}
    `;
    openModal("viewModal");
  }

  // Read-only stubs
  function editProduct() {}
  function editFromView() {}
  function saveProduct() {}
  function openAddProductModal() {}
  function addProduct() {}
  function deleteProduct() {}

  /* --------------- Export PDF --------------- */
  async function exportPdf() {
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default || autoTableMod; // compatibility

      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text("PackPal — Product Inventory", pageWidth / 2, 40, { align: "center" });
      doc.setFontSize(12);
      doc.text(new Date().toLocaleString(), pageWidth / 2, 58, { align: "center" });

      const totalProducts = products.length;
      const totalUnits = products.reduce((s, p) => s + p.stock, 0);
      const totalValue = products.reduce((s, p) => s + p.stock * discountedUnitPrice(p), 0);
      doc.setFontSize(14);
      doc.text(
        `All items: ${totalProducts} • Units: ${totalUnits} • Total Value: ${money(totalValue)}`,
        pageWidth / 2,
        76,
        { align: "center" }
      );

      const data = getFilteredProducts();
      const body = data.map((p) => {
        const unitAfterDiscount = discountedUnitPrice(p);
        const status =
          p.stock === 0 ? "Out of Stock" : p.stock <= 20 ? "Low Stock" : "In Stock";
        return [
          p.name,
          p.category,
          `${p.stock} units`,
          money(unitAfterDiscount),
          money(p.stock * unitAfterDiscount),
          status,
        ];
      });

      autoTable(doc, {
        startY: 96,
        head: [["Product", "Category", "Stock", "Unit Price", "Value", "Status"]],
        body,
        styles: { fontSize: 11, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [33, 150, 243] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 100 },
          2: { cellWidth: 80 },
          3: { cellWidth: 90 },
          4: { cellWidth: 90 },
          5: { cellWidth: 80 },
        },
        didDrawPage: () => {
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth - 40, doc.internal.pageSize.getHeight() - 10);
        },
        margin: { left: 32, right: 32 },
      });

      const fileName = `inventory_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      showNotification("PDF exported successfully!", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showNotification("Error exporting PDF. Check jsPDF installation.", "error");
    }
  }

  function exportCsv() {
    const header = "Product Name,Category,Stock,Unit Price (after discount),Total Value (after discount),Status\n";
    const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const rows = getFilteredProducts()
      .map((p) => {
        const unitAfterDiscount = discountedUnitPrice(p);
        const totalValue = p.stock * unitAfterDiscount;
        let status = "In Stock";
        if (p.stock === 0) status = "Out of Stock";
        else if (p.stock <= 20) status = "Low Stock";
        return [
          csvEscape(p.name),
          csvEscape(p.category),
          p.stock,
          unitAfterDiscount,
          totalValue,
          csvEscape(status),
        ].join(",");
      })
      .join("\n");
    const csv = "data:text/csv;charset=utf-8," + header + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("CSV exported successfully!", "success");
  }

  window.exportPdf = exportPdf;
  window.exportCsv = exportCsv;

  window.viewProduct = viewProduct;
  window.editProduct = editProduct;
  window.editFromView = editFromView;
  window.saveProduct = saveProduct;
  window.openAddProductModal = openAddProductModal;
  window.addProduct = addProduct;
  window.deleteProduct = deleteProduct;

  /* --------------- Fetch (newest at the bottom) --------------- */
  async function fetchProducts() {
    try {
      const res = await axios.get(`${API_BASE}${INVENTORY_PATH}`);
      const list = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
      products = list.map(toUiProduct).sort((a, b) => a.createdAtTs - b.createdAtTs); // ASC → newest at bottom
      populateTable();
      showNotification(`Loaded ${products.length} products`, "success");
    } catch (err) {
      console.error("Fetch inventory error:", err);
      products = [];
      populateTable();
      showNotification("Error loading products. Check API URL/route.", "error");
    }
  }

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    fetchProducts();

    const onDocKey = (e) => {
      const s = $("#searchInput");
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        s?.focus();
      }
      if (e.key === "Escape") {
        document.querySelectorAll(".modal").forEach((m) => {
          if (m.style.display === "block") closeModal(m.id);
        });
        if (s) {
          s.value = "";
          currentFilters.search = "";
          applyFilters();
        }
      }
    };
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <header className="page-header">
            <div>
              <h1>📦 Product Inventory</h1>
            </div>
          </header>

          {/* Stats */}
          <section className="inventory-stats">
            <div className="metric-card">
              <div className="stat-value" id="totalProductsStat">0</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="totalUnitsStat">0</div>
              <div className="stat-label">Total Units</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="totalValueStat">LKR 0</div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="lowStockStat">0</div>
              <div className="stat-label">Low Stock Items</div>
            </div>
          </section>

          {/* Controls */}
          <section className="inventory-controls">
            <div className="controls-left">
              <input
                type="text"
                className="search-box"
                placeholder="🔍 Search products..."
                id="searchInput"
                onInput={handleSearch}
              />
              <select
                className="filter-select"
                id="categoryFilter"
                onChange={handleCategory}
              >
                <option value="">All Categories</option>
                <option value="bag">Bag</option>
                <option value="KidsBags">Kids Bags</option>
                <option value="SchoolBags">School Bags</option>
                <option value="LaptopBags">Laptop Bags</option>
                <option value="HandBags">Hand Bags</option>
                <option value="ToteBags">Tote Bags</option>
              </select>
              <select
                className="filter-select"
                id="statusFilter"
                onChange={handleStatus}
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div className="controls-right">
              <button className="export-btn" onClick={exportPdf}>🖨️ Export PDF</button>
            </div>
          </section>

          <div className="filter-badges" id="filterBadges"></div>

          {/* Table */}
          <section className="inventory-table-container">
            <div className="table-header">
              <div className="table-title">📋 Current Inventory</div>
              <div className="table-info">
                Showing <span id="visibleCount">0</span> of <span id="totalCount">0</span> products
              </div>
            </div>

            <div className="table-wrapper">
              <table id="inventoryTable">
                <thead>
                  <tr>
                    <th onClick={() => sortTable(0)} style={{ cursor: "pointer" }}>Product</th>
                    <th onClick={() => sortTable(1)} style={{ cursor: "pointer" }}>Category</th>
                    <th onClick={() => sortTable(2)} style={{ cursor: "pointer" }}>Stock</th>
                    <th onClick={() => sortTable(3)} style={{ cursor: "pointer" }}>Unit Price</th>
                    <th onClick={() => sortTable(4)} style={{ cursor: "pointer" }}>Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="tableBody"></tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* View Modal */}
      <div id="viewModal" className="modal" aria-hidden="true">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">📋 Product Details</h2>
            <button className="close-btn" onClick={() => closeModal("viewModal")}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="product-details" id="productDetails"></div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => closeModal("viewModal")}>Close</button>
          </div>
        </div>
      </div>

      {/* Hidden, unused modals (read-only) */}
      <div id="editModal" className="modal" aria-hidden="true" style={{ display: "none" }} />
      <div id="addModal" className="modal" aria-hidden="true" style={{ display: "none" }} />
    </div>
  );
}

export default ProductInventory;
