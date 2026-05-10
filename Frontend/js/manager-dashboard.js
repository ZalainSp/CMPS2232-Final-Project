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

  if (!token || !user) {
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

  const readJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Unexpected server response (${res.status})`);
    }
  };

  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  const usernameEl = document.getElementById("users-name");
  const restaurantInfoEl = document.getElementById("restaurant-info");

  if (usernameEl) usernameEl.textContent = user.username || "Manager";
  if (restaurantInfoEl) {
    const name = user.restaurantName || "My Restaurant";
    const hours = user.openingHours || "Hours not set";
    restaurantInfoEl.textContent = `${name} — ${hours}`;
  }

  // ── UI refs ───────────────────────────────────────────────
  const listEl = document.getElementById("menu-list");
  const ordersQueueEl = document.getElementById("orders-queue");
  const formEl = document.getElementById("add-item-form");
  const addBtn = document.getElementById("add-item-btn");
  const cancelBtn = document.getElementById("cancel-add-btn");
  const saveBtn = document.getElementById("save-item-btn");
  const itemTypeEl = document.getElementById("item-type");
  const portionField = document.getElementById("portion-field");
  const cupField = document.getElementById("cup-field");
  const discountField = document.getElementById("discount-field");

  const statMenu = document.getElementById("stat-menu-items");
  const statCompleted = document.getElementById("stat-completed");
  const statRevenue = document.getElementById("stat-revenue");

  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  if (itemTypeEl) {
    itemTypeEl.addEventListener("change", () => {
      const t = itemTypeEl.value.toLowerCase();
      if (portionField)
        portionField.style.display = t === "food" ? "block" : "none";
      if (cupField) cupField.style.display = t === "drink" ? "block" : "none";
      if (discountField)
        discountField.style.display = t === "combo" ? "block" : "none";
    });
  }

  if (addBtn && formEl)
    addBtn.addEventListener("click", () => {
      formEl.style.display = formEl.style.display === "none" ? "block" : "none";
    });
  if (cancelBtn && formEl)
    cancelBtn.addEventListener("click", () => {
      formEl.style.display = "none";
      clearForm();
    });

  const clearForm = () => {
    ["item-name", "item-price", "discount-amount"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (itemTypeEl) itemTypeEl.value = "";
    if (portionField) portionField.style.display = "none";
    if (cupField) cupField.style.display = "none";
    if (discountField) discountField.style.display = "none";
  };

  const renderMenu = (items) => {
    if (!listEl) return;
    if (!items || !items.length) {
      listEl.innerHTML =
        "<p style='color:var(--gray);'>No menu items yet. Add your first item above.</p>";
      return;
    }
    listEl.innerHTML = "";
    items.forEach((item) => {
      const isCombo = item.type === "combo";
      const discount = Number(item.discountAmount || 0);
      const displayPrice = isCombo
        ? Math.max(0, Number(item.basePrice) - discount)
        : Number(item.basePrice);

      const row = document.createElement("div");
      row.className = "menu-row";
      row.innerHTML = `
                <span class="menu-row-name">${item.itemName}</span>
                <span class="menu-row-price">${fmt(displayPrice)}${isCombo && discount > 0 ? ` <span style="font-size:.75rem;color:var(--orange);">(Save ${fmt(discount)})</span>` : ""}</span>
                <span style="font-size:.75rem;color:var(--mid);text-transform:capitalize;">${item.type || "item"}</span>
                <div class="dot ${item.isAvailable ? "dot-on" : "dot-off"}" title="${item.isAvailable ? "Available" : "Unavailable"}"></div>
            `;
      listEl.appendChild(row);
    });
  };

  const STATUS_SEQUENCE = ["Pending", "Preparing", "Ready"];

  const renderOrdersQueue = (orders) => {
    if (!ordersQueueEl) return;
    if (!Array.isArray(orders) || orders.length === 0) {
      ordersQueueEl.innerHTML =
        "<p style='color:var(--gray);'>No active orders right now. 🎉</p>";
      return;
    }
    ordersQueueEl.innerHTML = "";
    orders.forEach((order) => {
      const statusClass = String(order.status || "pending")
        .toLowerCase()
        .replace(/\s+/g, "-");
      const currentIdx = STATUS_SEQUENCE.indexOf(order.status);
      const nextStatus =
        currentIdx >= 0 && currentIdx < STATUS_SEQUENCE.length - 1
          ? STATUS_SEQUENCE[currentIdx + 1]
          : null;

      const card = document.createElement("div");
      card.className = "orders-card";
      card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                  <div>
                    <div class="orders-id">#${order.orderID}</div>
                    <div class="orders-info">
                      <div class="orders-customer">${order.customerName || "Customer"}</div>
                      <div class="orders-items" style="font-size:.82rem;color:var(--gray);margin-top:.2rem;">${order.itemsSummary || "Items unavailable"}</div>
                    </div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;">
                    <span class="status status-${statusClass}">${order.status || "Pending"}</span>
                    ${
                      nextStatus
                        ? `<button class="btn btn-primary btn-sm advance-btn"
                               data-order-id="${order.orderID}"
                               data-next-status="${nextStatus}"
                               style="font-size:.78rem;padding:.3rem .8rem;">
                               → ${nextStatus}
                           </button>`
                        : ""
                    }
                  </div>
                </div>
            `;
      ordersQueueEl.appendChild(card);
    });

    ordersQueueEl.addEventListener("click", async (e) => {
      const btn = e.target.closest(".advance-btn");
      if (!btn) return;
      const orderID = btn.dataset.orderId;
      const nextStatus = btn.dataset.nextStatus;
      btn.disabled = true;
      try {
        const res = await apiFetch(`/api/managers/orders/${orderID}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await readJson(res);
        if (!res.ok || !data.success)
          throw new Error(data.message || "Update failed.");
        showToast(`Order #${orderID} → ${nextStatus}`, "success");
        await loadManagerOrders();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    });
  };

  const renderStats = (stats) => {
    if (statCompleted)
      statCompleted.textContent = String(stats?.completedToday ?? 0);
    if (statRevenue) statRevenue.textContent = fmt(stats?.revenueToday ?? 0);
  };

  const loadMenu = async () => {
    const res = await apiFetch(`/api/managers/${user.userID}/menu`);
    const data = await readJson(res);
    if (!res.ok)
      throw new Error(data.message || `Menu load failed (${res.status})`);
    const items = Array.isArray(data.items) ? data.items : [];
    renderMenu(items);
    if (statMenu) statMenu.textContent = String(items.length);
    return items;
  };

  const loadManagerOrders = async () => {
    const res = await apiFetch(`/api/managers/${user.userID}/orders`);
    const data = await readJson(res);
    if (!res.ok)
      throw new Error(data.message || `Orders load failed (${res.status})`);
    renderOrdersQueue(Array.isArray(data.orders) ? data.orders : []);
    renderStats(data.stats || {});
  };

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const itemName = val("item-name");
      const basePrice = parseFloat(val("item-price"));
      const itemType = val("item-type");
      const available = val("item-available") !== "false";

      // Validation
      if (!itemName) {
        showToast("Item name is required.", "error");
        return;
      }
      if (isNaN(basePrice) || basePrice < 0) {
        showToast("Please enter a valid price.", "error");
        return;
      }
      if (!itemType) {
        showToast("Please select an item type.", "error");
        return;
      }

      const payload = {
        itemName,
        basePrice,
        itemType,
        isAvailable: available,
        portionSize: val("portion-size") || "medium",
        cupSize: val("cup-size") || "medium",
        discountAmount: parseFloat(val("discount-amount")) || 0,
      };

      if (itemType === "food" && !payload.portionSize) {
        showToast("Portion size is required for food items.", "error");
        return;
      }
      if (itemType === "drink" && !payload.cupSize) {
        showToast("Cup size is required for drink items.", "error");
        return;
      }
      if (itemType === "combo") {
        if (isNaN(payload.discountAmount) || payload.discountAmount < 0) {
          showToast("Enter a valid discount amount.", "error");
          return;
        }
        if (payload.discountAmount > basePrice) {
          showToast("Discount cannot exceed the base price.", "error");
          return;
        }
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      try {
        const res = await apiFetch(`/api/managers/${user.userID}/menu`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const data = await readJson(res);
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to add item.");

        showToast(`"${itemName}" added to menu!`, "success");
        formEl.style.display = "none";
        clearForm();
        await loadMenu();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Item";
      }
    });
  }

  try {
    await loadMenu();
    await loadManagerOrders();
  } catch (err) {
    showToast(err.message, "error");
    if (listEl)
      listEl.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
    if (ordersQueueEl)
      ordersQueueEl.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
  }
});
