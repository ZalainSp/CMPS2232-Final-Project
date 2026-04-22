document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".role-tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    const form = document.querySelector("form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.querySelector(".role-tab.active").textContent.trim();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "Login failed");
                return;
            }

            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.users));

            if (role === "Admin") window.location.href = "dashboard-admin.html";
            else if (role === "Customer") window.location.href = "dashboard-customer.html";
            else if (role === "Manager") window.location.href = "dashboard-manager.html";
            else window.location.href = "dashboard-driver.html";

        } catch (err) {
            console.error(err);
            alert("Server not responding");
        }
    });
});