import React, { useEffect } from "react";
import "./ProductInventory.css";
import Sidebar from "../Sidebar/Sidebar";

function ProductInventory() {
  // ------------------ Data ------------------
  let products = [
    {
      sku: "KB-001",
      name: "Mini backpack",
      category: "KidsBags",
      stock: 142,
      unitPrice: 100,
      
    },
    {
      sku: "SB-205",
      name: "Rolling school bag",
      category: "SchoolBags",
      stock: 8,
      unitPrice: 200,
   
    },
    {
      sku: "HB-450",
      name: "Crossbody bag",
      category: "HandBags",
      stock: 0,
      unitPrice: 75,
    },
    {
      sku: "BT-330",
      name: "Beach tote",
      category: "ToteBags",
      stock: 67,
      unitPrice: 50,
      
    },
    {
      sku: "LB-890",
      name: "Laptop backpack",
      category: "LaptopBags",
      stock: 15,
      unitPrice: 100,
      
    },
  ];

  let currentEditingSku = null;
  const currentFilters = { search: "", category: "", status: "" };
  const $ = (sel) => document.querySelector(sel);

  // ------------------ UI Helpers ------------------
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

  function generateTableRow(product) {
    const totalValue = product.stock * product.unitPrice;
    const totalValueStr = totalValue.toLocaleString();

    let status = "in-stock";
    let statusText = "In Stock";
    if (product.stock === 0) {
      status = "out-of-stock";
      statusText = "Out of Stock";
    } else if (product.stock <= 20) {
      status = "low-stock";
      statusText = "Low Stock";
    }

    return `
      <tr data-category="${product.category}" data-status="${status}">
        <td><span class="product-name">${product.name}</span></td>
        <td><span class="sku-code">${product.sku}</span></td>
        <td><span class="category-tag category-${product.category.toLowerCase()}">${product.category}</span></td>
        <td><span class="stock-amount">${product.stock} units</span></td>
        <td><span class="value-amount">LKR ${totalValueStr}</span></td>
        <td><span class="status ${status}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view-btn" onclick="viewProduct('${product.sku}')">View</button>
            <button class="action-btn edit-btn" onclick="editProduct('${product.sku}')">Edit</button>
            <button class="action-btn delete-btn" onclick="deleteProduct('${product.sku}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  // ------------------ Core Renders ------------------
  function populateTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    tbody.innerHTML = products.map((p) => generateTableRow(p)).join("");
    updateStats();
    applyFilters();
  }

  function updateStats() {
    const totalProducts = products.length;
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const totalValue = products.reduce((s, p) => s + p.stock * p.unitPrice, 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length;

    $("#totalProductsStat").textContent = totalProducts;
    $("#totalUnitsStat").textContent = totalUnits;
    $("#totalValueStat").textContent = `LKR ${totalValue.toLocaleString()}`;
    $("#lowStockStat").textContent = lowStock;
    $("#totalCount").textContent = totalProducts;
  }

  // ------------------ Filters & Search ------------------
  function applyFilters() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll("tr");
    let visibleCount = 0;

    rows.forEach((row) => {
      const productName = row.cells[0].textContent.toLowerCase();
      const sku = row.cells[1].textContent.toLowerCase();
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
      const label = currentFilters.status
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
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

  // ------------------ Sorting ------------------
  let sortDirection = {};
  function sortTable(columnIndex) {
    const dir = sortDirection[columnIndex] === "asc" ? "desc" : "asc";
    sortDirection[columnIndex] = dir;

    products.sort((a, b) => {
      let av, bv;
      switch (columnIndex) {
        case 0:
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 1:
          av = a.sku.toLowerCase();
          bv = b.sku.toLowerCase();
          break;
        case 2:
          av = a.category.toLowerCase();
          bv = b.category.toLowerCase();
          break;
        case 3:
          av = a.stock;
          bv = b.stock;
          break;
        case 4:
          av = a.stock * a.unitPrice;
          bv = b.stock * b.unitPrice;
          break;
        default:
          return 0;
      }
      if (dir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    populateTable();

    // header arrows
    document.querySelectorAll("#inventoryTable thead th").forEach((th, idx) => {
      th.textContent = th.textContent.replace(" ↑", "").replace(" ↓", "");
      if (idx === columnIndex) th.textContent += dir === "asc" ? " ↑" : " ↓";
    });
  }

  // ------------------ Modals ------------------
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

  // ------------------ CRUD ------------------
  function viewProduct(sku) {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    const totalValue = p.stock * p.unitPrice;
    let status = "In Stock";
    if (p.stock === 0) status = "Out of Stock";
    else if (p.stock <= 20) status = "Low Stock";

    $("#productDetails").innerHTML = `
      <div class="detail-item"><div class="detail-label">Product Name</div><div class="detail-value">${p.name}</div></div>
      <div class="detail-item"><div class="detail-label">SKU Code</div><div class="detail-value">${p.sku}</div></div>
      <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${p.category}</div></div>
      <div class="detail-item"><div class="detail-label">Current Stock</div><div class="detail-value">${p.stock} units</div></div>
      <div class="detail-item"><div class="detail-label">Unit Price</div><div class="detail-value">LKR ${p.unitPrice}</div></div>
      <div class="detail-item"><div class="detail-label">Total Value</div><div class="detail-value">LKR ${totalValue.toLocaleString()}</div></div>
      <div class="detail-item" style="grid-column:1/-1;"><div class="detail-label">Status</div><div class="detail-value"><span class="status ${status
        .toLowerCase()
        .replace(" ","-")}">${status}</span></div></div>
      
    `;
    currentEditingSku = sku;
    openModal("viewModal");
  }

  function editProduct(sku) {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    $("#editProductName").value = p.name;
    $("#editSku").value = p.sku;
    $("#editCategory").value = p.category;
    $("#editStock").value = p.stock;
    $("#editUnitPrice").value = p.unitPrice;
    currentEditingSku = sku;
    openModal("editModal");
  }

  function editFromView() {
    closeModal("viewModal");
    editProduct(currentEditingSku);
  }

  function saveProduct() {
    const idx = products.findIndex((x) => x.sku === currentEditingSku);
    if (idx === -1) return;
    const newName = $("#editProductName").value.trim();
    const newSku = $("#editSku").value.trim();
    const newCategory = $("#editCategory").value;
    const newStock = parseInt($("#editStock").value, 10);
    const newUnitPrice = parseFloat($("#editUnitPrice").value);
    

    if (!newName || !newSku || !newCategory || isNaN(newStock) || isNaN(newUnitPrice)) {
      showNotification("Please fill in all required fields with valid values.", "error");
      return;
    }
    if (newSku !== currentEditingSku && products.some((p) => p.sku === newSku)) {
      showNotification("SKU code already exists. Please use a unique SKU.", "error");
      return;
    }

    products[idx] = {
      sku: newSku,
      name: newName,
      category: newCategory,
      stock: newStock,
      unitPrice: newUnitPrice,
    };
    populateTable();
    closeModal("editModal");
    showNotification("Product updated successfully!", "success");
  }

  function openAddProductModal() {
    $("#addProductName").value = "";
    $("#addSku").value = "";
    $("#addCategory").value = "";
    $("#addStock").value = "";
    $("#addUnitPrice").value = "";
    openModal("addModal");
  }

  function addProduct() {
    const name = $("#addProductName").value.trim();
    const sku = $("#addSku").value.trim();
    const category = $("#addCategory").value;
    const stock = parseInt($("#addStock").value, 10);
    const unitPrice = parseFloat($("#addUnitPrice").value);
    

    if (!name || !sku || !category || isNaN(stock) || isNaN(unitPrice)) {
      showNotification("Please fill in all required fields with valid values.", "error");
      return;
    }
    if (products.some((p) => p.sku === sku)) {
      showNotification("SKU code already exists. Please use a unique SKU.", "error");
      return;
    }

    products.push({ sku, name, category, stock, unitPrice });
    populateTable();
    closeModal("addModal");
    showNotification("Product added successfully!", "success");
  }

  function deleteProduct(sku) {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    if (
      window.confirm(
        `Are you sure you want to delete "${p.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      products = products.filter((x) => x.sku !== sku);
      populateTable();
      showNotification("Product deleted successfully!", "success");
    }
  }

  // ------------------ Export ------------------
  function exportData() {
    const header =
      "Product Name,SKU,Category,Stock,Unit Price,Total Value,Status\n";
    const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const rows = products
      .map((p) => {
        const totalValue = p.stock * p.unitPrice;
        let status = "In Stock";
        if (p.stock === 0) status = "Out of Stock";
        else if (p.stock <= 20) status = "Low Stock";
        return [
          csvEscape(p.name),
          csvEscape(p.sku),
          csvEscape(p.category),
          p.stock,
          p.unitPrice,
          totalValue,
          csvEscape(status),
          
        ].join(",");
      })
      .join("\n");
    const csv = "data:text/csv;charset=utf-8," + header + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Data exported successfully!", "success");
  }

  // expose for innerHTML buttons
  window.viewProduct = viewProduct;
  window.editProduct = editProduct;
  window.editFromView = editFromView;
  window.saveProduct = saveProduct;
  window.openAddProductModal = openAddProductModal;
  window.addProduct = addProduct;
  window.deleteProduct = deleteProduct;
  window.exportData = exportData;

  // ------------------ Mount once ------------------
  useEffect(() => {
    // initial render
    populateTable();

    // filters
    const onSearch = (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      applyFilters();
    };
    const onCat = (e) => {
      currentFilters.category = e.target.value;
      applyFilters();
    };
    const onStatus = (e) => {
      currentFilters.status = e.target.value;
      applyFilters();
    };

    const s = $("#searchInput");
    const c = $("#categoryFilter");
    const st = $("#statusFilter");

    s?.addEventListener("input", onSearch);
    c?.addEventListener("change", onCat);
    st?.addEventListener("change", onStatus);

    const onDocKey = (e) => {
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

    return () => {
      s?.removeEventListener("input", onSearch);
      c?.removeEventListener("change", onCat);
      st?.removeEventListener("change", onStatus);
      document.removeEventListener("keydown", onDocKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------ JSX ------------------
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
              <div className="stat-value" id="totalProductsStat">
                0
              </div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="totalUnitsStat">
                0
              </div>
              <div className="stat-label">Total Units</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="totalValueStat">
                LKR 0
              </div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="metric-card">
              <div className="stat-value" id="lowStockStat">
                0
              </div>
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
              />
              <select className="filter-select" id="categoryFilter">
                <option value="">All Categories</option>
                <option value="KidsBags">Kids Bags</option>
                <option value="SchoolBags">School Bags</option>
                <option value="LaptopBags">Laptop Bags</option>
                <option value="HandBags">Hand Bags</option>
                <option value="ToteBags">Tote Bags</option>
              </select>
              <select className="filter-select" id="statusFilter">
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div className="controls-right">
              <button className="export-btn" onClick={exportData}>
                📄 Export
              </button>
              
            </div>
          </section>

          <div className="filter-badges" id="filterBadges"></div>

          {/* Table */}
          <section className="inventory-table-container">
            <div className="table-header">
              <div className="table-title">📋 Current Inventory</div>
              <div className="table-info">
                Showing <span id="visibleCount">0</span> of{" "}
                <span id="totalCount">0</span> products
              </div>
            </div>

            <div className="table-wrapper">
              <table id="inventoryTable">
                <thead>
                  <tr>
                    <th onClick={() => sortTable(0)} style={{ cursor: "pointer" }}>
                      Product
                    </th>
                    <th onClick={() => sortTable(1)} style={{ cursor: "pointer" }}>
                      SKU
                    </th>
                    <th onClick={() => sortTable(2)} style={{ cursor: "pointer" }}>
                      Category
                    </th>
                    <th onClick={() => sortTable(3)} style={{ cursor: "pointer" }}>
                      Stock
                    </th>
                    <th onClick={() => sortTable(4)} style={{ cursor: "pointer" }}>
                      Value
                    </th>
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
            <button className="close-btn" onClick={() => closeModal("viewModal")}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="product-details" id="productDetails"></div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => closeModal("viewModal")}>
              Close
            </button>
            
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div id="editModal" className="modal" aria-hidden="true">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">✏ Edit Product</h2>
            <button className="close-btn" onClick={() => closeModal("editModal")}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <form id="editForm">
              <div className="form-group">
                <label className="form-label" htmlFor="editProductName">
                  Product Name
                </label>
                <input type="text" id="editProductName" className="form-input" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="editSku">
                    SKU Code
                  </label>
                  <input type="text" id="editSku" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editCategory">
                    Category
                  </label>
                  <select id="editCategory" className="form-input" required>
                    <option value="KidsBags">Kids Bags</option>
                <option value="SchoolBags">School Bags</option>
                <option value="LaptopBags">Laptop Bags</option>
                <option value="HandBags">Hand Bags</option>
                <option value="ToteBags">Tote Bags</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="editStock">
                    Stock Quantity
                  </label>
                  <input type="number" id="editStock" className="form-input" min="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editUnitPrice">
                    Unit Price (LKR)
                  </label>
                  <input
                    type="number"
                    id="editUnitPrice"
                    className="form-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editDescription">
                  Description
                </label>
                <textarea
                  id="editDescription"
                  className="form-input"
                  rows="3"
                  placeholder="Product description..."
                ></textarea>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => closeModal("editModal")}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveProduct}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <div id="addModal" className="modal" aria-hidden="true">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">➕ Add New Product</h2>
            <button className="close-btn" onClick={() => closeModal("addModal")}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <form id="addForm">
              <div className="form-group">
                <label className="form-label" htmlFor="addProductName">
                  Product Name
                </label>
                <input type="text" id="addProductName" className="form-input" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="addSku">
                    SKU Code
                  </label>
                  <input type="text" id="addSku" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="addCategory">
                    Category
                  </label>
                  <select id="addCategory" className="form-input" required>
                    <option value="">Select Category</option>
                    <option value="KidsBags">Kids Bags</option>
                <option value="SchoolBags">School Bags</option>
                <option value="LaptopBags">Laptop Bags</option>
                <option value="HandBags">Hand Bags</option>
                <option value="ToteBags">Tote Bags</option>

                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="addStock">
                    Stock Quantity
                  </label>
                  <input type="number" id="addStock" className="form-input" min="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="addUnitPrice">
                    Unit Price (LKR)
                  </label>
                  <input
                    type="number"
                    id="addUnitPrice"
                    className="form-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => closeModal("addModal")}>
              Cancel
            </button>
            <button className="btn-primary" onClick={addProduct}>
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInventory;
