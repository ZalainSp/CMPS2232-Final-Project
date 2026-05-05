document.addEventListener("DOMContentLoaded", () => {
    const deactivateBtn = document.getElementById("deactivate-btn");

    if (deactivateBtn) {
        deactivateBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
                return;
            }

            const token = localStorage.getItem("token");
            const apiBase = window.location.port === "3000" ? "" : "http://localhost:3000";

            try {
                const res = await fetch(`${apiBase}/api/auth/account`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "Failed to deactivate account");
                    return;
                }

                alert("Account deactivated successfully. Redirecting...");
                localStorage.clear();
                window.location.href = "/html/login.html";
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    }
});
