const API_BASE_URL = "https://aged-thunder-5aef.atursaja888999.workers.dev";

const gameInput = document.querySelector("#game-input");
const gamePicker = document.querySelector("#game-picker");
const gamePickerToggle = document.querySelector("#game-picker-toggle");
const gameDropdown = document.querySelector("#game-dropdown");
const gamePickerMessage = document.querySelector("#game-picker-message");
const productOptions = document.querySelector("#product-options");
const productMessage = document.querySelector("#product-message");
const dynamicAccountFields = document.querySelector("#dynamic-account-fields");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");
const createOrderButton = document.querySelector("#create-order-button");

const summaryGameIcon = document.querySelector("#summary-game-icon");
const summaryGameName = document.querySelector("#summary-game-name");
const summaryProductName = document.querySelector("#summary-product-name");
const summaryProductPrice = document.querySelector("#summary-product-price");
const checkoutTotal = document.querySelector("#checkout-total");

const trackModal = document.querySelector("#track-modal");
const trackForm = document.querySelector("#track-form");
const trackMessage = document.querySelector("#track-message");
const trackResult = document.querySelector("#track-result");

const successModal = document.querySelector("#success-modal");
const successProductText = document.querySelector("#success-product-text");
const successOrderCode = document.querySelector("#success-order-code");
const successTotalAmount = document.querySelector("#success-total-amount");
const yearElement = document.querySelector("#year");

let products = [];
let games = [];
let selectedGame = null;
let selectedProduct = null;

yearElement.textContent = new Date().getFullYear();

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(value) {
  return String(value || "G")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .replace(/^62/, "0");
}

function getInputSchema(product) {
  try {
    const parsed = JSON.parse(product?.input_schema || "{}");
    return Array.isArray(parsed.fields) ? parsed.fields : [];
  } catch {
    return [];
  }
}

function getProductsForGame(gameName) {
  return products
    .filter((product) => product.game_name === gameName)
    .sort((a, b) => Number(a.selling_price) - Number(b.selling_price));
}

function setMessage(element, message = "", type = "error") {
  element.textContent = message;
  element.style.color = type === "success" ? "var(--success)" : type === "info" ? "var(--muted)" : "var(--danger)";
}

function updateSummary() {
  const gameName = selectedGame || "Belum dipilih";
  const productName = selectedProduct ? selectedProduct.name : "-";
  const price = selectedProduct ? Number(selectedProduct.selling_price) : 0;

  summaryGameIcon.textContent = initials(selectedGame);
  summaryGameName.textContent = gameName;
  summaryProductName.textContent = productName;
  summaryProductPrice.textContent = rupiah(price);
  checkoutTotal.textContent = rupiah(price);
}

function clearAccountFields() {
  dynamicAccountFields.innerHTML = "";
}

function renderAccountFields() {
  if (!selectedProduct) {
    clearAccountFields();
    return;
  }

  const fields = getInputSchema(selectedProduct);

  if (!fields.length) {
    dynamicAccountFields.innerHTML = `
      <div class="empty-selection">Produk ini tidak membutuhkan data akun tambahan.</div>
    `;
    return;
  }

  dynamicAccountFields.innerHTML = fields
    .map((field) => {
      const name = String(field.name || "").trim();
      const label = String(field.label || name || "Data akun").trim();
      const required = field.required ? "required" : "";

      return `
        <label class="form-field">
          ${escapeHtml(label)}
          <input
            type="text"
            data-account-field="${escapeHtml(name)}"
            maxlength="100"
            placeholder="Masukkan ${escapeHtml(label)}"
            ${required}
          />
        </label>
      `;
    })
    .join("");
}

function renderProducts() {
  if (!selectedGame) {
    productOptions.innerHTML = `
      <div class="empty-selection">Pilih game terlebih dahulu untuk melihat nominal.</div>
    `;
    return;
  }

  const items = getProductsForGame(selectedGame);

  if (!items.length) {
    productOptions.innerHTML = `
      <div class="empty-selection">Produk untuk game ini belum tersedia.</div>
    `;
    return;
  }

  productOptions.innerHTML = items
    .map(
      (product) => `
        <button
          type="button"
          class="product-option ${selectedProduct?.id === product.id ? "is-selected" : ""}"
          data-product-id="${escapeHtml(product.id)}"
        >
          <b>${escapeHtml(product.name)}</b>
          <span>${rupiah(product.selling_price)}</span>
          ${selectedProduct?.id === product.id ? "<i>✓</i>" : ""}
        </button>
      `
    )
    .join("");
}

