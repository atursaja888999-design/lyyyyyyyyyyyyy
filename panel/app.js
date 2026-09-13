const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  loginMessage.textContent =
    "Login belum aktif. Tahap berikutnya adalah membuat API, database D1, dan autentikasi admin.";
});
