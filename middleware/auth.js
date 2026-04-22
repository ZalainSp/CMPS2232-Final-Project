const { Auth } = require("../dist/classes/Auth");

const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    const session = await Auth.verifySession(token);

    if (!session) {
        return res.status(401).json({ message: "Session invalid or expired" });
    }

    req.user = session;
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

module.exports = { authMiddleware, isAdmin };