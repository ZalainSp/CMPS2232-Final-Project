document.addEventListener("DOMContentLoaded", () => {
    let order = null;

    try {
        order = JSON.parse(localStorage.getItem("lastOrder") || "null");
    } catch {
        order = null;
    }

    const formatMoney = (value) => `$${Number(value).toFixed(2)}`;

    const orderIdEl = document.getElementById("display-order-id");
    const itemsEl = document.getElementById("confirm-items");
    const addressEl = document.getElementById("confirm-address");
    const deliveryTypeEl = document.getElementById("confirm-delivery-type");
    const paymentEl = document.getElementById("confirm-payment");
    const subtotalEl = document.getElementById("confirm-subtotal");
    const taxEl = document.getElementById("confirm-tax");
    const deliveryFeeEl = document.getElementById("confirm-delivery-fee");
    const totalEl = document.getElementById("confirm-total");

    if (!order) {
        if (itemsEl) itemsEl.innerHTML = "<p>No recent order found.</p>";
        return;
    }

    if (orderIdEl) orderIdEl.textContent = order.orderID ?? "—";
    if (itemsEl) {
        itemsEl.innerHTML = (Array.isArray(order.items) ? order.items : []).length
            ? order.items.map((item) => `<div class="summary-item"><span>${item.itemName} x ${item.quantity}</span><span>${formatMoney(item.lineTotal ?? 0)}</span></div>`).join("")
            : "<p>No item details available.</p>";
    }
    if (addressEl) addressEl.textContent = order.deliveryAddress || "Saved delivery address";
    if (deliveryTypeEl) deliveryTypeEl.textContent = order.deliveryType || "standard";
    if (paymentEl) paymentEl.textContent = order.paymentMethod || "Cash on Delivery";
    if (subtotalEl) subtotalEl.textContent = formatMoney(order.subtotal || 0);
    if (taxEl) taxEl.textContent = formatMoney(order.tax || 0);
    if (deliveryFeeEl) deliveryFeeEl.textContent = formatMoney(order.deliveryFee || 0);
    if (totalEl) totalEl.textContent = formatMoney(order.total || 0);
});