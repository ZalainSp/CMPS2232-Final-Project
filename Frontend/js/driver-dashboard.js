document.addEventListener("DOMContentLoaded", async () => {
  const apiBase =
    window.location.port === "3000" ? "" : "http://localhost:3000";
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user || user.role !== "Driver") {
    window.location.href = "login.html";
    return;
  }

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

  const vehicleEl = document.getElementById("vehicle-info");
  if (vehicleEl)
    vehicleEl.textContent = user.vehicleType
      ? `🛵 ${user.vehicleType.charAt(0).toUpperCase() + user.vehicleType.slice(1)}`
      : "Vehicle Type";

  const statusSelect = document.getElementById("delivery-status");
  if (statusSelect) {
    statusSelect.innerHTML = `
            <option value="">Select status...</option>
            <option value="Out for Delivery">Out for Delivery (On the Way)</option>
            <option value="Delivered">Delivered</option>
        `;
  }

  const availToggle = document.getElementById("avail-toggle");
  if (availToggle) {
    availToggle.checked = Boolean(user.available);

    availToggle.addEventListener("change", async () => {
      const available = availToggle.checked;
      try {
        const res = await apiFetch(`/api/drivers/${user.userID}/availability`, {
          method: "PUT",
          body: JSON.stringify({ available }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Update failed.");
        showToast(data.message, "success");
        user.available = available;
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        showToast(err.message, "error");
        availToggle.checked = !available;
      }
    });
  }

  const deliveryCardsEl = document.getElementById("delivery-cards");

  const renderPendingOrders = (orders) => {
    if (!deliveryCardsEl) return;

    if (!orders.length) {
      deliveryCardsEl.innerHTML = `
                <div style="padding:1.5rem;color:var(--gray);text-align:center;">
                  No pending orders available right now. Check back soon!
                </div>`;
      return;
    }

    deliveryCardsEl.innerHTML = "";
    orders.forEach((order) => {
      const fee = order.deliveryType === "priority" ? "$10.00" : "$5.00";
      const card = document.createElement("div");
      card.className = "delivery-card";
      card.innerHTML = `
                <div class="delivery-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
                  <span class="delivery-id" style="font-weight:700;">#${order.orderID}</span>
                  <span class="status status-pending" style="font-size:.78rem;">${order.status}</span>
                </div>
                <div class="delivery-addr" style="font-size:.88rem;margin-bottom:.3rem;">
                  📍 ${order.deliveryAddress || "Address not set"}
                </div>
                <div class="delivery-meta" style="font-size:.82rem;color:var(--gray);margin-bottom:.8rem;">
                  🏪 ${order.restaurantName || `Restaurant #${order.restaurantID}`}
                  &nbsp;·&nbsp; ${order.deliveryType || "standard"} delivery
                </div>
                <div class="delivery-actions" style="display:flex;gap:.6rem;">
                  <button class="btn btn-primary btn-sm accept-btn"
                          data-order-id="${order.orderID}"
                          style="font-size:.84rem;padding:.45rem 1.1rem;">
                    Accept — ${fee}
                  </button>
                </div>
            `;
      deliveryCardsEl.appendChild(card);
    });
  };

  const loadPendingOrders = async () => {
    try {
      const res = await apiFetch("/api/orders/pending");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load orders.");
      renderPendingOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      if (deliveryCardsEl) {
        deliveryCardsEl.innerHTML = `<p style="color:var(--gray);">${err.message}</p>`;
      }
    }
  };

  if (deliveryCardsEl) {
    deliveryCardsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest(".accept-btn");
      if (!btn) return;

      const orderID = btn.dataset.orderId;
      btn.disabled = true;
      btn.textContent = "Accepting…";

      try {
        const res = await apiFetch(
          `/api/drivers/${user.userID}/accept/${orderID}`,
          {
            method: "POST",
          },
        );
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Could not accept order.");

        showToast(`Order #${orderID} accepted!`, "success");

        if (availToggle) availToggle.checked = false;
        user.available = false;
        localStorage.setItem("user", JSON.stringify(user));

        await loadPendingOrders();
        await loadDriverOrders();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "Accept";
      }
    });
  }

  const activeOrderIdInput = document.getElementById("active-orders-id");
  let activeOrders = [];

  const injectOrderPicker = (orders) => {
    const form = document.getElementById("status-update-form");
    if (!form) return;

    let picker = document.getElementById("active-order-picker");
    if (!picker) {
      const wrapper = document.createElement("div");
      wrapper.className = "field";
      wrapper.style.marginBottom = ".8rem";
      wrapper.innerHTML = `
                <label for="active-order-picker">Select Your Order</label>
                <select id="active-order-picker">
                  <option value="">Choose an order...</option>
                </select>
            `;
      form.insertBefore(wrapper, form.firstChild);
      picker = document.getElementById("active-order-picker");

      picker.addEventListener("change", () => {
        const selected = activeOrders.find(
          (o) => String(o.orderID) === picker.value,
        );
        if (activeOrderIdInput && selected) {
          activeOrderIdInput.value = `#${selected.orderID}`;
        } else if (activeOrderIdInput) {
          activeOrderIdInput.value = "";
        }
      });
    }

    picker.innerHTML = `<option value="">Choose an order...</option>`;
    orders.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.orderID;
      opt.textContent = `#${o.orderID} — ${o.status} (${o.restaurantName || `Restaurant #${o.restaurantID}`})`;
      picker.appendChild(opt);
    });
  };

  const loadDriverOrders = async () => {
    try {
      const res = await apiFetch(`/api/drivers/${user.userID}/orders`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load your orders.");
      activeOrders = Array.isArray(data.orders) ? data.orders : [];
      injectOrderPicker(activeOrders);

      const statEl = document.getElementById("stat-deliveries");
      if (statEl) statEl.textContent = String(data.deliveredToday ?? 0);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const statusForm = document.getElementById("status-update-form");
  const submitBtn = statusForm?.querySelector("button[type='submit']");

  if (submitBtn) {
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const picker = document.getElementById("active-order-picker");
      const orderID = picker?.value;
      const status = statusSelect?.value;

      if (!orderID) {
        showToast("Please select an order.", "error");
        return;
      }
      if (!status) {
        showToast("Please select a status.", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Updating…";

      try {
        const res = await apiFetch(`/api/drivers/orders/${orderID}/status`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Update failed.");

        showToast(`Order #${orderID} → ${status}`, "success");

        // If delivered, driver is now free again
        if (status === "Delivered") {
          if (availToggle) availToggle.checked = true;
          user.available = true;
          localStorage.setItem("user", JSON.stringify(user));
        }

        await loadPendingOrders();
        await loadDriverOrders();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Status";
      }
    });
  }

  await loadPendingOrders();
  await loadDriverOrders();
});
