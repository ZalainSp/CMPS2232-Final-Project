document.addEventListener("DOMContentLoaded", () => {
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

    const formatMoney = (value) => `$${Number(value).toFixed(2)}`;

    const itemsList = document.getElementById("checkout-items-list");
    const subtotalEl = document.getElementById("co-subtotal");
    const taxEl = document.getElementById("co-tax");
    const deliveryEl = document.getElementById("co-delivery");
    const totalEl = document.getElementById("co-total");
    const placeOrderBtn = document.getElementById("place-order-btn");
    const promoInput = document.getElementById("promo-input");
    const deliveryPills = document.querySelectorAll(".delivery-pill");
    const addressInput = document.getElementById("delivery-address");
    const cityInput = document.getElementById("delivery-city");
    const notesInput = document.getElementById("delivery-notes");
    const paymentOption = document.querySelector(".payment-option.selected");

    let deliveryType = document.querySelector(".delivery-pill.selected")?.dataset.type || "standard";

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

    const getDeliveryFee = () => (deliveryType === "priority" ? 10 : 5);

    const render = async () => {
        if (!itemsList) return;

        const cart = await fetchCart();

        if (!cart.length) {
            itemsList.innerHTML = "<p style='color:var(--gray);'>Your cart is empty.</p>";
            if (subtotalEl) subtotalEl.textContent = formatMoney(0);
            if (taxEl) taxEl.textContent = formatMoney(0);
            if (deliveryEl) deliveryEl.textContent = formatMoney(getDeliveryFee());
            if (totalEl) totalEl.textContent = formatMoney(getDeliveryFee());
            return;
        }

        itemsList.innerHTML = cart
            .map((item) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.basePrice) || 0;
                return `
                    <div class="summary-item">
                        <div>
                            <div class="summary-item-name">${item.itemName}</div>
                            <div class="summary-item-meta">Qty ${qty}</div>
                        </div>
                        <div class="summary-item-price">${formatMoney(price * qty)}</div>
                    </div>
                `;
            })
            .join("");

        const subtotal = cart.reduce((sum, item) => sum + (Number(item.basePrice) || 0) * (Number(item.quantity) || 1), 0);
        const tax = subtotal * 0.125;
        const deliveryFee = getDeliveryFee();
        const total = subtotal + tax + deliveryFee;

        if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
        if (taxEl) taxEl.textContent = formatMoney(tax);
        if (deliveryEl) deliveryEl.textContent = formatMoney(deliveryFee);
        if (totalEl) totalEl.textContent = formatMoney(total);
    };

    deliveryPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            deliveryPills.forEach((node) => node.classList.remove("selected"));
            pill.classList.add("selected");
            deliveryType = pill.dataset.type || "standard";
            render();
        });
    });

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async () => {
            const cartItems = await fetchCart();

            if (!cartItems.length) {
                alert("Your cart is empty.");
                return;
            }

            if (!token) {
                alert("Please sign in again.");
                return;
            }

            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = "Placing Order...";

            try {
                const response = await fetch(`${apiBase}/api/customers/orders`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        cartItems,
                        deliveryType,
                        promoCode: promoInput?.value?.trim() || null,
                        deliveryAddress: [addressInput?.value?.trim(), cityInput?.value?.trim()].filter(Boolean).join(", ") || null,
                        deliveryNotes: notesInput?.value?.trim() || null,
                        paymentMethod: paymentOption?.dataset.method || "cash"
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to place order");
                }

                localStorage.setItem("lastOrder", JSON.stringify(data.order));
                localStorage.removeItem("cartItems");
                window.location.href = "/html/order-confirmation.html";
            } catch (error) {
                alert(error.message);
            } finally {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = "Place Order";
            }
        });
    }

    render();
});