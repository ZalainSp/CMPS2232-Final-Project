const { Auth } = require("../dist/Classes/Auth");
const { Admin } = require("../dist/Classes/Admin");
const { Cart } = require("../dist/Classes/Cart");
const { Orders } = require("../dist/Classes/Order");
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
        res.json({
            success: true,
            items: Array.isArray(items) ? items : []
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message, items: [] });
    }
};

exports.addCartItem = async (req, res) => {
    try {
        const userID = req.user.userID;
        const { itemID, quantity = 1 } = req.body || {};

        if (!itemID) {
            return res.status(400).json({ success: false, message: "itemID is required" });
        }

        const item = await Cart.addItem(userID, Number(itemID), Number(quantity) || 1);
        res.status(201).json({ success: true, item });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userID = req.user.userID;
        const itemID = Number(req.params.itemID);
        const { quantity } = req.body || {};

        if (!itemID || quantity === undefined) {
            return res.status(400).json({ success: false, message: "itemID and quantity are required" });
        }

        const item = await Cart.updateQuantity(userID, itemID, Number(quantity));
        res.json({ success: true, item });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const itemID = Number(req.params.itemID);
        const removed = await Cart.removeItem(req.user.userID, itemID);
        res.json({ success: true, item: removed });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        await Cart.clear(req.user.userID);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.placeCustomerOrder = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "Customer") {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const {
            cartItems,
            deliveryType = "standard",
            promoCode = null,
            deliveryAddress = null,
            deliveryNotes = null,
            paymentMethod = null
        } = req.body || {};

        let currentCartItems = await Cart.getItems(req.user.userID);

        if ((!currentCartItems || currentCartItems.length === 0) && Array.isArray(cartItems) && cartItems.length > 0) {
            await Cart.clear(req.user.userID);

            for (const item of cartItems) {
                if (!item || !item.itemID) continue;

                await Cart.addItem(req.user.userID, Number(item.itemID), Number(item.quantity) || 1);
            }

            currentCartItems = await Cart.getItems(req.user.userID);
        }

        const result = await Orders.placeOrders(req.user.userID, deliveryType, promoCode);

        if (!result.success) {
            return res.status(400).json(result);
        }

        result.order.items = Array.isArray(currentCartItems) ? currentCartItems : [];
        result.order.deliveryAddress = deliveryAddress;
        result.order.deliveryNotes = deliveryNotes;
        result.order.paymentMethod = paymentMethod;

        return res.status(201).json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
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
exports.getOrdersHistory = async (req, res) => {
    try {
        const routeUserID = Number(req.params.userID);

        if (!req.user || (req.user.role !== "Admin" && Number(req.user.userID) !== routeUserID)) {
            return res.status(403).json({ success: false, message: "Forbidden", orders: [] });
        }

        const orders = await Orders.getByCustomer(routeUserID);
        res.json({
            success: true,
            orders: Array.isArray(orders) ? orders : []
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, orders: [] });
    }
};
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

const sameDay = (left, right) => {
    const leftDate = new Date(left);
    const rightDate = new Date(right);
    return leftDate.toDateString() === rightDate.toDateString();
};

const calculateOrderTotal = (orderItems, deliveryType) => {
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const tax = subtotal * 0.125;
    const deliveryFee = deliveryType === "priority" ? 10 : 5;
    return subtotal + tax + deliveryFee;
};

exports.getOrdersQueue = async (req, res) => {
    try {
        const routeUserID = Number(req.params.userID);
        const sessionUser = req.user || {};

        if (sessionUser.role !== "Admin" && (sessionUser.role !== "Manager" || Number(sessionUser.userID) !== routeUserID)) {
            return res.status(403).json({ success: false, message: "Forbidden", orders: [], stats: {} });
        }

        const allOrders = await Orders.getAll();
        const activeOrders = allOrders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
        const today = new Date();

        const orders = await Promise.all(
            activeOrders.map(async (order) => {
                const items = await Orders.getItems(order.orderID);
                return {
                    ...order,
                    items,
                    itemsSummary: Array.isArray(items) ? items.map((item) => item.itemName).join(", ") : ""
                };
            })
        );

        const todayOrders = await Promise.all(
            allOrders
                .filter((order) => sameDay(order.orderDate, today) && order.status !== "Cancelled")
                .map(async (order) => ({
                    ...order,
                    items: await Orders.getItems(order.orderID)
                }))
        );

        const completedToday = todayOrders.filter((order) => order.status === "Delivered").length;
        const revenueToday = todayOrders.reduce(
            (sum, order) => sum + calculateOrderTotal(order.items || [], order.deliveryType),
            0
        );

        return res.json({
            success: true,
            orders,
            stats: {
                activeOrders: orders.length,
                completedToday,
                revenueToday: Number(revenueToday.toFixed(2))
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message, orders: [], stats: {} });
    }
};

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

exports.updateOrderstatus = stubJson({ success: true });