document.addEventListener("DOMContentLoaded", () => {
  const apiBase =
    window.location.port === "3000" ? "" : "http://localhost:3000";
  const token = localStorage.getItem("token");
  const tableBody = document.getElementById("cart-table-body");
  const emptyState = document.getElementById("cart-empty-state");
  const clearBtn = document.getElementById("clear-cart-btn");
  const promoInput = document.getElementById("promo-input");
  const promoApplyBtn = document.querySelector(".promo-row .btn-ghost");
  const promoMsg = document.getElementById("promo-applied-msg");
  const promoLabel = document.getElementById("promo-label");
  const removePromo = document.getElementById("remove-promo");
  const discountRow = document.getElementById("discount-row");
  const subtotalEl = document.getElementById("summary-subtotal");
  const discountEl = document.getElementById("summary-discount");
  const taxEl = document.getElementById("summary-tax");
  const deliveryEl = document.getElementById("summary-delivery");
  const totalEl = document.getElementById("summary-total");
  const itemCountEl = document.getElementById("cart-item-count");
  const deliveryOptions = document.querySelectorAll(".delivery-option");

  const TAX_RATE = 0.125;
  let DELIVERY_FEE = 5;
  let cartState = [];
  let appliedPromo = null;

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const showToast = (msg, type = "info") => {
    const existing = document.querySelector(".gb-toast");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = `gb-toast gb-toast-${type}`;
    el.textContent = msg;
    el.style.cssText = `
            position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
            padding:.75rem 1.25rem;border-radius:.5rem;font-size:.9rem;
            color:#fff;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,.18);
            background:${type === "success" ? "#27ae60" : type === "error" ? "#e74c3c" : "#2d2d2d"};
        `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  };

  const apiFetch = (url, options = {}) =>
    fetch(`${apiBase}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

  const fetchCart = async () => {
    const res = await apiFetch("/api/cart");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  };

  const updateCartItemAPI = (itemID, quantity) =>
    apiFetch(`/api/cart/items/${itemID}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });

  const removeCartItemAPI = (itemID) =>
    apiFetch(`/api/cart/items/${itemID}`, { method: "DELETE" });

  const clearCartAPI = () => apiFetch("/api/cart", { method: "DELETE" });

  const recalc = () => {
    const subtotal = cartState.reduce(
      (s, i) => s + Number(i.lineTotal || 0),
      0,
    );
    const discount = appliedPromo
      ? parseFloat((subtotal * (appliedPromo.discountPercent / 100)).toFixed(2))
      : 0;
    const taxable = subtotal - discount;
    const tax = parseFloat((taxable * TAX_RATE).toFixed(2));
    const total = parseFloat((taxable + tax + DELIVERY_FEE).toFixed(2));
    const itemCount = cartState.reduce((s, i) => s + Number(i.quantity), 0);

    if (itemCountEl)
      itemCountEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (taxEl) taxEl.textContent = fmt(tax);
    if (deliveryEl) deliveryEl.textContent = fmt(DELIVERY_FEE);
    if (totalEl) totalEl.textContent = fmt(total);

    if (discountRow && discountEl) {
      if (discount > 0) {
        discountRow.style.display = "flex";
        discountEl.textContent = `-${fmt(discount)}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (appliedPromo) {
      sessionStorage.setItem(
        "promoData",
        JSON.stringify({ ...appliedPromo, discount }),
      );
    }
  };

  const renderCart = () => {
    if (!tableBody || !emptyState) return;
    tableBody.innerHTML = "";

    if (!cartState.length) {
      emptyState.style.display = "block";
      recalc();
      return;
    }
    emptyState.style.display = "none";

    cartState.forEach((item) => {
      const price = Number(item.basePrice);
      const qty = Number(item.quantity);
      const isCombo = item.type === "combo";
      const discount = Number(item.discountAmount || 0);
      const unitPrice = isCombo ? Math.max(0, price - discount) : price;

      let subLabel = "";
      if (item.portionSize) subLabel = `Portion: ${item.portionSize}`;
      else if (item.cupSize) subLabel = `Cup: ${item.cupSize}`;
      else if (isCombo) subLabel = `Save ${fmt(discount)}`;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>
                  <div class="item-name-cell">${item.itemName}</div>
                  ${subLabel ? `<div class="item-sub">${subLabel}</div>` : ""}
                </td>
                <td><span class="item-type-badge ${isCombo ? "combo-badge" : ""}">${item.type || "item"}</span></td>
                <td class="item-price">${fmt(unitPrice)}</td>
                <td>
                  <div class="qty-control">
                    <button class="qty-btn" type="button" data-action="decrease" data-id="${item.itemID}">−</button>
                    <span class="qty-val">${qty}</span>
                    <button class="qty-btn" type="button" data-action="increase" data-id="${item.itemID}">+</button>
                  </div>
                </td>
                <td class="item-price">${fmt(Number(item.lineTotal || unitPrice * qty))}</td>
                <td><button class="remove-x" type="button" data-action="remove" data-id="${item.itemID}">✕</button></td>
            `;
      tableBody.appendChild(row);
    });

    recalc();
  };

  const syncCart = (next) => {
    cartState = Array.isArray(next) ? next : [];
    renderCart();
  };

  if (tableBody) {
    tableBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const itemID = Number(btn.dataset.id);
      const target = cartState.find((i) => Number(i.itemID) === itemID);
      if (!target) return;

      const prev = cartState.map((i) => ({ ...i }));

      if (action === "increase") {
        const nextQty = Number(target.quantity) + 1;
        syncCart(
          cartState.map((i) =>
            Number(i.itemID) === itemID
              ? {
                  ...i,
                  quantity: nextQty,
                  lineTotal:
                    (Number(i.basePrice) -
                      (i.type === "combo"
                        ? Number(i.discountAmount || 0)
                        : 0)) *
                    nextQty,
                }
              : i,
          ),
        );
        const r = await updateCartItemAPI(itemID, nextQty);
        if (!r.ok) {
          syncCart(prev);
          showToast("Failed to update quantity.", "error");
        }
      } else if (action === "decrease") {
        const nextQty = Number(target.quantity) - 1;
        if (nextQty <= 0) {
          syncCart(cartState.filter((i) => Number(i.itemID) !== itemID));
          const r = await removeCartItemAPI(itemID);
          if (!r.ok) {
            syncCart(prev);
            showToast("Failed to remove item.", "error");
          }
        } else {
          syncCart(
            cartState.map((i) =>
              Number(i.itemID) === itemID
                ? {
                    ...i,
                    quantity: nextQty,
                    lineTotal:
                      (Number(i.basePrice) -
                        (i.type === "combo"
                          ? Number(i.discountAmount || 0)
                          : 0)) *
                      nextQty,
                  }
                : i,
            ),
          );
          const r = await updateCartItemAPI(itemID, nextQty);
          if (!r.ok) {
            syncCart(prev);
            showToast("Failed to update quantity.", "error");
          }
        }
      } else if (action === "remove") {
        syncCart(cartState.filter((i) => Number(i.itemID) !== itemID));
        const r = await removeCartItemAPI(itemID);
        if (!r.ok) {
          syncCart(prev);
          showToast("Failed to remove item.", "error");
        } else showToast("Item removed from cart.", "info");
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (!cartState.length) return;
      if (!confirm("Clear all items from your cart?")) return;
      const prev = [...cartState];
      syncCart([]);
      const r = await clearCartAPI();
      if (!r.ok) {
        syncCart(prev);
        showToast("Failed to clear cart.", "error");
      } else showToast("Cart cleared.", "info");
    });
  }

  deliveryOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      deliveryOptions.forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
      DELIVERY_FEE = opt.dataset.type === "priority" ? 10 : 5;
      recalc();
    });
  });

  const applyPromo = async () => {
    const code = promoInput?.value?.trim();
    if (!code) {
      showToast("Please enter a promo code.", "error");
      return;
    }

    const subtotal = cartState.reduce(
      (s, i) => s + Number(i.lineTotal || 0),
      0,
    );

    const r = await apiFetch("/api/promo/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await r.json();

    if (!data.valid) {
      showToast(data.message || "Invalid promo code.", "error");
      return;
    }

    appliedPromo = {
      code,
      discountPercent: data.discountPercent,
      discount: data.discount,
    };
    if (promoMsg) promoMsg.style.display = "flex";
    if (promoLabel)
      promoLabel.textContent = `${data.discountPercent}% off applied`;
    showToast(data.message || "Promo code applied!", "success");
    recalc();
  };

  if (promoApplyBtn) promoApplyBtn.addEventListener("click", applyPromo);
  if (promoInput) {
    promoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromo();
      }
    });
  }

  if (removePromo) {
    removePromo.addEventListener("click", () => {
      appliedPromo = null;
      if (promoMsg) promoMsg.style.display = "none";
      if (promoInput) promoInput.value = "";
      sessionStorage.removeItem("promoData");
      showToast("Promo code removed.", "info");
      recalc();
    });
  }

  (async () => {
    cartState = await fetchCart();
    renderCart();

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const addrEl = document.getElementById("delivery-address");
      if (addrEl && user?.deliveryAddress) {
        addrEl.textContent = user.deliveryAddress;
      }
    } catch (_) {
      /* ignore */
    }
  })();
});
