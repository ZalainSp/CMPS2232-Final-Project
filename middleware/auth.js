//TODO: compile typescript
//  const { Auth } = require("../dist/Auth");

module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const session = await Auth.verifySession(token);
    if (!session) return res.status(401).json({ message: "Session expired or invalid" });

    req.user = session; //{ userID, role }
    next();
};