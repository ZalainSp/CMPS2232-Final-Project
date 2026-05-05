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

    const orderGroups = Array.isArray(order.orders) && order.orders.length > 0
        ? order.orders
        : (order.order ? [order.order] : [order]);

    const summary = order.summary || orderGroups.reduce((acc, group) => {
        acc.subtotal += Number(group.subtotal || 0);
        acc.discount += Number(group.discount || 0);
        acc.tax += Number(group.tax || 0);
        acc.deliveryFee += Number(group.deliveryFee || 0);
        acc.total += Number(group.total || 0);
        return acc;
    }, { subtotal: 0, discount: 0, tax: 0, deliveryFee: 0, total: 0 });

    if (orderIdEl) {
        const groupedOrderIds = orderGroups.map((group) => group.orderID).filter(Boolean).join(", ");
        orderIdEl.textContent = groupedOrderIds || order.orderID || "—";
    }
    if (itemsEl) {
        itemsEl.innerHTML = orderGroups
            .map((group) => {
                const items = Array.isArray(group.items) ? group.items : [];
                const itemsHtml = items.length
                    ? items.map((item) => `<div class="summary-item"><span>${item.itemName} x ${item.quantity}</span><span>${formatMoney(item.lineTotal ?? 0)}</span></div>`).join("")
                    : "<p>No item details available.</p>";
                return `
                    <div class="confirm-card" style="margin-bottom:1rem;">
                        <div class="card-heading">Restaurant ${group.restaurantID ?? "—"} Bill #${group.orderID ?? "—"}</div>
                        ${itemsHtml}
                        <div class="total-line"><span>Subtotal</span><span>${formatMoney(group.subtotal || 0)}</span></div>
                        <div class="total-line"><span>GST (12.5%)</span><span>${formatMoney(group.tax || 0)}</span></div>
                        <div class="total-line"><span>Delivery Fee</span><span>${formatMoney(group.deliveryFee || 0)}</span></div>
                        <div class="total-line"><span>Restaurant Total</span><span>${formatMoney(group.total || 0)}</span></div>
                    </div>
                `;
            })
            .join("");
    }
    const firstOrder = orderGroups[0] || order;
    if (addressEl) addressEl.textContent = firstOrder.deliveryAddress || order.deliveryAddress || "Saved delivery address";
    if (deliveryTypeEl) deliveryTypeEl.textContent = firstOrder.deliveryType || order.deliveryType || "standard";
    if (paymentEl) paymentEl.textContent = firstOrder.paymentMethod || order.paymentMethod || "Cash on Delivery";
    if (subtotalEl) subtotalEl.textContent = formatMoney(summary.subtotal || 0);
    if (taxEl) taxEl.textContent = formatMoney(summary.tax || 0);
    if (deliveryFeeEl) deliveryFeeEl.textContent = formatMoney(summary.deliveryFee || 0);
    if (totalEl) totalEl.textContent = formatMoney(summary.total || 0);
});