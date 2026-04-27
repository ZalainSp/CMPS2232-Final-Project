const { Auth } = require("../dist/Classes/Auth");
const { Admin } = require("../dist/Classes/Admin");
const { Cart } = require("../dist/Classes/Cart");
const { MenuItem } = require("../dist/Classes/MenuItem");
const { FoodItem } = require("../dist/Classes/FoodItem");
const { DrinkItem } = require("../dist/Classes/DrinkItem");
const { ComboMeal } = require("../dist/Classes/ComboMeal");

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

exports.getPublicMenu = async (req, res) => {
    try {
        const items = await MenuItem.getAll();
        res.json({
            success: true,
            items: Array.isArray(items) ? items : []
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
            items: []
        });
    }
};

exports.getMenu = async (req, res) => {
    try {
        const items = await MenuItem.getAll();
        res.json({
            success: true,
            items: Array.isArray(items) ? items : []
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
            items: []
        });
    }
};

exports.addManagerMenuItem = async (req, res) => {
    const { userID: routeUserID } = req.params;
    const sessionUser = req.user || {};
    const role = sessionUser.role;

    // Managers can add for their own dashboard; admins can add for any manager.
    if (role !== "Manager" && role !== "Admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (role === "Manager" && String(sessionUser.userID) !== String(routeUserID)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const {
        itemName,
        basePrice,
        itemType,
        portionSize,
        cupSize,
        discountAmount,
        isAvailable
    } = req.body || {};

    if (!itemName || Number(basePrice) < 0 || !itemType) {
        return res.status(400).json({
            success: false,
            message: "itemName, basePrice, and itemType are required"
        });
    }

    const normalizedType = String(itemType).toLowerCase();
    const available = isAvailable === false || String(isAvailable).toLowerCase() === "false" ? false : true;
    const price = Number(basePrice);

    try {
        let created = null;

        if (normalizedType === "food") {
            created = await FoodItem.add(itemName, price, available, portionSize || "medium");
        } else if (normalizedType === "drink") {
            created = await DrinkItem.add(itemName, price, available, cupSize || "medium");
        } else if (normalizedType === "combo") {
            created = await ComboMeal.add(itemName, price, available, Number(discountAmount) || 0);
        } else {
            return res.status(400).json({ success: false, message: "Unsupported itemType" });
        }

        const fullItem = await MenuItem.getById(created.itemID);
        return res.status(201).json({
            success: true,
            message: "Menu item created",
            item: fullItem || created
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

exports.getOrdersQueue = stubJson([]);
exports.updateOrderstatus = stubJson({ success: true });