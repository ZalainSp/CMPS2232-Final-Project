document.addEventListener("DOMContentLoaded", () => {
    console.log("📋 Profile script loaded");

    const navItems = document.querySelectorAll(".nav-item[data-section]");
    const pageSections = document.querySelectorAll(".page-section");
    
    console.log(`Found ${navItems.length} nav items and ${pageSections.length} page sections`);

    // ── NAVIGATION HANDLER ──
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const sectionName = item.dataset.section;
            console.log(`🔄 Navigating to: ${sectionName}`);

            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            // Hide all sections
            pageSections.forEach(section => {
                section.classList.remove("active");
                section.style.display = "none";
            });

            // Show selected section
            const section = document.getElementById(`${sectionName}-section`);
            if (section) {
                section.classList.add("active");
                section.style.display = "block";
                console.log(`✅ Showing section: ${sectionName}-section`);
            } else {
                console.warn(`⚠️ Section not found: ${sectionName}-section`);
            }

            // Load profile data if profile section is opened
            if (sectionName === "profile") {
                loadProfileData();
            }
        });
    });

    // ── LOAD PROFILE DATA ──
    function loadProfileData() {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            console.log("👤 User data from localStorage:", user);

            if (user) {
                document.getElementById("profile-username").textContent = user.username || "Admin";
                document.getElementById("profile-email").textContent = user.email || "admin@gobites.com";
                document.getElementById("profile-contact").textContent = user.contactNumber || "(555) 000-0000";
                document.getElementById("profile-id").textContent = user.userID || "1";
                document.getElementById("profile-role").textContent = user.role || "System Admin";
                document.getElementById("profile-role-detail").textContent = user.role || "System Admin";

                // Generate avatar initials
                const initials = (user.username || "A").substring(0, 1).toUpperCase();
                const avatar = document.getElementById("profile-avatar-lg");
                if (avatar) {
                    avatar.textContent = initials;
                    avatar.style.width = "80px";
                    avatar.style.height = "80px";
                }

                // Set joined date
                const today = new Date();
                const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                document.getElementById("profile-joined").textContent = dateStr;
                
                console.log("✅ Profile data loaded successfully");
            } else {
                console.warn("⚠️ No user data in localStorage");
            }
        } catch (error) {
            console.error("❌ Error loading profile data:", error);
        }
    }

    // ── INITIAL STATE ──
    const homeSection = document.getElementById("home-section");
    if (homeSection) {
        homeSection.classList.add("active");
        homeSection.style.display = "block";
        console.log("✅ Home section set as initial active");
    }

    // Load profile data immediately on page load
    loadProfileData();
});

