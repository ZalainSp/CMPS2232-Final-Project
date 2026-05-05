const { MenuItem } = require("../dist/Classes/MenuItem");
const { FoodItem } = require("../dist/Classes/FoodItem");
const { DrinkItem } = require("../dist/Classes/DrinkItem");
const { ComboMeal } = require("../dist/Classes/ComboMeal");
const { RestaurantManager } = require("../dist/Classes/RestaurantManager");

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
        const { userID: routeUserID } = req.params;
        const manager = await RestaurantManager.getById(Number(routeUserID));
        if (!manager) {
            return res.status(404).json({ success: false, message: "Manager not found", items: [] });
        }

        const restaurantID = manager.restaurantID || manager.restaurantid || null;
        const items = await MenuItem.getAll(restaurantID);
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

    const manager = await RestaurantManager.getById(Number(routeUserID));
    if (!manager) {
        return res.status(404).json({ success: false, message: "Manager not found" });
    }

    const restaurantID = manager.restaurantID || manager.restaurantid || null;
    if (!restaurantID) {
        return res.status(400).json({ success: false, message: "Restaurant record is missing" });
    }

    try {
        let created = null;

        if (normalizedType === "food") {
            created = await FoodItem.add(itemName, price, available, portionSize || "medium", Number(restaurantID));
        } else if (normalizedType === "drink") {
            created = await DrinkItem.add(itemName, price, available, cupSize || "medium", Number(restaurantID));
        } else if (normalizedType === "combo") {
            created = await ComboMeal.add(itemName, price, available, Number(discountAmount) || 0, Number(restaurantID));
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
