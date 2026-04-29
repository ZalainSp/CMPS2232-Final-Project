document.addEventListener("DOMContentLoaded", async () => {
    const apiBase = window.location.port === "3000" ? "" : "http://localhost:3000";
    const token = localStorage.getItem("token");

    const readJsonSafely = async (res) => {
        const text = await res.text();

        try {
            return JSON.parse(text);
        } catch {
            throw new Error(`Expected JSON but received non-JSON response (status ${res.status})`);
        }
    };

    if (!token) return;

    const grid = document.getElementById("menu-grid");
    if (!grid) return;

    const ordersTableBody = document.getElementById("orders-table-body");

    const fetchCart = async () => {
        const res = await fetch(`${apiBase}/api/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            return [];
        }

        const data = await readJsonSafely(res);
        return Array.isArray(data.items) ? data.items : [];
    };

    const updateActiveOrdersBadge = async () => {
        const cart = await fetchCart();
        const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const pill = document.getElementById("active-orders-pill");
        if (pill) {
            pill.innerHTML = `<span class="pulse-dot"></span> Active items: ${totalQty}`;
        }
    };

    const addToCart = async (item) => {
        await fetch(`${apiBase}/api/cart/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                itemID: item.itemID,
                quantity: 1
            })
        });

        await updateActiveOrdersBadge();
    };

    const renderOrdersTable = (orders) => {
        if (!ordersTableBody) return;

        if (!Array.isArray(orders) || orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="color:var(--gray);padding:1rem 1.2rem;">No orders yet.</td>
                </tr>
            `;
            return;
        }

        ordersTableBody.innerHTML = orders
            .map((order) => {
                const placedAt = order.orderDate ? new Date(order.orderDate).toLocaleString() : "—";
                return `
                    <tr>
                        <td>#${order.orderID ?? "—"}</td>
                        <td>${placedAt}</td>
                        <td>${order.deliveryType || "—"}</td>
                        <td>${order.status || "—"}</td>
                    </tr>
                `;
            })
            .join("");
    };

    const loadOrdersHistory = async () => {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user?.userID) {
            renderOrdersTable([]);
            return;
        }

        const ordersRes = await fetch(`${apiBase}/api/customers/${user.userID}/orders`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (ordersRes.ok) {
            const ordersData = await readJsonSafely(ordersRes);
            renderOrdersTable(Array.isArray(ordersData.orders) ? ordersData.orders : []);
            return;
        }

        renderOrdersTable([]);
    };

    try {
        const res = await fetch(`${apiBase}/api/menu`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to load menu: ${res.status}`);
        }

        const data = await readJsonSafely(res);
        const items = (Array.isArray(data.items) ? data.items : []).filter((i) => i.isAvailable !== false);

        if (!items.length) {
            grid.innerHTML = "<p>No menu items available yet.</p>";
            updateActiveOrdersBadge();
            await loadOrdersHistory();
            return;
        }

        grid.innerHTML = "";

        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "menu-card";
            card.innerHTML = `
                <div class="menu-card-img">${item.itemName}</div>
                <div class="menu-card-body">
                    <div class="menu-card-name">${item.itemName}</div>
                    <div class="menu-card-meta">
                        <span class="price">$${Number(item.basePrice).toFixed(2)}</span>
                        <span class="tag">${item.type || "item"}</span>
                        <button class="add-btn" type="button" data-item-id="${item.itemID}">+</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        grid.addEventListener("click", (event) => {
            const button = event.target.closest("button.add-btn");
            if (!button) return;

            const itemID = Number(button.dataset.itemId);
            const selected = items.find((i) => Number(i.itemID) === itemID);
            if (!selected) return;

            addToCart(selected).then(() => {
                button.textContent = "✓";
                setTimeout(() => {
                    button.textContent = "+";
                }, 600);
            });
        });

        await updateActiveOrdersBadge();
        await loadOrdersHistory();
    } catch (err) {
        grid.innerHTML = `<p>Unable to load menu: ${err.message}</p>`;
    }
});
