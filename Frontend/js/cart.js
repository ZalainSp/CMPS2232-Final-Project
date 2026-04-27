document.addEventListener("DOMContentLoaded", () => {
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

    const readCart = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem("cartItems") || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const writeCart = (cart) => {
        localStorage.setItem("cartItems", JSON.stringify(cart));
    };

    const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

    const render = () => {
        if (!tableBody || !emptyState) return;

        const cart = readCart();
        tableBody.innerHTML = "";

        if (!cart.length) {
            emptyState.style.display = "block";
            if (itemCountEl) itemCountEl.textContent = "0 items";
            if (subtotalEl) subtotalEl.textContent = formatMoney(0);
            if (taxEl) taxEl.textContent = formatMoney(0);
            if (deliveryEl) deliveryEl.textContent = formatMoney(DELIVERY_FEE);
            if (totalEl) totalEl.textContent = formatMoney(DELIVERY_FEE);
            return;
        }

        emptyState.style.display = "none";

        cart.forEach((item) => {
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

        const subtotal = cart.reduce((sum, item) => sum + Number(item.basePrice) * Number(item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax + DELIVERY_FEE;
        const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

        if (itemCountEl) itemCountEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
        if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
        if (taxEl) taxEl.textContent = formatMoney(tax);
        if (deliveryEl) deliveryEl.textContent = formatMoney(DELIVERY_FEE);
        if (totalEl) totalEl.textContent = formatMoney(total);
    };

    if (tableBody) {
        tableBody.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const itemID = Number(button.dataset.id);
            const cart = readCart();
            const target = cart.find((item) => Number(item.itemID) === itemID);

            if (!target) return;

            if (action === "increase") {
                target.quantity += 1;
            } else if (action === "decrease") {
                target.quantity -= 1;
            } else if (action === "remove") {
                const next = cart.filter((item) => Number(item.itemID) !== itemID);
                writeCart(next);
                render();
                return;
            }

            const next = cart.filter((item) => Number(item.quantity) > 0);
            writeCart(next);
            render();
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            writeCart([]);
            render();
        });
    }

    render();
});
