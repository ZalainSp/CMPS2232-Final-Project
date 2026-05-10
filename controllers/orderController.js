const { Cart } = require("../dist/Classes/Cart");
const { Orders } = require("../dist/Classes/Order");
const { RestaurantManager } = require("../dist/Classes/RestaurantManager");

exports.placeCustomerOrder = async (req, res) => {
  if (!req.user || req.user.role !== "Customer") {
    return res
      .status(403)
      .json({ success: false, message: "Only customers can place orders." });
  }

  const userID = req.user.userID;
  const { deliveryType = "standard", promoCode = null } = req.body || {};

  const validTypes = ["standard", "priority"];
  if (!validTypes.includes(String(deliveryType).toLowerCase())) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Delivery type must be 'standard' or 'priority'.",
      });
  }

  try {
    const empty = await Cart.isEmpty(userID);
    if (empty) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Your cart is empty. Add items before checking out.",
        });
    }

    const result = await Orders.placeOrders(
      userID,
      deliveryType.toLowerCase(),
      promoCode || null,
    );
    if (!result.success) return res.status(400).json(result);

    if (result.order) {
      result.order.deliveryAddress = req.body.deliveryAddress || null;
      result.order.deliveryNotes = req.body.deliveryNotes || null;
      result.order.paymentMethod = req.body.paymentMethod || "Cash";
    }

    return res.status(201).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getOrdersHistory = async (req, res) => {
  const routeUID = parseInt(req.params.userID);
  if (isNaN(routeUID))
    return res
      .status(400)
      .json({ success: false, orders: [], message: "Invalid user ID." });

  if (req.user.role !== "Admin" && req.user.userID !== routeUID) {
    return res
      .status(403)
      .json({ success: false, orders: [], message: "Forbidden." });
  }

  try {
    const orders = await Orders.getByCustomer(routeUID);
    return res.json({
      success: true,
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, orders: [], message: e.message });
  }
};

exports.trackOrderstatus = async (req, res) => {
  const orderID = parseInt(req.params.orderID);
  if (isNaN(orderID))
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });

  try {
    const order = await Orders.getById(orderID);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    return res.json({
      success: true,
      orderID: order.orderID,
      status: order.status,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getOrdersQueue = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id))
    return res
      .status(400)
      .json({ success: false, orders: [], message: "Invalid ID." });

  const sessionUser = req.user || {};
  if (
    sessionUser.role !== "Admin" &&
    (sessionUser.role !== "Manager" || sessionUser.userID !== id)
  ) {
    return res
      .status(403)
      .json({ success: false, orders: [], message: "Forbidden." });
  }

  try {
    const queue = await RestaurantManager.getOrdersQueue(id);
    const orders = Array.isArray(queue) ? queue : [];

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await Orders.getItems(order.orderID);
        return {
          ...order,
          items,
          itemsSummary: Array.isArray(items)
            ? items.map((i) => i.itemName).join(", ")
            : "",
        };
      }),
    );

    const today = new Date().toDateString();
    const allOrders = await Orders.getAll();
    const todayDone = allOrders.filter(
      (o) =>
        new Date(o.orderDate).toDateString() === today &&
        o.status === "Delivered",
    ).length;

    const revenueToday = await RestaurantManager.getRevenueToday(id);

    return res.json({
      success: true,
      orders: enriched,
      stats: {
        activeOrders: enriched.length,
        completedToday: todayDone,
        revenueToday,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, orders: [], stats: {}, message: e.message });
  }
};

exports.updateOrderstatus = async (req, res) => {
  const orderID = parseInt(req.params.orderID);
  const { status } = req.body || {};
  if (isNaN(orderID))
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });

  const valid = ["Pending", "Preparing", "Ready", "Cancelled"];
  if (!status || !valid.includes(status)) {
    return res
      .status(400)
      .json({
        success: false,
        message: `Status must be one of: ${valid.join(", ")}.`,
      });
  }

  try {
    const updated = await Orders.updateStatus(orderID, status);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    return res.json({
      success: true,
      message: `Order #${orderID} updated to "${status}".`,
      order: updated,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  const orderID = parseInt(req.params.orderID);
  const { status } = req.body || {};
  if (isNaN(orderID))
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });

  const valid = ["Out for Delivery", "Delivered", "Cancelled"];
  if (!status || !valid.includes(status)) {
    return res
      .status(400)
      .json({
        success: false,
        message: `Status must be one of: ${valid.join(", ")}.`,
      });
  }

  const order = await Orders.getById(orderID).catch(() => null);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order not found." });
  if (req.user.role !== "Admin" && order.driverID !== req.user.userID) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this order." });
  }

  try {
    const updated = await Orders.updateStatus(orderID, status);
    return res.json({
      success: true,
      message: `Status updated to "${status}".`,
      order: updated,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
