const { Cart } = require("../dist/Classes/Cart");
const { MenuItem } = require("../dist/Classes/MenuItem");

exports.getCart = async (req, res) => {
  try {
    const userID = req.user.userID;
    const items = await Cart.getItems(userID);
    const subtotal = await Cart.calculateSubtotal(userID);
    const count = await Cart.getCount(userID);
    return res.json({ success: true, items, subtotal, count });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, items: [], error: e.message });
  }
};

exports.addCartItem = async (req, res) => {
  const userID = req.user.userID;
  const { itemID, quantity } = req.body || {};

  if (!itemID) {
    return res
      .status(400)
      .json({ success: false, message: "itemID is required." });
  }
  const qty = parseInt(quantity) || 1;
  if (qty < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be at least 1." });
  }

  try {
    const item = await MenuItem.getById(parseInt(itemID));
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found." });
    }
    if (item.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: `"${item.itemName}" is currently unavailable.`,
      });
    }

    const cartItem = await Cart.addItem(userID, parseInt(itemID), qty);
    const count = await Cart.getCount(userID);
    return res.status(201).json({
      success: true,
      message: `${item.itemName} added to cart.`,
      item: cartItem,
      count,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateCartItem = async (req, res) => {
  const userID = req.user.userID;
  const itemID = parseInt(req.params.itemID);
  const { quantity } = req.body || {};

  if (isNaN(itemID))
    return res
      .status(400)
      .json({ success: false, message: "Invalid item ID." });
  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a non-negative number.",
    });
  }

  try {
    const result = await Cart.updateQuantity(userID, itemID, qty);
    const count = await Cart.getCount(userID);
    return res.json({ success: true, item: result, count });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.removeCartItem = async (req, res) => {
  const userID = req.user.userID;
  const itemID = parseInt(req.params.itemID);
  if (isNaN(itemID))
    return res
      .status(400)
      .json({ success: false, message: "Invalid item ID." });

  try {
    const removed = await Cart.removeItem(userID, itemID);
    if (!removed)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart." });
    const count = await Cart.getCount(userID);
    return res.json({ success: true, message: "Item removed.", count });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.clear(req.user.userID);
    return res.json({ success: true, message: "Cart cleared." });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
