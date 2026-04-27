document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item[data-target]");

    if (!navItems.length) return;

    navItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            const anchor = item.closest("a");
            if (anchor) {
                event.preventDefault();
            }

            const targetId = item.dataset.target;
            if (!targetId) return;

            navItems.forEach((n) => n.classList.remove("active"));
            item.classList.add("active");

            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});