function renderGameDropdown(filter = "") {
  const keyword = filter.trim().toLowerCase();
  const filtered = games.filter((game) => game.toLowerCase().includes(keyword));

  if (!filtered.length) {
    gameDropdown.innerHTML = `
      <div class="empty-selection">Game tidak ditemukan.</div>
    `;
    return;
  }

  gameDropdown.innerHTML = filtered
    .map(
      (game) => `
        <button type="button" class="game-option ${selectedGame === game ? "is-selected" : ""}" data-game-name="${escapeHtml(game)}">
          <span class="game-option-icon">${escapeHtml(initials(game))}</span>
          <span class="game-option-copy">
            <b>${escapeHtml(game)}</b>
            <small>${getProductsForGame(game).length} nominal tersedia</small>
          </span>
        </button>
      `
    )
    .join("");
}

function openGameDropdown() {
  renderGameDropdown(gameInput.value);
  gameDropdown.classList.remove("is-hidden");
}

function closeGameDropdown() {
  gameDropdown.classList.add("is-hidden");
}

function selectGame(gameName) {
  selectedGame = gameName;
  selectedProduct = null;
  gameInput.value = gameName;
  setMessage(gamePickerMessage, "");
  setMessage(productMessage, "");
  closeGameDropdown();
  renderProducts();
  clearAccountFields();
  updateSummary();
}

function selectProduct(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) return;

  selectedProduct = product;
  setMessage(productMessage, "");
  renderProducts();
  renderAccountFields();
  updateSummary();
}

function accountValue(name) {
  const selector = `[data-account-field="${CSS.escape(name)}"]`;
  const input = document.querySelector(selector);
  return input ? input.value.trim() : "";
}

function primaryGameUserId() {
  const fields = getInputSchema(selectedProduct);
  const primary = fields.find((field) => field.name === "user_id") || fields[0];
  return primary ? accountValue(primary.name) : "";
}

function gameZone() {
  const fields = getInputSchema(selectedProduct);
  const zone = fields.find((field) => field.name === "zone_id" || field.name === "server");
  return zone ? accountValue(zone.name) : "";
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Katalog tidak dapat dimuat.");
    }

    products = data.data || [];
    games = [...new Set(products.map((product) => product.game_name))].sort((a, b) => a.localeCompare(b));
    renderGameDropdown();
    updateSummary();
  } catch (error) {
    productOptions.innerHTML = `
      <div class="empty-selection">Gagal memuat katalog. Silakan refresh halaman.</div>
    `;
    setMessage(gamePickerMessage, error.message || "Gagal memuat katalog.");
    console.error(error);
  }
}

async function createOrder(event) {
  event.preventDefault();

  if (!selectedGame) {
    setMessage(checkoutMessage, "Pilih game terlebih dahulu.");
    gameInput.focus();
    return;
  }

  if (!selectedProduct) {
    setMessage(checkoutMessage, "Pilih nominal produk terlebih dahulu.");
    return;
  }

  const fields = getInputSchema(selectedProduct);
  const missingField = fields.find((field) => field.required && !accountValue(field.name));

  if (missingField) {
    setMessage(checkoutMessage, `${missingField.label || "Data akun"} wajib diisi.`);
    const input = document.querySelector(`[data-account-field="${CSS.escape(missingField.name)}"]`);
    input?.focus();
    return;
  }

  const customerName = document.querySelector("#customer-name").value.trim();
  const customerPhone = normalizePhone(document.querySelector("#customer-phone").value);

  if (!customerName || !customerPhone) {
    setMessage(checkoutMessage, "Nama pelanggan dan nomor WhatsApp wajib diisi.");
    return;
  }

  const payload = {
    productId: selectedProduct.id,
    customerName,
    customerPhone,
    customerEmail: document.querySelector("#customer-email").value.trim(),
    gameUserId: primaryGameUserId(),
    gameZone: gameZone(),
    customerNote: document.querySelector("#customer-note").value.trim(),
    paymentMethod: document.querySelector("#payment-method").value
  };

  createOrderButton.disabled = true;
  createOrderButton.textContent = "Membuat Pesanan...";
  setMessage(checkoutMessage, "Menyimpan order ke sistem...", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Gagal membuat pesanan.");
    }

    successProductText.textContent = data.data.productName;
    successOrderCode.textContent = data.data.orderCode;
    successTotalAmount.textContent = rupiah(data.data.totalAmount);

    checkoutForm.reset();
    selectedGame = null;
    selectedProduct = null;
    gameInput.value = "";
    clearAccountFields();
    renderProducts();
    updateSummary();
    setMessage(checkoutMessage, "");
    openModal(successModal);
  } catch (error) {
    setMessage(checkoutMessage, error.message || "Terjadi kesalahan saat membuat pesanan.");
  } finally {
    createOrderButton.disabled = false;
    createOrderButton.innerHTML = "Buat Pesanan <span>→</span>";
  }
}

