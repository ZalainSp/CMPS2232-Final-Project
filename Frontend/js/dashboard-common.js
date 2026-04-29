document.addEventListener("DOMContentLoaded", () => {
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!user) return;

    const greetingEl = document.getElementById("greeting-name");

    if (greetingEl && user.username) {
        greetingEl.textContent = user.username;
    }

    const notifBadge = document.getElementById("notif-count");
    if (notifBadge && !notifBadge.textContent.trim()) {
        notifBadge.textContent = "";
    }
});
