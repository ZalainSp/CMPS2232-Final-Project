document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item[data-target], .nav-item[data-section]");

    if (!navItems.length) return;

    navItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            const anchor = item.closest("a");
            if (anchor) {
                event.preventDefault();
            }

            const targetId = item.dataset.target || (item.dataset.section ? `${item.dataset.section}-section` : "");
            if (!targetId) return;

            navItems.forEach((n) => n.classList.remove("active"));
            item.classList.add("active");

            const target = document.getElementById(targetId);
            if (target) {
                const sections = document.querySelectorAll(".page-section");
                if (sections.length) {
                    sections.forEach((section) => {
                        section.classList.remove("active");
                        section.style.display = "none";
                    });
                }

                if (target.classList.contains("page-section")) {
                    target.classList.add("active");
                    target.style.display = "block";
                }

                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});
