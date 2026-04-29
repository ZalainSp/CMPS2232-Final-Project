document.addEventListener("DOMContentLoaded", () => {
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    if (!user) return;

    const initial = (user.username || "U").trim().charAt(0).toUpperCase() || "U";
    const joinedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = String(value);
        }
    };

    setText("users-name", user.username || "User");
    setText("users-avatar", initial);
    setText("profile-username", user.username || "User");
    setText("profile-email", user.email || "--");
    setText("profile-contact", user.contactNumber || "--");
    setText("profile-id", user.userID || "--");
    setText("profile-role", user.role || "--");
    setText("profile-role-detail", user.role || "--");
    setText("profile-joined", joinedDate);

    const profileAvatar = document.getElementById("profile-avatar-lg");
    if (profileAvatar) {
        profileAvatar.textContent = initial;
    }
});