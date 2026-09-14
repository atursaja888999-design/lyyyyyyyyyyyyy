const API_BASE_URL = "https://aged-thunder-5aef.atursaja888999.workers.dev";
const TOKEN_STORAGE_KEY = "gamestore_admin_token";

const loginView = document.querySelector("#login-view");
const appView = document.querySelector("#app-view");
const loginForm = document.querySelector("#login-form");
const adminTokenInput = document.querySelector("#admin-token");
const rememberTokenInput = document.querySelector("#remember-token");
const loginMessage = document.querySelector("#login-message");
const logoutButton = document.querySelector("#logout-button");
const refreshButton = document.querySelector("#refresh-button");
const topbarEyebrow = document.querySelector("#topbar-eyebrow");
const topbarTitle = document.querySelector("#topbar-title");

const dashboardSection = document.querySelector("#dashboard-section");
const ordersSection = document.querySelector("#orders-section");
const productsSection = document.querySelector("#products-section");
const navItems = document.querySelectorAll(".nav-item");

const recentOrdersBody = document.querySelector("#recent-orders-body");
const ordersBody = document.querySelector("#orders-body");
const recentEmpty = document.querySelector("#recent-empty");
const ordersEmpty = document.querySelector("#orders-empty");
const totalOrdersElement = document.querySelector("#stat-total-orders");
const unpaidElement = document.querySelector("#stat-unpaid");
const queuedElement = document.querySelector("#stat-queued");
const successElement = document.querySelector("#stat-success");
const searchInput = document.querySelector("#search-input");
const paymentFilter = document.querySelector("#payment-filter");
const fulfillmentFilter = document.querySelector("#fulfillment-filter");
const filterButton = document.querySelector("#filter-button");

const orderModal = document.querySelector("#order-modal");
const modalOrderCode = document.querySelector("#modal-order-code");
const modalLoading = document.querySelector("#modal-loading");
const orderForm = document.querySelector("#order-form");
const orderFormMessage = document.querySelector("#order-form-message");
const timelineSection = document.querySelector("#order-timeline");
const timelineList = document.querySelector("#timeline-list");

const productsBody = document.querySelector("#products-body");
const productsEmpty = document.querySelector("#products-empty");
const productSearchInput = document.querySelector("#product-search-input");
const productStatusFilter = document.querySelector("#product-status-filter");
const productFilterButton = document.querySelector("#product-filter-button");
const addProductButton = document.querySelector("#add-product-button");
const productModal = document.querySelector("#product-modal");
const productModalTitle = document.querySelector("#product-modal-title");
const productForm = document.querySelector("#product-form");
const productFormMessage = document.querySelector("#product-form-message");
const productSubmitButton = document.querySelector("#product-submit-button");
const productProfitPreview = document.querySelector("#product-profit-preview");

let adminToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
let currentOrderCode = "";
let currentProductId = "";
let allOrders = [];
let currentSection = "dashboard";

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelStatus(value) {
  const labels = {
    unpaid: "Belum dibayar",
    waiting_verification: "Menunggu verifikasi",
    paid: "Sudah dibayar",
    rejected: "Ditolak",
    expired: "Kedaluwarsa",
    refunded: "Refund",
    draft: "Draft",
    queued: "Antrean",
    processing: "Diproses",
    need_action: "Butuh tindakan",
    success: "Berhasil",
    failed: "Gagal",
    cancelled: "Dibatalkan"
  };
  return labels[value] || value || "-";
}

function statusBadge(value) {
  return `<span class="badge badge-${escapeHtml(value)}">${escapeHtml(labelStatus(value))}</span>`;
}

function productStatusBadge(isActive) {
  const active = Number(isActive) === 1;
  return `<span class="badge badge-${active ? "active" : "inactive"}">${active ? "Aktif" : "Nonaktif"}</span>`;
}