function openModal(element) {
  element.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(element) {
  element.classList.add("is-hidden");
  document.body.style.overflow = "";
}

function statusLabel(value) {
  const labels = {
    unpaid: "Belum dibayar",
    waiting_verification: "Menunggu verifikasi",
    paid: "Sudah dibayar",
    rejected: "Ditolak",
    expired: "Kedaluwarsa",
    refunded: "Refund",
    queued: "Masuk antrean",
    processing: "Sedang diproses",
    need_action: "Butuh tindakan",
    success: "Berhasil",
    failed: "Gagal",
    cancelled: "Dibatalkan"
  };

  return labels[value] || value || "-";
}

async function trackOrder(event) {
  event.preventDefault();

  const formData = new FormData(trackForm);
  const code = String(formData.get("orderCode") || "").trim();
  const phone = normalizePhone(formData.get("phone"));

  if (!code || !phone) {
    setMessage(trackMessage, "Nomor invoice dan WhatsApp wajib diisi.");
    return;
  }

  setMessage(trackMessage, "Memeriksa status pesanan...", "info");
  trackResult.classList.add("is-hidden");
  trackResult.innerHTML = "";

  try {
    const params = new URLSearchParams({ code, phone });
    const response = await fetch(`${API_BASE_URL}/api/orders/track?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Order tidak ditemukan.");
    }

    const order = data.data;
    setMessage(trackMessage, "");
    trackResult.innerHTML = `
      <strong>${escapeHtml(order.order_code)}</strong>
      <span>Produk: ${escapeHtml(order.product_name_snapshot)}</span>
      <span>Total: ${rupiah(order.total_amount)}</span>
      <span>Pembayaran: ${escapeHtml(statusLabel(order.payment_status))}</span>
      <span>Proses: ${escapeHtml(statusLabel(order.fulfillment_status))}</span>
    `;
    trackResult.classList.remove("is-hidden");
  } catch (error) {
    setMessage(trackMessage, error.message || "Gagal mengecek pesanan.");
  }
}

gameInput.addEventListener("focus", openGameDropdown);
gameInput.addEventListener("input", () => openGameDropdown());
gamePickerToggle.addEventListener("click", () => {
  if (gameDropdown.classList.contains("is-hidden")) {
    openGameDropdown();
  } else {
    closeGameDropdown();
  }
});

gameDropdown.addEventListener("click", (event) => {
  const option = event.target.closest("[data-game-name]");
  if (option) selectGame(option.dataset.gameName);
});

productOptions.addEventListener("click", (event) => {
  const option = event.target.closest("[data-product-id]");
  if (option) selectProduct(option.dataset.productId);
});

document.addEventListener("click", (event) => {
  if (!gamePicker.contains(event.target)) closeGameDropdown();

  if (event.target.closest("[data-open-track]")) {
    setMessage(trackMessage, "");
    trackResult.classList.add("is-hidden");
    openModal(trackModal);
  }

  if (event.target.closest("[data-close-track]")) closeModal(trackModal);
  if (event.target.closest("[data-close-success]")) closeModal(successModal);
});

checkoutForm.addEventListener("submit", createOrder);
trackForm.addEventListener("submit", trackOrder);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGameDropdown();
    closeModal(trackModal);
    closeModal(successModal);
  }
});

loadCatalog();
