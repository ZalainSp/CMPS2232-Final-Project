const { Auth } = require("../dist/Classes/Auth");
const { Admin } = require("../dist/Classes/Admin");
const { Cart } = require("../dist/Classes/Cart");

const stubJson = (payload) => (req, res) => res.json(payload);
const readBearerToken = (header = "") => {
    const [, token] = header.split(" ");
    return token || null;
};

// AUTH
exports.login = async (req, res) => {
    try {
        const result = await Auth.login(
            req.body.username,
            req.body.password,
            req.body.role
        );

        return res.status(result.success ? 200 : 401).json(result);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.register = async (req, res) => {
    const result = await Auth.register(req.body);
    res.status(result.success ? 201 : 400).json(result);
};

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

// CART
exports.getCart = async (req, res) => {
    try {
        const items = await Cart.getItems(req.user.userID);
        res.json(items);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// STUBS
exports.guestLogin = async (req, res) => {
    const result = await Auth.guestLogin();
    res.json(result);
};

exports.logout = async (req, res) => {
    const token = readBearerToken(req.headers.authorization);

    if (token) {
        await Auth.logout(token);
    }

    res.json({ success: true });
};

exports.getAllAdmins = stubJson([]);
exports.getAdminById = stubJson({});
exports.generateOrdersReport = stubJson([]);

exports.getAllCustomers = stubJson([]);
exports.getCustomerById = stubJson({});
exports.updateDeliveryAddress = stubJson({ success: true });
exports.getOrdersHistory = stubJson([]);
exports.trackOrderstatus = stubJson({});

exports.getAllDrivers = stubJson([]);
exports.getAvailableDrivers = stubJson([]);
exports.getDriverById = stubJson({});
exports.setAvailability = stubJson({ success: true });
exports.acceptDelivery = stubJson({ success: true });
exports.updateDeliveryStatus = stubJson({ success: true });

exports.getAllManagers = stubJson([]);
exports.getManagerById = stubJson({});
exports.updateRestaurantInfo = stubJson({ success: true });
exports.getMenu = stubJson([]);
exports.getOrdersQueue = stubJson([]);
exports.updateOrderstatus = stubJson({ success: true });