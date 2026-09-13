const API_BASE_URL = "https://aged-thunder-5aef.atursaja888999.workers.dev";

const gameGrid = document.querySelector("#game-grid");
const catalogStatus = document.querySelector("#catalog-status");
const yearElement = document.querySelector("#year");

const trackForm = document.querySelector("#track-form");
const trackMessage = document.querySelector("#track-message");
const trackResult = document.querySelector("#track-result");

const checkoutModal = document.querySelector("#checkout-modal");
const checkoutGameTitle = document.querySelector("#checkout-game-title");
const checkoutStepProduct = document.querySelector("#checkout-step-product");
const checkoutProductList = document.querySelector("#checkout-product-list");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutSuccess = document.querySelector("#checkout-success");

const selectedProductName = document.querySelector("#selected-product-name");
const selectedProductPrice = document.querySelector("#selected-product-price");
const checkoutTotal = document.querySelector("#checkout-total");
const dynamicAccountFields = document.querySelector("#dynamic-account-fields");
const checkoutMessage = document.querySelector("#checkout-message");
const createOrderButton = document.querySelector("#create-order-button");

const changeProductButton = document.querySelector("#change-product-button");
const closeSuccessButton = document.querySelector("#close-success-button");

const successProductText = document.querySelector("#success-product-text");
const successOrderCode = document.querySelector("#success-order-code");
const successTotalAmount = document.querySelector("#success-total-amount");

let products = [];
let selectedGame = "";
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

function gameInitials(gameName) {
  return gameName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function colorClass(index) {
  const colors = [
    "game-icon-blue",
    "game-icon-orange",
    "game-icon-green",
    "game-icon-red"
  ];

  return colors[index % colors.length];
}

function groupProductsByGame(items) {
  return items.reduce((groups, product) => {
    if (!groups[product.game_name]) {
      groups[product.game_name] = [];
    }

    groups[product.game_name].push(product);
    return groups;
  }, {});
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal memuat katalog.");
    }

    products = result.data || [];
    renderGameCatalog();
    catalogStatus.textContent = `${products.length} produk tersedia`;
  } catch (error) {
    catalogStatus.textContent = "Katalog gagal dimuat";
    gameGrid.innerHTML = `
      <article class="loading-card">
        Gagal memuat produk. Silakan refresh halaman beberapa saat lagi.
      </article>
    `;
    console.error(error);
  }
}

function renderGameCatalog() {
  const grouped = groupProductsByGame(products);
  const entries = Object.entries(grouped);

  if (!entries.length) {
    gameGrid.innerHTML = `
      <article class="loading-card">
        Belum ada produk yang tersedia.
      </article>
    `;
    return;
  }

  gameGrid.innerHTML = entries
    .map(([gameName, gameProducts], index) => {
      const lowestPrice = Math.min(
        ...gameProducts.map((product) => Number(product.selling_price))
      );

      return `
        <article class="game-card">
          <div class="game-card-top">
            <div class="game-icon ${colorClass(index)}">
              ${escapeHtml(gameInitials(gameName))}
            </div>

            <div>
              <h3>${escapeHtml(gameName)}</h3>
              <p>
                ${gameProducts.length} nominal tersedia ·
                mulai ${rupiah(lowestPrice)}
              </p>
            </div>
          </div>

          <button class="select-game" data-game="${escapeHtml(gameName)}">
            Pilih nominal
          </button>
        </article>
      `;
    })
    .join("");
}

function openCheckout(gameName) {
  selectedGame = gameName;
  selectedProduct = null;

  checkoutGameTitle.textContent = `Top Up ${gameName}`;
  checkoutProductList.innerHTML = "";
  checkoutForm.reset();
  checkoutMessage.textContent = "";

  showProductStep();
  renderProductOptions();

  checkoutModal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  checkoutModal.classList.add("is-hidden");
  document.body.style.overflow = "";
  checkoutForm.reset();
  checkoutMessage.textContent = "";
}

function showProductStep() {
  checkoutStepProduct.classList.remove("is-hidden");
  checkoutForm.classList.add("is-hidden");
  checkoutSuccess.classList.add("is-hidden");
}

function showCheckoutForm() {
  checkoutStepProduct.classList.add("is-hidden");
  checkoutForm.classList.remove("is-hidden");
  checkoutSuccess.classList.add("is-hidden");
}

function renderProductOptions() {
  const gameProducts = products
    .filter((product) => product.game_name === selectedGame)
    .sort((a, b) => Number(a.selling_price) - Number(b.selling_price));

  checkoutProductList.innerHTML = gameProducts
    .map(
      (product) => `
        <button
          type="button"
          class="checkout-product-option"
          data-product-id="${escapeHtml(product.id)}"
        >
          <span>
            <b>${escapeHtml(product.name)}</b>
            <small>${escapeHtml(product.description || "Top up game")}</small>
          </span>

          <strong>${rupiah(product.selling_price)}</strong>
        </button>
      `
    )
    .join("");
}

function getInputSchema(product) {
  try {
    const parsed = JSON.parse(product.input_schema || "{}");
    return Array.isArray(parsed.fields) ? parsed.fields : [];
  } catch {
    return [];
  }
}

