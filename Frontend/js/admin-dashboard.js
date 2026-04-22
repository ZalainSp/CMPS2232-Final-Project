document.addEventListener("DOMContentLoaded", async () => {

    const apiBase = window.location.port === "3000" ? "" : "http://localhost:3000";
    const token = localStorage.getItem("token");
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (user) {
        document.getElementById("users-name").textContent = user.username;
    }

    const tbody = document.getElementById("users-table-body");
    const statUsers = document.getElementById("stat-users");

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-user-id]");

        if (!button) {
            return;
        }

        const userID = button.dataset.userId;

        if (!userID) {
            return;
        }

        const confirmed = window.confirm(`Remove user #${userID}?`);

        if (!confirmed) {
            return;
        }

        button.disabled = true;

        try {
            const res = await fetch(`${apiBase}/api/admin/users/${userID}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error(`Failed to remove user: ${res.status}`);
            }

            const row = button.closest("tr");
            if (row) {
                row.remove();
            }

            const remainingRows = tbody.querySelectorAll("tr").length;
            statUsers.textContent = String(remainingRows);

            if (remainingRows === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">No users found</td>
                    </tr>
                `;
            }
        } catch (err) {
            alert(err.message || "Unable to remove user");
            button.disabled = false;
        }
    });

    try {
        statUsers.textContent = "Loading...";

        const res = await fetch(`${apiBase}/api/admin/users`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to load admin users: ${res.status}`);
        }

        const data = await res.json();

        const users = Array.isArray(data.users) ? data.users : [];

        statUsers.textContent = data.totalUsers ?? users.length ?? 0;

        tbody.innerHTML = "";

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">No users found</td>
                </tr>
            `;
            return;
        }

        users.forEach(u => {
            const userID = u.userID;
            const contactNumber = u.contactNumber;
            const role = u.role;

            tbody.innerHTML += `
                <tr data-user-id="${userID}">
                    <td>${userID}</td>
                    <td><strong>${u.username}</strong></td>
                    <td><span class="tag">${role}</span></td>
                    <td>${u.email}</td>
                    <td>${contactNumber}</td>
                    <td><span class="status status-ready">Active</span></td>
                    <td><button class="btn btn-danger btn-sm" data-user-id="${userID}">Remove</button></td>
                </tr>
            `;
        });

    } catch (err) {
        console.log("Failed to load admin stats", err);

        if (statUsers) {
            statUsers.textContent = "--";
        }

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load users: ${err.message}</td>
                </tr>
            `;
        }
    }
});