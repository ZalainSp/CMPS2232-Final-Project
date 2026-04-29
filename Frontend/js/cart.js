document.addEventListener("DOMContentLoaded", () => {
    const apiBase = window.location.port === "3000" ? "" : "http://localhost:3000";
    const token = localStorage.getItem("token");
    const tableBody = document.getElementById("cart-table-body");
    const emptyState = document.getElementById("cart-empty-state");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    const subtotalEl = document.getElementById("summary-subtotal");
    const taxEl = document.getElementById("summary-tax");
    const deliveryEl = document.getElementById("summary-delivery");
    const totalEl = document.getElementById("summary-total");
    const itemCountEl = document.getElementById("cart-item-count");

    const DELIVERY_FEE = 5;
    const TAX_RATE = 0.125;
    let cartState = [];

    const readJsonSafely = async (res) => {
        const text = await res.text();

        try {
            return JSON.parse(text);
        } catch {
            throw new Error(`Expected JSON but received non-JSON response (status ${res.status})`);
        }
    };

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

    const syncCartState = (nextCart) => {
        cartState = Array.isArray(nextCart) ? nextCart : [];
        renderCart();
    };

    const updateCartItem = async (itemID, quantity) => {
        await fetch(`${apiBase}/api/cart/items/${itemID}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });
    };

    const removeCartItem = async (itemID) => {
        await fetch(`${apiBase}/api/cart/items/${itemID}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    };

    const clearCart = async () => {
        await fetch(`${apiBase}/api/cart`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    };

    const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

    const renderCart = () => {
        if (!tableBody || !emptyState) return;

        tableBody.innerHTML = "";

        if (!cartState.length) {
            emptyState.style.display = "block";
            if (itemCountEl) itemCountEl.textContent = "0 items";
            if (subtotalEl) subtotalEl.textContent = formatMoney(0);
            if (taxEl) taxEl.textContent = formatMoney(0);
            if (deliveryEl) deliveryEl.textContent = formatMoney(DELIVERY_FEE);
            if (totalEl) totalEl.textContent = formatMoney(DELIVERY_FEE);
            return;
        }

        emptyState.style.display = "none";

        cartState.forEach((item) => {
            const price = Number(item.basePrice);
            const qty = Number(item.quantity);
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                  <div class="item-name-cell">${item.itemName}</div>
                  <div class="item-sub">${item.portionSize ? `Portion: ${item.portionSize}` : item.cupSize ? `Cup: ${item.cupSize}` : ""}</div>
                </td>
                <td><span class="item-type-badge">${item.type || "item"}</span></td>
                <td class="item-price">${formatMoney(price)}</td>
                <td>
                  <div class="qty-control">
                    <button class="qty-btn" type="button" data-action="decrease" data-id="${item.itemID}">-</button>
                    <span class="qty-val">${qty}</span>
                    <button class="qty-btn" type="button" data-action="increase" data-id="${item.itemID}">+</button>
                  </div>
                </td>
                <td class="item-price">${formatMoney(price * qty)}</td>
                <td><button class="remove-x" type="button" data-action="remove" data-id="${item.itemID}">Remove</button></td>
            `;

            tableBody.appendChild(row);
        });

        const subtotal = cartState.reduce((sum, item) => sum + Number(item.basePrice) * Number(item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax + DELIVERY_FEE;
        const itemCount = cartState.reduce((sum, item) => sum + Number(item.quantity), 0);

        if (itemCountEl) itemCountEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
        if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
        if (taxEl) taxEl.textContent = formatMoney(tax);
        if (deliveryEl) deliveryEl.textContent = formatMoney(DELIVERY_FEE);
        if (totalEl) totalEl.textContent = formatMoney(total);
    };

    if (tableBody) {
        tableBody.addEventListener("click", async (event) => {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const itemID = Number(button.dataset.id);
            const target = cartState.find((item) => Number(item.itemID) === itemID);

            if (!target) return;

            const previousCart = cartState.map((item) => ({ ...item }));

            if (action === "increase") {
                syncCartState(
                    cartState.map((item) =>
                        Number(item.itemID) === itemID
                            ? { ...item, quantity: Number(item.quantity) + 1 }
                            : item,
                    ),
                );
                try {
                    await updateCartItem(itemID, Number(target.quantity) + 1);
                } catch (error) {
                    syncCartState(previousCart);
                    alert(error.message || "Unable to update cart item.");
                }
            } else if (action === "decrease") {
                const nextQuantity = Number(target.quantity) - 1;
                if (nextQuantity <= 0) {
                    syncCartState(cartState.filter((item) => Number(item.itemID) !== itemID));
                    try {
                        await removeCartItem(itemID);
                    } catch (error) {
                        syncCartState(previousCart);
                        alert(error.message || "Unable to update cart item.");
                    }
                } else {
                    syncCartState(
                        cartState.map((item) =>
                            Number(item.itemID) === itemID
                                ? { ...item, quantity: nextQuantity }
                                : item,
                        ),
                    );
                    try {
                        await updateCartItem(itemID, nextQuantity);
                    } catch (error) {
                        syncCartState(previousCart);
                        alert(error.message || "Unable to update cart item.");
                    }
                }
            } else if (action === "remove") {
                syncCartState(cartState.filter((item) => Number(item.itemID) !== itemID));
                try {
                    await removeCartItem(itemID);
                } catch (error) {
                    syncCartState(previousCart);
                    alert(error.message || "Unable to remove cart item.");
                }
                return;
            }
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", async () => {
            const previousCart = cartState.map((item) => ({ ...item }));
            syncCartState([]);

            try {
                await clearCart();
            } catch (error) {
                syncCartState(previousCart);
                alert(error.message || "Unable to clear cart.");
            }
        });
    }

    (async () => {
        cartState = await fetchCart();
        renderCart();
    })();
});
