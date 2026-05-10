const { MenuItem } = require("../dist/Classes/MenuItem");
const { FoodItem } = require("../dist/Classes/FoodItem");
const { DrinkItem } = require("../dist/Classes/DrinkItem");
const { ComboMeal } = require("../dist/Classes/ComboMeal");
const { RestaurantManager } = require("../dist/Classes/RestaurantManager");

exports.getPublicMenu = async (req, res) => {
  try {
    const items = await MenuItem.getAll();
    return res.json({
      success: true,
      items: Array.isArray(items) ? items : [],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, items: [], message: e.message });
  }
};

exports.getMenu = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id))
    return res
      .status(400)
      .json({ success: false, items: [], message: "Invalid ID." });

  try {
    const items = await RestaurantManager.getMenu(id);
    return res.json({
      success: true,
      items: Array.isArray(items) ? items : [],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, items: [], message: e.message });
  }
};

exports.addManagerMenuItem = async (req, res) => {
  const routeUID = parseInt(req.params.userID);
  const sessionUser = req.user || {};

  if (sessionUser.role !== "Manager" && sessionUser.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }
  if (sessionUser.role === "Manager" && sessionUser.userID !== routeUID) {
    return res.status(403).json({
      success: false,
      message: "You can only add items to your own restaurant.",
    });
  }

  const {
    itemName,
    basePrice,
    itemType,
    portionSize,
    cupSize,
    discountAmount,
    isAvailable,
  } = req.body || {};

  if (!itemName || String(itemName).trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Item name is required." });
  }
  const price = parseFloat(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({
      success: false,
      message: "Base price must be a valid non-negative number.",
    });
  }
  const normalizedType = String(itemType || "").toLowerCase();
  if (!["food", "drink", "combo"].includes(normalizedType)) {
    return res.status(400).json({
      success: false,
      message: "Item type must be 'food', 'drink', or 'combo'.",
    });
  }

  // Resolve the restaurantID for this manager
  let restaurantID = null;
  try {
    const mgr = await RestaurantManager.getById(routeUID);
    if (!mgr)
      return res
        .status(404)
        .json({ success: false, message: "Manager not found." });
    restaurantID = mgr.restaurantID ?? mgr.restaurantid ?? null;
    if (!restaurantID) {
      return res.status(400).json({
        success: false,
        message: "No restaurant is linked to this manager account yet.",
      });
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }

  const available =
    isAvailable !== false && String(isAvailable).toLowerCase() !== "false";

  try {
    let created;
    if (normalizedType === "food") {
      if (!portionSize)
        return res.status(400).json({
          success: false,
          message: "Portion size is required for food items.",
        });
      created = await FoodItem.add(
        itemName.trim(),
        price,
        available,
        portionSize,
        Number(restaurantID),
      );
    } else if (normalizedType === "drink") {
      if (!cupSize)
        return res.status(400).json({
          success: false,
          message: "Cup size is required for drink items.",
        });
      created = await DrinkItem.add(
        itemName.trim(),
        price,
        available,
        cupSize,
        Number(restaurantID),
      );
    } else {
      const discount = parseFloat(discountAmount) || 0;
      if (discount < 0)
        return res
          .status(400)
          .json({ success: false, message: "Discount cannot be negative." });
      if (discount > price)
        return res.status(400).json({
          success: false,
          message: "Discount cannot exceed the base price.",
        });
      created = await ComboMeal.add(
        itemName.trim(),
        price,
        available,
        discount,
        Number(restaurantID),
      );
    }

    const fullItem = await MenuItem.getById(created.itemID);
    return res.status(201).json({
      success: true,
      message: "Menu item created.",
      item: fullItem || created,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
