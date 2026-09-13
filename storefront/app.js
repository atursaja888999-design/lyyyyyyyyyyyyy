const yearElement = document.querySelector("#year");
const trackingForm = document.querySelector("#track-form");
const trackingMessage = document.querySelector("#track-message");
const gameButtons = document.querySelectorAll(".select-game");

yearElement.textContent = new Date().getFullYear();

trackingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const orderCode = new FormData(trackingForm).get("orderCode").trim();

  trackingMessage.textContent =
    `Pengecekan untuk invoice ${orderCode} akan diaktifkan setelah API dan panel admin selesai dibuat.`;
});

gameButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedGame = button.dataset.game;

    alert(
      `Produk ${selectedGame} akan diarahkan ke halaman checkout setelah katalog dan API order dibuat.`
    );
  });
});