function renderDynamicAccountFields(product) {
  const fields = getInputSchema(product);

  dynamicAccountFields.innerHTML = fields
    .map((field) => {
      const fieldName = String(field.name || "").trim();
      const label = String(field.label || fieldName).trim();
      const required = field.required ? "required" : "";

      return `
        <label>
          ${escapeHtml(label)}
          <input
            type="text"
            data-account-field="${escapeHtml(fieldName)}"
            maxlength="100"
            ${required}
          />
        </label>
      `;
    })
    .join("");
}

function chooseProduct(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  selectedProduct = product;

  selectedProductName.textContent = product.name;
  selectedProductPrice.textContent = rupiah(product.selling_price);
  checkoutTotal.textContent = rupiah(product.selling_price);

  renderDynamicAccountFields(product);
  showCheckoutForm();
}

function getAccountFieldValue(fieldName) {
  const input = document.querySelector(
    `[data-account-field="${CSS.escape(fieldName)}"]`
  );

  return input ? input.value.trim() : "";
}

function getPrimaryGameUserId() {
  const fields = getInputSchema(selectedProduct);

  const userIdField =
    fields.find((field) => field.name === "user_id") || fields[0];

  return userIdField ? getAccountFieldValue(userIdField.name) : "";
}

function getGameZone() {
  const fields = getInputSchema(selectedProduct);

  const zoneField = fields.find(
    (field) => field.name === "zone_id" || field.name === "server"
  );

  return zoneField ? getAccountFieldValue(zoneField.name) : "";
}

function formatStatusLabel(value) {
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

  return labels[value] || value;
}

async function createOrder(event) {
  event.preventDefault();

  if (!selectedProduct) {
    checkoutMessage.textContent = "Pilih produk terlebih dahulu.";
    return;
  }

  const gameUserId = getPrimaryGameUserId();

  if (!gameUserId) {
    checkoutMessage.textContent = "Data akun game wajib diisi.";
    return;
  }

  const payload = {
    productId: selectedProduct.id,
    customerName: document.querySelector("#customer-name").value.trim(),
    customerPhone: document.querySelector("#customer-phone").value.trim(),
    customerEmail: document.querySelector("#customer-email").value.trim(),
    gameUserId,
    gameZone: getGameZone(),
    customerNote: document.querySelector("#customer-note").value.trim(),
    paymentMethod: document.querySelector("#payment-method").value
  };

  createOrderButton.disabled = true;
  createOrderButton.textContent = "Membuat pesanan...";
  checkoutMessage.style.color = "var(--muted)";
  checkoutMessage.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal membuat pesanan.");
    }

    successProductText.textContent = result.data.productName;
    successOrderCode.textContent = result.data.orderCode;
    successTotalAmount.textContent = rupiah(result.data.totalAmount);

    checkoutForm.classList.add("is-hidden");
    checkoutSuccess.classList.remove("is-hidden");
  } catch (error) {
    checkoutMessage.style.color = "var(--danger)";
    checkoutMessage.textContent =
      error.message || "Terjadi kesalahan saat membuat pesanan.";
  } finally {
    createOrderButton.disabled = false;
    createOrderButton.textContent = "Buat Pesanan";
  }
}

async function trackOrder(event) {
  event.preventDefault();

  const formData = new FormData(trackForm);
  const orderCode = String(formData.get("orderCode") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  trackMessage.style.color = "var(--muted)";
  trackMessage.textContent = "Memeriksa pesanan...";
  trackResult.classList.add("is-hidden");
  trackResult.innerHTML = "";

  try {
    const params = new URLSearchParams({
      code: orderCode,
      phone
    });

    const response = await fetch(
      `${API_BASE_URL}/api/orders/track?${params.toString()}`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Order tidak ditemukan.");
    }

    const order = result.data;

    trackMessage.textContent = "";
    trackResult.innerHTML = `
      <strong>${escapeHtml(order.order_code)}</strong>
      <span>Produk: ${escapeHtml(order.product_name_snapshot)}</span>
      <span>Total: ${rupiah(order.total_amount)}</span>
      <span>Pembayaran: ${escapeHtml(formatStatusLabel(order.payment_status))}</span>
      <span>Proses: ${escapeHtml(formatStatusLabel(order.fulfillment_status))}</span>
    `;

    trackResult.classList.remove("is-hidden");
  } catch (error) {
    trackMessage.style.color = "var(--danger)";
    trackMessage.textContent =
      error.message || "Gagal mengecek pesanan.";
  }
}

gameGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-game]");

  if (button) {
    openCheckout(button.dataset.game);
  }
});

checkoutProductList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-id]");

  if (button) {
    chooseProduct(button.dataset.productId);
  }
});

checkoutForm.addEventListener("submit", createOrder);
trackForm.addEventListener("submit", trackOrder);

changeProductButton.addEventListener("click", showProductStep);
closeSuccessButton.addEventListener("click", closeCheckout);

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-checkout]")) {
    closeCheckout();
  }
});

loadCatalog();
