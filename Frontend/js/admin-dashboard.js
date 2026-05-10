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

  if (!token) {
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

  if (user) {
    const nameEl = document.getElementById("users-name");
    if (nameEl) nameEl.textContent = user.username;
  }

  const tbody = document.getElementById("users-table-body");
  const statUsers = document.getElementById("stat-users");

  if (tbody) {
    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-user-id]");
      if (!btn) return;
      const userID = btn.dataset.userId;
      if (!confirm(`Remove user #${userID}? This cannot be undone.`)) return;
      btn.disabled = true;
      try {
        const res = await apiFetch(`/api/admin/users/${userID}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || `Failed (${res.status})`);
        }
        const row = btn.closest("tr");
        if (row) row.remove();
        const remaining = tbody.querySelectorAll("tr").length;
        if (statUsers) statUsers.textContent = String(remaining);
        if (remaining === 0) {
          tbody.innerHTML =
            "<tr><td colspan='7' style='color:var(--gray);padding:1rem;'>No users found.</td></tr>";
        }
        showToast(`User #${userID} removed.`, "success");
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    });
  }

  const loadUsers = async () => {
    if (statUsers) statUsers.textContent = "Loading…";
    try {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const data = await res.json();
      const users = Array.isArray(data.users) ? data.users : [];
      if (statUsers)
        statUsers.textContent = String(data.totalUsers ?? users.length);

      if (!tbody) return;
      tbody.innerHTML = "";
      if (!users.length) {
        tbody.innerHTML =
          "<tr><td colspan='7' style='color:var(--gray);padding:1rem;'>No users found.</td></tr>";
        return;
      }
      users.forEach((u) => {
        tbody.innerHTML += `
                    <tr data-user-id="${u.userID}">
                        <td>${u.userID}</td>
                        <td><strong>${u.username}</strong></td>
                        <td><span class="tag">${u.role}</span></td>
                        <td>${u.email}</td>
                        <td>${u.contactNumber || "—"}</td>
                        <td><span class="status status-ready">Active</span></td>
                        <td><button class="btn btn-danger btn-sm" data-user-id="${u.userID}">Remove</button></td>
                    </tr>
                `;
      });
    } catch (err) {
      showToast(err.message, "error");
      if (statUsers) statUsers.textContent = "--";
      if (tbody)
        tbody.innerHTML = `<tr><td colspan='7'>${err.message}</td></tr>`;
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiFetch("/api/admin/reports/orders");
      const data = await res.json();
      if (!res.ok) return;
      const ordEl = document.getElementById("stat-orders");
      if (ordEl) ordEl.textContent = data.totalOrders ?? "--";
    } catch (_) {
      /* non-fatal */
    }
  };

  const genBtn = document.getElementById("gen-report-btn");
  const reportPanel = document.getElementById("report-output");

  if (genBtn) {
    genBtn.addEventListener("click", async () => {
      const from = document.getElementById("report-from")?.value;
      const to = document.getElementById("report-to")?.value;
      genBtn.disabled = true;
      genBtn.textContent = "Generating…";
      try {
        const url = `/api/admin/reports/orders${from && to ? `?fromDate=${from}&toDate=${to}` : ""}`;
        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Report failed.");

        if (reportPanel) {
          reportPanel.style.display = "block";
          const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
          };
          set("rpt-orders", data.totalOrders ?? "--");
          set("rpt-sales", data.completedOrders ?? "--");
          set("rpt-avg", "--");
          set("rpt-revenue", "--");
        }
        showToast("Report generated.", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = "Generate Report";
      }
    });
  }

  const promoSection = document.getElementById("promo-section");
  if (promoSection) {
    const promoTbody = document.getElementById("promo-table-body");
    const addCodeInput = document.getElementById("new-promo-code");
    const addPctInput = document.getElementById("new-promo-pct");
    const addPromoBtn = document.getElementById("add-promo-btn");

    const loadPromos = async () => {
      try {
        const res = await apiFetch("/api/promo");
        const data = await res.json();
        if (!res.ok || !data.codes) return;
        if (!promoTbody) return;
        promoTbody.innerHTML = "";
        if (!data.codes.length) {
          promoTbody.innerHTML =
            "<tr><td colspan='4' style='color:var(--gray);padding:1rem;'>No promo codes yet.</td></tr>";
          return;
        }
        data.codes.forEach((p) => {
          promoTbody.innerHTML += `
                        <tr>
                            <td><strong>${p.code}</strong></td>
                            <td>${p.discountPercent}%</td>
                            <td><span class="status ${p.active ? "status-ready" : "status-cancelled"}">${p.active ? "Active" : "Inactive"}</span></td>
                            <td>${p.active ? `<button class="btn btn-ghost btn-sm deactivate-promo" data-code="${p.code}" style="font-size:.78rem;">Deactivate</button>` : "—"}</td>
                        </tr>
                    `;
        });
      } catch (_) {
        /* non-fatal */
      }
    };

    if (promoTbody) {
      promoTbody.addEventListener("click", async (e) => {
        const btn = e.target.closest(".deactivate-promo");
        if (!btn) return;
        const code = btn.dataset.code;
        if (!confirm(`Deactivate promo code "${code}"?`)) return;
        btn.disabled = true;
        try {
          const res = await apiFetch(`/api/promo/${code}`, {
            method: "DELETE",
          });
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.message || "Failed.");
          showToast(`"${code}" deactivated.`, "success");
          await loadPromos();
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      });
    }

    if (addPromoBtn) {
      addPromoBtn.addEventListener("click", async () => {
        const code = addCodeInput?.value?.trim();
        const pct = parseFloat(addPctInput?.value || "0");
        if (!code) {
          showToast("Enter a promo code.", "error");
          return;
        }
        if (!pct || pct <= 0 || pct > 100) {
          showToast("Discount must be 1–100.", "error");
          return;
        }
        addPromoBtn.disabled = true;
        try {
          const res = await apiFetch("/api/promo", {
            method: "POST",
            body: JSON.stringify({ code, discountPercent: pct }),
          });
          const data = await res.json();
          if (!res.ok || !data.success)
            throw new Error(data.message || "Failed.");
          showToast(`Promo "${code.toUpperCase()}" created!`, "success");
          if (addCodeInput) addCodeInput.value = "";
          if (addPctInput) addPctInput.value = "";
          await loadPromos();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          addPromoBtn.disabled = false;
        }
      });
    }

    await loadPromos();
  }

  await loadUsers();
  await loadStats();
});
