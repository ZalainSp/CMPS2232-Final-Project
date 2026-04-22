document.addEventListener("DOMContentLoaded", () => {

    // 🔥 FORCE CLEAN STATE ON PAGE LOAD
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ── SHOW/HIDE PASSWORD ──
    const showBtn = document.querySelector(".show-btn");
    const passwordInput = document.getElementById("password");

    if (showBtn && passwordInput) {
        showBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            showBtn.textContent = isPassword ? "Hide" : "Show";
        });
    }

    const tabs = document.querySelectorAll(".role-tab");
    let role = "Customer";

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            role = tab.textContent.trim();
        });
    });

    const form = document.querySelector(".form");

    if (!form) return;

    // 🔥 prevent browser restoring old input
    setTimeout(() => {
        form.reset();
    }, 0);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        const res = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Login failed");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.users));

        window.location.href =
            role === "Admin" ? "dashboard-admin.html" :
            role === "Manager" ? "dashboard-manager.html" :
            role === "Driver" ? "dashboard-driver.html" :
            "dashboard-customer.html";
    });

    const guestBtn = document.querySelector(".btn-ghost");

    if (guestBtn) {
        guestBtn.addEventListener("click", async () => {
            await fetch("http://localhost:3000/api/auth/guest", {
                method: "POST"
            });

            window.location.href = "dashboard-customer.html";
        });
    }
});

const cleanForm = () => {
    const form = document.querySelector(".form");
    if (form) form.reset();
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    if (username) username.value = "";
    if (password) password.value = "";
};

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        cleanForm();
    }
});