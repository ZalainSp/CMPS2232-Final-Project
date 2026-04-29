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

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!token || !user) return;

    const listEl = document.getElementById("menu-list");
    const ordersQueueEl = document.getElementById("orders-queue");
    const formEl = document.getElementById("add-item-form");
    const addBtn = document.getElementById("add-item-btn");
    const cancelBtn = document.getElementById("cancel-add-btn");
    const saveBtn = document.getElementById("save-item-btn");

    const itemType = document.getElementById("item-type");
    const portionField = document.getElementById("portion-field");
    const cupField = document.getElementById("cup-field");
    const discountField = document.getElementById("discount-field");

    const readValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const renderMenu = (items) => {
        if (!listEl) return;

        if (!items.length) {
            listEl.innerHTML = "<p>No menu items yet.</p>";
            return;
        }

        listEl.innerHTML = "";

        items.forEach((item) => {
            const row = document.createElement("div");
            row.className = "menu-row";
            row.innerHTML = `
                <span class="menu-row-name">${item.itemName}</span>
                <span class="menu-row-price">$${Number(item.basePrice).toFixed(2)}</span>
                <div class="dot ${item.isAvailable ? "dot-on" : "dot-off"}"></div>
            `;
            listEl.appendChild(row);
        });
    };

    const formatMoney = (value) => `$${Number(value).toFixed(2)}`;

    const renderOrdersQueue = (orders) => {
        if (!ordersQueueEl) return;

        if (!Array.isArray(orders) || orders.length === 0) {
            ordersQueueEl.innerHTML = "<p>No active orders right now.</p>";
            return;
        }

        ordersQueueEl.innerHTML = "";

        orders.forEach((order) => {
            const card = document.createElement("div");
            card.className = "orders-card";
            card.innerHTML = `
                <div class="orders-id">#${order.orderID}</div>
                <div class="orders-info">
                  <div class="orders-customer">${order.customerName || "Customer"}</div>
                  <div class="orders-items">${order.itemsSummary || "Items unavailable"}</div>
                </div>
                <span class="status status-${String(order.status || "pending").toLowerCase().replace(/\s+/g, "-")}">${order.status || "Pending"}</span>
            `;
            ordersQueueEl.appendChild(card);
        });
    };

    const renderStats = (stats) => {
        const activeOrders = document.getElementById("stat-active-orders");
        const completedToday = document.getElementById("stat-completed");
        const revenueToday = document.getElementById("stat-revenue");

        if (activeOrders) activeOrders.textContent = String(stats?.activeOrders ?? 0);
        if (completedToday) completedToday.textContent = String(stats?.completedToday ?? 0);
        if (revenueToday) revenueToday.textContent = formatMoney(stats?.revenueToday ?? 0);
    };

    const loadMenu = async () => {
        const res = await fetch(`${apiBase}/api/managers/${user.userID}/menu`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Unable to load manager menu (${res.status})`);
        }

        const data = await readJsonSafely(res);
        const items = Array.isArray(data.items) ? data.items : [];
        renderMenu(items);

        const statMenu = document.getElementById("stat-menu-items");
        if (statMenu) {
            statMenu.textContent = String(items.length);
        }
    };

    const loadManagerOrders = async () => {
        const res = await fetch(`${apiBase}/api/managers/${user.userID}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Unable to load manager orders (${res.status})`);
        }

        const data = await readJsonSafely(res);
        renderOrdersQueue(Array.isArray(data.orders) ? data.orders : []);
        renderStats(data.stats || {});
    };

    if (itemType) {
        itemType.addEventListener("change", () => {
            const type = (itemType.value || "").toLowerCase();
            if (portionField) portionField.style.display = type === "food" ? "block" : "none";
            if (cupField) cupField.style.display = type === "drink" ? "block" : "none";
            if (discountField) discountField.style.display = type === "combo" ? "block" : "none";
        });
    }

    if (addBtn && formEl) {
        addBtn.addEventListener("click", () => {
            formEl.style.display = formEl.style.display === "none" ? "block" : "none";
        });
    }

    if (cancelBtn && formEl) {
        cancelBtn.addEventListener("click", () => {
            formEl.style.display = "none";
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            const payload = {
                itemName: readValue("item-name").trim(),
                basePrice: Number(readValue("item-price")),
                itemType: readValue("item-type"),
                portionSize: readValue("portion-size"),
                cupSize: readValue("cup-size"),
                discountAmount: Number(readValue("discount-amount") || 0),
                isAvailable: readValue("item-available") === "true"
            };

            if (!payload.itemName || Number.isNaN(payload.basePrice) || !payload.itemType) {
                alert("Please fill item name, price, and type.");
                return;
            }

            saveBtn.disabled = true;

            try {
                const res = await fetch(`${apiBase}/api/managers/${user.userID}/menu`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await readJsonSafely(res);
                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Unable to create item");
                }

                alert("Menu item added successfully.");
                if (formEl) formEl.style.display = "none";

                const itemName = document.getElementById("item-name");
                const itemPrice = document.getElementById("item-price");
                const itemTypeEl = document.getElementById("item-type");
                const discount = document.getElementById("discount-amount");
                if (itemName) itemName.value = "";
                if (itemPrice) itemPrice.value = "";
                if (itemTypeEl) itemTypeEl.value = "";
                if (discount) discount.value = "";

                if (portionField) portionField.style.display = "none";
                if (cupField) cupField.style.display = "none";
                if (discountField) discountField.style.display = "none";

                await loadMenu();
            } catch (err) {
                alert(err.message || "Unable to add menu item.");
            } finally {
                saveBtn.disabled = false;
            }
        });
    }

    try {
        await loadMenu();
        await loadManagerOrders();
    } catch (err) {
        if (listEl) {
            listEl.innerHTML = `<p>${err.message}</p>`;
        }
        if (ordersQueueEl) {
            ordersQueueEl.innerHTML = `<p>${err.message}</p>`;
        }
    }
});
