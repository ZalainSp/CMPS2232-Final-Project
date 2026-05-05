const { Admin } = require("../dist/Classes/Admin");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await Admin.getAll();
        const totalUsers = Array.isArray(users) ? users.length : 0;

        console.log(`[GET /api/admin/users] Returned ${totalUsers} users`);

        res.json({
            totalUsers,
            users: users || []
        });
    } catch (e) {
        res.status(500).json({
            totalUsers: 0,
            users: [],
            error: e.message
        });
    }
};

exports.removeUsers = async (req, res) => {
    try {
        await Admin.removeUsers(req.params.userID);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getAllAdmins = async (req, res) => res.json([]);
exports.getAdminById = async (req, res) => res.json({});
exports.generateOrdersReport = async (req, res) => res.json([]);