function setToken(token, remember = false) {
  adminToken = token;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (remember) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function clearToken() {
  adminToken = "";
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getStoredToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

async function apiRequest(path, options = {}) {
  const headers = {
    Authorization: `Bearer ${adminToken}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({ success: false, message: "Respons API tidak valid." }));

  if (response.status === 401) {
    clearToken();
    showLogin();
    throw new Error("Token admin salah atau sesi sudah berakhir.");
  }

  if (!response.ok || !data.success) throw new Error(data.message || "Permintaan ke API gagal.");
  return data;
}

function showLogin() {
  loginView.classList.remove("is-hidden");
  appView.classList.add("is-hidden");
  adminTokenInput.value = "";
  loginMessage.textContent = "";
}

function showApp() {
  loginView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
}

function sectionTitle(section) {
  const titles = {
    dashboard: ["DASHBOARD ADMIN", "Kelola transaksi toko"],
    orders: ["MANAJEMEN ORDER", "Semua transaksi"],
    products: ["MANAJEMEN KATALOG", "Kelola produk game"]
  };
  return titles[section] || titles.dashboard;
}

function switchSection(section) {
  currentSection = section;
  dashboardSection.classList.toggle("is-hidden", section !== "dashboard");
  ordersSection.classList.toggle("is-hidden", section !== "orders");
  productsSection.classList.toggle("is-hidden", section !== "products");

  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.section === section));
  const [eyebrow, title] = sectionTitle(section);
  topbarEyebrow.textContent = eyebrow;
  topbarTitle.textContent = title;

  if (section === "orders") loadOrders().catch(showPageError);
  if (section === "products") loadProducts().catch(showPageError);
}

function showPageError(error) {
  alert(error.message || "Terjadi kesalahan.");
}

function orderRow(order) {
  return `
    <tr>
      <td><span class="invoice">${escapeHtml(order.order_code)}</span><span class="cell-subtext">${escapeHtml(order.game_user_id || "-")}</span></td>
      <td>${escapeHtml(order.customer_name)}<span class="cell-subtext">${escapeHtml(order.customer_phone)}</span></td>
      <td>${escapeHtml(order.product_name_snapshot)}<span class="cell-subtext">${escapeHtml(order.game_name)}</span></td>
      <td>${rupiah(order.total_amount)}</td>
      <td>${statusBadge(order.payment_status)}</td>
      <td>${statusBadge(order.fulfillment_status)}</td>
      <td>${formatDate(order.created_at)}</td>
      <td><button class="small-button" data-open-order="${escapeHtml(order.order_code)}">Detail</button></td>
    </tr>
  `;
}

function renderOrders(orders, targetBody, emptyElement) {
  targetBody.innerHTML = orders.map(orderRow).join("");
  emptyElement.classList.toggle("is-hidden", orders.length > 0);
}

function updateStats(orders) {
  totalOrdersElement.textContent = orders.length;
  unpaidElement.textContent = orders.filter((order) => order.payment_status === "unpaid").length;
  queuedElement.textContent = orders.filter((order) => order.fulfillment_status === "queued").length;
  successElement.textContent = orders.filter((order) => order.fulfillment_status === "success").length;
}

async function loadDashboard() {
  const data = await apiRequest("/api/admin/orders?limit=100");
  allOrders = data.data || [];
  updateStats(allOrders);
  renderOrders(allOrders.slice(0, 8), recentOrdersBody, recentEmpty);
}

async function loadOrders() {
  const params = new URLSearchParams({ limit: "200" });
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (paymentFilter.value) params.set("paymentStatus", paymentFilter.value);
  if (fulfillmentFilter.value) params.set("fulfillmentStatus", fulfillmentFilter.value);

  ordersBody.innerHTML = '<tr><td colspan="8">Memuat order...</td></tr>';
  const data = await apiRequest(`/api/admin/orders?${params.toString()}`);
  renderOrders(data.data || [], ordersBody, ordersEmpty);
}

function productRow(product) {
  const profit = Number(product.selling_price || 0) - Number(product.base_cost || 0);
  const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
  return `
    <tr>
      <td><span class="product-name">${escapeHtml(product.name)}</span><span class="cell-subtext">${escapeHtml(product.game_name)} · ${escapeHtml(product.category)}</span></td>
      <td><span>${escapeHtml(product.sku)}</span><span class="cell-subtext">${escapeHtml(product.supplier_name || "Tanpa supplier")}${product.supplier_sku ? ` · ${escapeHtml(product.supplier_sku)}` : ""}</span></td>
      <td>${rupiah(product.base_cost)}</td>
      <td>${rupiah(product.selling_price)}</td>
      <td class="${profitClass}">${rupiah(profit)}</td>
      <td>${escapeHtml(product.sort_order)}</td>
      <td>${productStatusBadge(product.is_active)}</td>
      <td><button class="small-button" data-edit-product="${escapeHtml(product.id)}">Edit</button></td>
    </tr>
  `;
}

function renderProducts(products) {
  productsBody.innerHTML = products.map(productRow).join("");
  productsEmpty.classList.toggle("is-hidden", products.length > 0);
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (productSearchInput.value.trim()) params.set("search", productSearchInput.value.trim());
  if (productStatusFilter.value !== "") params.set("isActive", productStatusFilter.value);

  productsBody.innerHTML = '<tr><td colspan="8">Memuat produk...</td></tr>';
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/api/admin/products${suffix}`);
  renderProducts(data.data || []);
}

async function refreshData() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Memuat...";
  try {
    if (currentSection === "dashboard") await loadDashboard();
    if (currentSection === "orders") await loadOrders();
    if (currentSection === "products") await loadProducts();
  } catch (error) {
    showPageError(error);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Refresh Data";
  }
}

function openOrderModal() {
  orderModal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
}

function closeOrderModal() {
  orderModal.classList.add("is-hidden");
  document.body.style.overflow = "";
  currentOrderCode = "";
  orderForm.reset();
  orderForm.classList.add("is-hidden");
  timelineSection.classList.add("is-hidden");
  modalLoading.classList.remove("is-hidden");
  orderFormMessage.textContent = "";
}

function setValue(selector, value) {
  document.querySelector(selector).value = value ?? "";
}

function calculateAndShowTotal() {
  const sellingPrice = Number(document.querySelector("#edit-selling-price").value || 0);
  const discountAmount = Number(document.querySelector("#edit-discount-amount").value || 0);
  const paymentFee = Number(document.querySelector("#edit-payment-fee").value || 0);
  document.querySelector("#detail-total-amount").value = rupiah(Math.max(0, sellingPrice - discountAmount + paymentFee));
}

function renderTimeline(logs) {
  if (!logs.length) {
    timelineList.innerHTML = '<div class="timeline-item"><strong>Belum ada riwayat perubahan</strong></div>';
    return;
  }
  timelineList.innerHTML = logs.map((log) => `
    <article class="timeline-item">
      <strong>${escapeHtml(log.action || "ORDER_UPDATED")}</strong>
      <p>${escapeHtml(log.field_name || "-")}: ${escapeHtml(log.old_value ?? "-")} → ${escapeHtml(log.new_value ?? "-")}</p>
      <small>${escapeHtml(log.reason || "-")} · ${formatDate(log.created_at)}</small>
    </article>
  `).join("");
}

async function openOrderDetail(orderCode) {
  currentOrderCode = orderCode;
  openOrderModal();
  try {
    const result = await apiRequest(`/api/admin/orders/${encodeURIComponent(orderCode)}`);
    const order = result.data.order;
    const logs = result.data.logs || [];
    const estimatedProfit = Number(order.total_amount || 0) - Number(order.base_cost_snapshot || 0);

    modalOrderCode.textContent = order.order_code;
    document.querySelector("#detail-product-name").textContent = order.product_name_snapshot || "-";
    document.querySelector("#detail-game-name").textContent = order.game_name || "-";
    document.querySelector("#detail-base-cost").textContent = rupiah(order.base_cost_snapshot);
    document.querySelector("#detail-profit").textContent = rupiah(estimatedProfit);

    setValue("#edit-customer-name", order.customer_name);
    setValue("#edit-customer-phone", order.customer_phone);
    setValue("#edit-customer-email", order.customer_email);
    setValue("#edit-game-user-id", order.game_user_id);
    setValue("#edit-game-zone", order.game_zone);
    setValue("#edit-supplier-reference", order.supplier_reference);
    setValue("#edit-selling-price", order.selling_price_snapshot);
    setValue("#edit-discount-amount", order.discount_amount);
    setValue("#edit-payment-fee", order.payment_fee);
    setValue("#edit-payment-status", order.payment_status);
    setValue("#edit-fulfillment-status", order.fulfillment_status);
    setValue("#edit-customer-note", order.customer_note);
    setValue("#edit-internal-note", order.internal_note);
    setValue("#edit-reason", "");

    calculateAndShowTotal();
    renderTimeline(logs);
    modalLoading.classList.add("is-hidden");
    orderForm.classList.remove("is-hidden");
    timelineSection.classList.remove("is-hidden");
  } catch (error) {
    modalLoading.textContent = error.message;
  }
}

async function saveOrder(event) {
  event.preventDefault();
  if (!currentOrderCode) return;

  const submitButton = orderForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Menyimpan...";
  orderFormMessage.textContent = "";

  const payload = {
    customerName: document.querySelector("#edit-customer-name").value,
    customerPhone: document.querySelector("#edit-customer-phone").value,
    customerEmail: document.querySelector("#edit-customer-email").value,
    gameUserId: document.querySelector("#edit-game-user-id").value,
    gameZone: document.querySelector("#edit-game-zone").value,
    supplierReference: document.querySelector("#edit-supplier-reference").value,
    sellingPrice: Number(document.querySelector("#edit-selling-price").value),
    discountAmount: Number(document.querySelector("#edit-discount-amount").value),
    paymentFee: Number(document.querySelector("#edit-payment-fee").value),
    paymentStatus: document.querySelector("#edit-payment-status").value,
    fulfillmentStatus: document.querySelector("#edit-fulfillment-status").value,
    customerNote: document.querySelector("#edit-customer-note").value,
    internalNote: document.querySelector("#edit-internal-note").value,
    reason: document.querySelector("#edit-reason").value
  };

  try {
    await apiRequest(`/api/admin/orders/${encodeURIComponent(currentOrderCode)}`, { method: "PATCH", body: JSON.stringify(payload) });
    orderFormMessage.style.color = "var(--success)";
    orderFormMessage.textContent = "Perubahan berhasil disimpan.";
    await loadDashboard();
    if (currentSection === "orders") await loadOrders();
    await openOrderDetail(currentOrderCode);
  } catch (error) {
    orderFormMessage.style.color = "var(--danger)";
    orderFormMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Simpan Perubahan";
  }
}

function openProductModal(product = null) {
  currentProductId = product?.id || "";
  productForm.reset();
  productFormMessage.textContent = "";
  productFormMessage.style.color = "var(--danger)";
  productModalTitle.textContent = product ? "Edit produk" : "Tambah produk";
  productSubmitButton.textContent = product ? "Simpan Perubahan" : "Simpan Produk";

  if (product) {
    setValue("#product-game-name", product.game_name);
    setValue("#product-category", product.category);
    setValue("#product-sku", product.sku);
    setValue("#product-name", product.name);
    setValue("#product-base-cost", product.base_cost);
    setValue("#product-selling-price", product.selling_price);
    setValue("#product-sort-order", product.sort_order);
    setValue("#product-is-active", product.is_active);
    setValue("#product-supplier-name", product.supplier_name);
    setValue("#product-supplier-sku", product.supplier_sku);
    setValue("#product-description", product.description);
    setValue("#product-input-schema", product.input_schema);
  } else {
    setValue("#product-base-cost", 0);
    setValue("#product-selling-price", 0);
    setValue("#product-sort-order", 0);
    setValue("#product-is-active", 1);
  }

  updateProductProfitPreview();
  productModal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
  document.querySelector("#product-game-name").focus();
}

function closeProductModal() {
  productModal.classList.add("is-hidden");
  document.body.style.overflow = "";
  currentProductId = "";
  productForm.reset();
  productFormMessage.textContent = "";
}

function updateProductProfitPreview() {
  const baseCost = Number(document.querySelector("#product-base-cost").value || 0);
  const sellingPrice = Number(document.querySelector("#product-selling-price").value || 0);
  const profit = sellingPrice - baseCost;
  productProfitPreview.textContent = rupiah(profit);
  productProfitPreview.style.color = profit >= 0 ? "var(--success)" : "var(--danger)";
}

function getProductPayload() {
  return {
    gameName: document.querySelector("#product-game-name").value.trim(),
    category: document.querySelector("#product-category").value.trim(),
    sku: document.querySelector("#product-sku").value.trim(),
    name: document.querySelector("#product-name").value.trim(),
    baseCost: Number(document.querySelector("#product-base-cost").value),
    sellingPrice: Number(document.querySelector("#product-selling-price").value),
    sortOrder: Number(document.querySelector("#product-sort-order").value),
    isActive: Number(document.querySelector("#product-is-active").value),
    supplierName: document.querySelector("#product-supplier-name").value.trim(),
    supplierSku: document.querySelector("#product-supplier-sku").value.trim(),
    description: document.querySelector("#product-description").value.trim(),
    inputSchema: document.querySelector("#product-input-schema").value.trim()
  };
}

async function saveProduct(event) {
  event.preventDefault();
  const payload = getProductPayload();

  if (!payload.gameName || !payload.category || !payload.sku || !payload.name) {
    productFormMessage.style.color = "var(--danger)";
    productFormMessage.textContent = "Nama game, kategori, SKU, dan nama produk wajib diisi.";
    return;
  }

  if (!Number.isInteger(payload.baseCost) || !Number.isInteger(payload.sellingPrice) || !Number.isInteger(payload.sortOrder) || payload.baseCost < 0 || payload.sellingPrice < 0 || payload.sortOrder < 0) {
    productFormMessage.style.color = "var(--danger)";
    productFormMessage.textContent = "Harga dan urutan harus berupa angka bulat nol atau lebih.";
    return;
  }

  if (payload.baseCost > payload.sellingPrice) {
    productFormMessage.style.color = "var(--danger)";
    productFormMessage.textContent = "Harga modal tidak boleh lebih besar dari harga jual.";
    return;
  }

  productSubmitButton.disabled = true;
  productSubmitButton.textContent = "Menyimpan...";
  productFormMessage.textContent = "";

  try {
    const isEditing = Boolean(currentProductId);
    await apiRequest(isEditing ? `/api/admin/products/${encodeURIComponent(currentProductId)}` : "/api/admin/products", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(payload)
    });
    closeProductModal();
    await loadProducts();
  } catch (error) {
    productFormMessage.style.color = "var(--danger)";
    productFormMessage.textContent = error.message;
  } finally {
    productSubmitButton.disabled = false;
    productSubmitButton.textContent = currentProductId ? "Simpan Perubahan" : "Simpan Produk";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = adminTokenInput.value.trim();
  if (!token) {
    loginMessage.textContent = "Token admin wajib diisi.";
    return;
  }

  loginMessage.style.color = "var(--muted)";
  loginMessage.textContent = "Memverifikasi token...";
  setToken(token, rememberTokenInput.checked);

  try {
    await loadDashboard();
    showApp();
  } catch (error) {
    clearToken();
    loginMessage.style.color = "var(--danger)";
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", () => {
  closeOrderModal();
  closeProductModal();
  clearToken();
  showLogin();
});

refreshButton.addEventListener("click", refreshData);
navItems.forEach((item) => item.addEventListener("click", () => switchSection(item.dataset.section)));
document.querySelectorAll("[data-go-orders]").forEach((button) => button.addEventListener("click", () => switchSection("orders")));
filterButton.addEventListener("click", () => loadOrders().catch(showPageError));
productFilterButton.addEventListener("click", () => loadProducts().catch(showPageError));
addProductButton.addEventListener("click", () => openProductModal());

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadOrders().catch(showPageError);
});
productSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadProducts().catch(showPageError);
});

