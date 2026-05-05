const { Cart } = require("../dist/Classes/Cart");

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
