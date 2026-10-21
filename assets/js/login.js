// Учебная форма входа: проверяет только формат email и длину пароля.
applyTheme();
if (getUser()) location.href = "dashboard.html";

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const err = document.getElementById("err");

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    err.textContent = "Введите корректный email.";
    return;
  }
  if (password.length < 4) {
    err.textContent = "Пароль должен содержать минимум 4 символа.";
    return;
  }

  const name = email.split("@")[0];
  saveData(KEYS.user, { name, email, role });
  location.href = "dashboard.html";
});
