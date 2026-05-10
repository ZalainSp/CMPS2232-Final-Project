document.addEventListener("DOMContentLoaded", () => {
  const apiBase =
    window.location.port === "3000" ? "" : "http://localhost:3000";
  const token = localStorage.getItem("token");

  // UI refs
  const itemsList = document.getElementById("checkout-items-list");
  const subtotalEl = document.getElementById("co-subtotal");
  const discountRow = document.getElementById("co-discount-row");
  const discountEl = document.getElementById("co-discount");
  const taxEl = document.getElementById("co-tax");
  const deliveryEl = document.getElementById("co-delivery");
  const totalEl = document.getElementById("co-total");
  const placeBtn = document.getElementById("place-order-btn");
  const promoInput = document.getElementById("promo-input");
  const promoApply =
    document.getElementById("promo-apply-btn") ||
    document.querySelector(".promo-row .btn-ghost");
  const promoMsg = document.getElementById("promo-applied-msg");
  const promoLabel = document.getElementById("promo-label");
  const removePromo = document.getElementById("remove-promo");
  const addressInput = document.getElementById("delivery-address");
  const cityInput = document.getElementById("delivery-city");
  const notesInput = document.getElementById("delivery-notes");
  const walletNotice = document.getElementById("wallet-notice");
  const deliveryPills = document.querySelectorAll(".delivery-pill");
  const paymentOpts = document.querySelectorAll(".payment-option");

  let deliveryType = "standard";
  let selectedPayment = "Cash";
  let appliedPromo = null;

  const TAX_RATE = 0.125;
  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  const showToast = (msg, type = "info") => {
    const old = document.querySelector(".gb-toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = `gb-toast gb-toast-${type}`;
    el.textContent = msg;
    el.style.cssText = `
            position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
            padding:.75rem 1.25rem;border-radius:.5rem;font-size:.9rem;color:#fff;
            max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,.18);
            background:${type === "success" ? "#27ae60" : type === "error" ? "#e74c3c" : "#2d2d2d"};
        `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  };

  const apiFetch = (url, opts = {}) =>
    fetch(`${apiBase}${url}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });

  const getDeliveryFee = () => (deliveryType === "priority" ? 10 : 5);

  try {
    const saved = JSON.parse(sessionStorage.getItem("promoData") || "null");
    if (saved && saved.code) {
      appliedPromo = saved;
      if (promoInput) promoInput.value = saved.code;
      if (promoMsg) promoMsg.style.display = "flex";
      if (promoLabel)
        promoLabel.textContent = `${saved.discountPercent}% off applied`;
    }
  } catch (_) {
    /*ignore*/
  }

  const fetchCart = async () => {
    const res = await apiFetch("/api/cart");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  };

  const render = async () => {
    if (!itemsList) return;
    const cart = await fetchCart();

    if (!cart.length) {
      itemsList.innerHTML =
        "<p style='color:var(--gray);'>Your cart is empty.</p>";
      [subtotalEl, taxEl, deliveryEl, totalEl].forEach((el, i) => {
        if (el)
          el.textContent = fmt([0, 0, getDeliveryFee(), getDeliveryFee()][i]);
      });
      return;
    }

    itemsList.innerHTML = cart
      .map((item) => {
        const qty = Number(item.quantity) || 1;
        const isCombo = item.type === "combo";
        const discount = Number(item.discountAmount || 0);
        const unitPrice = isCombo
          ? Math.max(0, Number(item.basePrice) - discount)
          : Number(item.basePrice);
        const lineTotal = unitPrice * qty;

        return `
                <div class="summary-item">
                  <div>
                    <div class="summary-item-name">${item.itemName}${isCombo ? ' <span style="font-size:.75rem;color:var(--orange);">(Combo)</span>' : ""}</div>
                    <div class="summary-item-meta">
                      Qty ${qty}
                      ${isCombo && discount > 0 ? `· Save ${fmt(discount)} each` : ""}
                    </div>
                  </div>
                  <div class="summary-item-price">${fmt(lineTotal)}</div>
                </div>
            `;
      })
      .join("");

    const subtotal = cart.reduce((s, i) => {
      const isCombo = i.type === "combo";
      const disc = isCombo ? Number(i.discountAmount || 0) : 0;
      return s + Math.max(0, Number(i.basePrice) - disc) * Number(i.quantity);
    }, 0);
    const promoDiscount = appliedPromo
      ? parseFloat((subtotal * (appliedPromo.discountPercent / 100)).toFixed(2))
      : 0;
    const taxable = subtotal - promoDiscount;
    const tax = parseFloat((taxable * TAX_RATE).toFixed(2));
    const fee = getDeliveryFee();
    const total = parseFloat((taxable + tax + fee).toFixed(2));

    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (taxEl) taxEl.textContent = fmt(tax);
    if (deliveryEl) deliveryEl.textContent = fmt(fee);
    if (totalEl) totalEl.textContent = fmt(total);

    if (discountRow && discountEl) {
      discountRow.style.display = promoDiscount > 0 ? "flex" : "none";
      if (discountEl) discountEl.textContent = `-${fmt(promoDiscount)}`;
    }
  };

  deliveryPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      deliveryPills.forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");
      deliveryType = pill.dataset.type || "standard";
      render();
    });
  });

  paymentOpts.forEach((opt) => {
    opt.addEventListener("click", () => {
      paymentOpts.forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
      selectedPayment = opt.dataset.method || "Cash";
      if (walletNotice)
        walletNotice.style.display =
          selectedPayment === "Digital Wallet" ? "block" : "none";
    });
  });

  const applyPromo = async () => {
    const code = promoInput?.value?.trim();
    if (!code) {
      showToast("Please enter a promo code.", "error");
      return;
    }

    const cart = await fetchCart();
    const subtotal = cart.reduce((s, i) => {
      const disc = i.type === "combo" ? Number(i.discountAmount || 0) : 0;
      return s + Math.max(0, Number(i.basePrice) - disc) * Number(i.quantity);
    }, 0);

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
    sessionStorage.setItem("promoData", JSON.stringify(appliedPromo));
    if (promoMsg) promoMsg.style.display = "flex";
    if (promoLabel)
      promoLabel.textContent = `${data.discountPercent}% off applied`;
    showToast(data.message || "Promo applied!", "success");
    render();
  };

  if (promoApply) promoApply.addEventListener("click", applyPromo);
  if (promoInput)
    promoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromo();
      }
    });

  if (removePromo) {
    removePromo.addEventListener("click", () => {
      appliedPromo = null;
      if (promoInput) promoInput.value = "";
      if (promoMsg) promoMsg.style.display = "none";
      sessionStorage.removeItem("promoData");
      showToast("Promo code removed.", "info");
      render();
    });
  }

  if (placeBtn) {
    placeBtn.addEventListener("click", async () => {
      const cart = await fetchCart();
      if (!cart.length) {
        showToast("Your cart is empty.", "error");
        return;
      }
      if (!token) {
        showToast("Please sign in again.", "error");
        return;
      }

      const addr =
        [addressInput?.value?.trim(), cityInput?.value?.trim()]
          .filter(Boolean)
          .join(", ") || null;
      const notes = notesInput?.value?.trim() || null;

      if (!addr) {
        showToast("Please enter your delivery address.", "error");
        return;
      }

      placeBtn.disabled = true;
      placeBtn.textContent = "Placing Order…";

      try {
        const res = await apiFetch("/api/customers/orders", {
          method: "POST",
          body: JSON.stringify({
            deliveryType,
            promoCode: appliedPromo?.code || null,
            deliveryAddress: addr,
            deliveryNotes: notes,
            paymentMethod: selectedPayment,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Unable to place order.");

        if (data.order) {
          data.order.deliveryAddress = addr;
          data.order.deliveryNotes = notes;
          data.order.paymentMethod = selectedPayment;
        }

        sessionStorage.removeItem("promoData");
        localStorage.setItem("lastOrder", JSON.stringify(data));
        window.location.href = "/html/order-confirmation.html";
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        placeBtn.disabled = false;
        placeBtn.textContent = "Place Order";
      }
    });
  }

  render();
});
