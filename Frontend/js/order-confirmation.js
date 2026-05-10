document.addEventListener("DOMContentLoaded", () => {
  let orderData = null;
  try {
    orderData = JSON.parse(localStorage.getItem("lastOrder") || "null");
  } catch {
    orderData = null;
  }

  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  const orderIdEl = document.getElementById("display-order-id");
  const itemsEl = document.getElementById("confirm-items");
  const addressEl = document.getElementById("confirm-address");
  const deliveryTypeEl = document.getElementById("confirm-delivery-type");
  const notesRowEl = document.getElementById("confirm-notes-row");
  const notesEl = document.getElementById("confirm-notes");
  const paymentEl = document.getElementById("confirm-payment");
  const subtotalEl = document.getElementById("confirm-subtotal");
  const discountRowEl = document.getElementById("confirm-discount-row");
  const discountEl = document.getElementById("confirm-discount");
  const taxEl = document.getElementById("confirm-tax");
  const deliveryFeeEl = document.getElementById("confirm-delivery-fee");
  const totalEl = document.getElementById("confirm-total");
  const trackLinkTop = document.getElementById("track-link");
  const trackLinkBot = document.getElementById("track-link-bottom");

  if (!orderData) {
    if (itemsEl)
      itemsEl.innerHTML =
        "<p>No recent order found. <a href='dashboard-customer.html'>Back to menu</a></p>";
    return;
  }

  const order = orderData.order || orderData;
  const summary = orderData.summary || {};
  const items = Array.isArray(order.items) ? order.items : [];

  if (orderIdEl) orderIdEl.textContent = `#${order.orderID ?? "—"}`;

  const trackURL = order.orderID
    ? `order-tracking.html?orderID=${order.orderID}`
    : "order-tracking.html";
  if (trackLinkTop) trackLinkTop.href = trackURL;
  if (trackLinkBot) trackLinkBot.href = trackURL;

  if (itemsEl) {
    if (!items.length) {
      itemsEl.innerHTML =
        "<p style='color:var(--gray);'>No item details available.</p>";
    } else {
      itemsEl.innerHTML = items
        .map((item) => {
          const isCombo = item.type === "combo";
          const discount = Number(item.discountAmount || 0);
          const unitPrice = isCombo
            ? Math.max(0, Number(item.basePrice) - discount)
            : Number(item.basePrice);
          const lineTotal = Number(
            item.lineTotal ?? unitPrice * Number(item.quantity),
          );

          let subText = "";
          if (item.portionSize) subText = ` · ${item.portionSize}`;
          else if (item.cupSize) subText = ` · ${item.cupSize}`;
          else if (isCombo && discount > 0)
            subText = ` · Save ${fmt(discount)}`;

          return `
                    <div class="summary-item" style="display:flex;justify-content:space-between;align-items:flex-start;padding:.4rem 0;border-bottom:1px solid var(--light);">
                      <div>
                        <div style="font-weight:500;">${item.itemName}${subText}</div>
                        <div style="font-size:.82rem;color:var(--gray);">
                          Qty ${item.quantity} × ${fmt(unitPrice)}
                          ${isCombo ? '<span style="color:var(--orange);margin-left:.4rem;">Combo</span>' : ""}
                        </div>
                      </div>
                      <div style="font-weight:600;">${fmt(lineTotal)}</div>
                    </div>
                `;
        })
        .join("");
    }
  }

  const deliveryAddress = order.deliveryAddress || "Saved delivery address";
  const deliveryType = order.deliveryType || "standard";
  const notes = order.deliveryNotes || "";
  const payment = order.paymentMethod || "Cash";

  if (addressEl) addressEl.textContent = deliveryAddress;
  if (deliveryTypeEl)
    deliveryTypeEl.textContent =
      deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1);
  if (paymentEl) paymentEl.textContent = payment;

  if (notesRowEl && notesEl) {
    if (notes) {
      notesRowEl.style.display = "flex";
      notesEl.textContent = notes;
    } else {
      notesRowEl.style.display = "none";
    }
  }

  const subtotal = Number(summary.subtotal ?? order.subtotal ?? 0);
  const discount = Number(summary.discount ?? order.discount ?? 0);
  const tax = Number(summary.tax ?? order.tax ?? 0);
  const deliveryFee = Number(summary.deliveryFee ?? order.deliveryFee ?? 0);
  const total = Number(summary.total ?? order.total ?? 0);

  if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
  if (taxEl) taxEl.textContent = fmt(tax);
  if (deliveryFeeEl) deliveryFeeEl.textContent = fmt(deliveryFee);
  if (totalEl) totalEl.textContent = fmt(total);

  if (discountRowEl && discountEl) {
    if (discount > 0) {
      discountRowEl.style.display = "flex";
      discountEl.textContent = `-${fmt(discount)}`;
    } else {
      discountRowEl.style.display = "none";
    }
  }
});
