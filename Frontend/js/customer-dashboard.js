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

    const readCart = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem("cartItems") || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem("cartItems", JSON.stringify(cart));
    };

    const updateActiveOrdersBadge = () => {
        const cart = readCart();
        const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const pill = document.getElementById("active-orders-pill");
        if (pill) {
            pill.innerHTML = `<span class="pulse-dot"></span> Active items: ${totalQty}`;
        }
    };

    const addToCart = (item) => {
        const cart = readCart();
        const existing = cart.find((c) => Number(c.itemID) === Number(item.itemID));

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                itemID: item.itemID,
                itemName: item.itemName,
                basePrice: Number(item.basePrice),
                type: item.type,
                portionSize: item.portionSize || null,
                cupSize: item.cupSize || null,
                discountAmount: item.discountAmount || null,
                quantity: 1
            });
        }

        saveCart(cart);
        updateActiveOrdersBadge();
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

            addToCart(selected);
            button.textContent = "✓";
            setTimeout(() => {
                button.textContent = "+";
            }, 600);
        });

        updateActiveOrdersBadge();
    } catch (err) {
        grid.innerHTML = `<p>Unable to load menu: ${err.message}</p>`;
    }
});
