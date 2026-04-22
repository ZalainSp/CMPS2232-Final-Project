document.addEventListener("DOMContentLoaded", () => {

    // ── SHOW/HIDE PASSWORD ──
    const showBtns = document.querySelectorAll(".show-btn");
    const passwordInputs = document.querySelectorAll("input[type='password']");

    showBtns.forEach((btn, index) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const input = passwordInputs[index];
            if (input) {
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                btn.textContent = isPassword ? "Hide" : "Show";
            }
        });
    });

    const tabs = document.querySelectorAll(".role-tab");
    let role = "Customer";

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            role = tab.textContent.trim();

            document.getElementById("field-address").style.display = role === "Customer" ? "block" : "none";
            document.getElementById("field-manager").style.display = role === "Manager" ? "block" : "none";
            document.getElementById("field-driver").style.display = role === "Driver" ? "block" : "none";
        });
    });

    document.querySelector(".form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const body = {
            role,
            username: reg("reg-username"),
            email: reg("reg-email"),
            contactNumber: reg("reg-contact"),
            password: reg("reg-password"),
            confirmPassword: reg("reg-confirm"),
            deliveryAddress: reg("reg-address"),
            restaurantName: reg("reg-restaurant"),
            openingHours: reg("reg-hours"),
            vehicleType: reg("reg-vehicle")
        };

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        window.location.href = "login.html";
    });

    function reg(id) {
        return document.getElementById(id)?.value || null;
    }
});