orderForm.addEventListener("submit", saveOrder);
productForm.addEventListener("submit", saveProduct);
["#edit-selling-price", "#edit-discount-amount", "#edit-payment-fee"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", calculateAndShowTotal);
});
["#product-base-cost", "#product-selling-price"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", updateProductProfitPreview);
});

document.addEventListener("click", (event) => {
  const orderButton = event.target.closest("[data-open-order]");
  if (orderButton) openOrderDetail(orderButton.dataset.openOrder);

  const productButton = event.target.closest("[data-edit-product]");
  if (productButton) {
    apiRequest(`/api/admin/products?search=${encodeURIComponent(productButton.dataset.editProduct)}`)
      .then((result) => {
        const product = (result.data || []).find((item) => item.id === productButton.dataset.editProduct);
        if (!product) throw new Error("Produk tidak ditemukan.");
        openProductModal(product);
      })
      .catch(showPageError);
  }

  if (event.target.closest("[data-close-order-modal]")) closeOrderModal();
  if (event.target.closest("[data-close-product-modal]")) closeProductModal();
});

const savedToken = getStoredToken();
if (savedToken) {
  adminToken = savedToken;
  loadDashboard().then(showApp).catch(() => {
    clearToken();
    showLogin();
  });
} else {
  showLogin();
}
