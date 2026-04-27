document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logout-btn") || document.querySelector(".sidebar-footer .btn-icon");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        try {
            if (token) {
                await fetch("http://localhost:3000/api/auth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            }
        } catch (err) {
            console.log("Backend logout failed, continuing...");
        }

        // FULL CLEAN
        localStorage.clear();
        sessionStorage.clear();

        // HARD redirect (prevents back button weirdness)
        window.location.replace("login.html");
    });

});