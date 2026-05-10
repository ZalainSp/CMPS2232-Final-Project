const { Admin } = require("../dist/Classes/Admin");
const { Users } = require("../dist/Classes/Users");
const { Orders } = require("../dist/Classes/Order");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Admin.getAll();
    const totalUsers = Array.isArray(users) ? users.length : 0;
    return res.json({ totalUsers, users: users || [] });
  } catch (e) {
    return res.status(500).json({ totalUsers: 0, users: [], error: e.message });
  }
};

exports.removeUsers = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  if (req.user?.userID === id) {
    return res
      .status(400)
      .json({ success: false, message: "You cannot remove your own account." });
  }
  try {
    const deleted = await Users.delete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    return res.json({ success: true, message: `User #${id} removed.` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

exports.getAllAdmins = async (req, res) => res.json([]);

exports.getAdminById = async (req, res) => res.json({});

exports.generateOrdersReport = async (req, res) => {
  try {
    const stats = await Orders.getPlatformStats();
    return res.json({ success: true, ...stats });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
