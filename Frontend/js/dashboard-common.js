document.addEventListener("DOMContentLoaded", () => {
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!user) return;

    const nameEl = document.getElementById("users-name");
    const avatarEl = document.getElementById("users-avatar");
    const greetingEl = document.getElementById("greeting-name");

    if (nameEl && user.username) {
        nameEl.textContent = user.username;
    }

    if (greetingEl && user.username) {
        greetingEl.textContent = user.username;
    }

    if (avatarEl) {
        const initial = (user.username || "U").trim().charAt(0).toUpperCase() || "U";
        avatarEl.textContent = initial;
    }

    const notifBadge = document.getElementById("notif-count");
    if (notifBadge && !notifBadge.textContent.trim()) {
        notifBadge.textContent = "";
    }
});
