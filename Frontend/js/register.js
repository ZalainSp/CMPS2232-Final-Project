document.addEventListener("DOMContentLoaded", () => {
    const apiBase = window.location.port === "3000" ? "" : "http://localhost:3000";
    const form = document.querySelector(".form");

    const resetRegisterForm = () => {
        if (!form) return;

        form.reset();
        ["reg-username", "reg-email", "reg-contact", "reg-address", "reg-restaurant", "reg-hours", "reg-vehicle", "reg-password", "reg-confirm"].forEach((id) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = "";
            }
        });

        const tabs = document.querySelectorAll(".role-tab");
        tabs.forEach((tab) => tab.classList.remove("active"));
        tabs[0]?.classList.add("active");

        const fieldAddress = document.getElementById("field-address");
        const fieldManager = document.getElementById("field-manager");
        const fieldDriver = document.getElementById("field-driver");
        if (fieldAddress) fieldAddress.style.display = "block";
        if (fieldManager) fieldManager.style.display = "none";
        if (fieldDriver) fieldDriver.style.display = "none";
    };

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

    if (!form) return;

    resetRegisterForm();

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            resetRegisterForm();
        }
    });

    form.addEventListener("submit", async (e) => {
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

        try {
            const res = await fetch(`${apiBase}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Registration failed");
                return;
            }

            window.location.href = "login.html";
        } catch (err) {
            alert(err.message || "Registration failed");
        }
    });

    function reg(id) {
        return document.getElementById(id)?.value || null;
    }
});