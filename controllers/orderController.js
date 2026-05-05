const { Cart } = require("../dist/Classes/Cart");
const { Orders } = require("../dist/Classes/Order");
const { RestaurantManager } = require("../dist/Classes/RestaurantManager");

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

        if (Array.isArray(result.orders) && result.orders.length > 0) {
            result.orders = result.orders.map((order) => ({
                ...order,
                deliveryAddress,
                deliveryNotes,
                paymentMethod,
            }));
            result.order = result.orders[0];
        } else if (result.order) {
            result.order.deliveryAddress = deliveryAddress;
            result.order.deliveryNotes = deliveryNotes;
            result.order.paymentMethod = paymentMethod;
        }

        return res.status(201).json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

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

exports.trackOrderstatus = async (req, res) => ({ success: true });

exports.getOrdersQueue = async (req, res) => {
    try {
        const routeUserID = Number(req.params.userID);
        const sessionUser = req.user || {};

        if (sessionUser.role !== "Admin" && (sessionUser.role !== "Manager" || Number(sessionUser.userID) !== routeUserID)) {
            return res.status(403).json({ success: false, message: "Forbidden", orders: [], stats: {} });
        }

        const manager = await RestaurantManager.getById(routeUserID);
        if (!manager) {
            return res.status(404).json({ success: false, message: "Manager not found", orders: [], stats: {} });
        }

        const restaurantID = manager.restaurantID || manager.restaurantid || null;
        if (!restaurantID) {
            return res.status(400).json({ success: false, message: "Restaurant record is missing", orders: [], stats: {} });
        }

        const allOrders = sessionUser.role === "Admin" ? await Orders.getAll() : await Orders.getAll(Number(restaurantID));
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

exports.updateOrderstatus = async (req, res) => ({ success: true });
