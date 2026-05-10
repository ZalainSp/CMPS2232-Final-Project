const { Customer } = require("../dist/Classes/Customer");
const { Driver } = require("../dist/Classes/Driver");
const { RestaurantManager } = require("../dist/Classes/RestaurantManager");
const { Orders } = require("../dist/Classes/Order");

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.getAll();
    return res.json(customers);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.getCustomerById = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID." });
  try {
    const customer = await Customer.getById(id);
    if (!customer)
      return res.status(404).json({ error: "Customer not found." });
    return res.json(customer);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.updateDeliveryAddress = async (req, res) => {
  const id = parseInt(req.params.userID);
  const { deliveryAddress } = req.body || {};
  if (isNaN(id))
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  if (!deliveryAddress || String(deliveryAddress).trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Delivery address cannot be empty." });
  }
  try {
    const updated = await Customer.updateDeliveryAddress(
      id,
      deliveryAddress.trim(),
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    return res.json({ success: true, message: "Delivery address updated." });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    return res.json(await Driver.getAll());
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.getAvailableDrivers = async (req, res) => {
  try {
    return res.json(await Driver.getAvailable());
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.getDriverById = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    const driver = await Driver.getById(id);
    if (!driver) return res.status(404).json({ error: "Driver not found." });
    return res.json(driver);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.setAvailability = async (req, res) => {
  const id = parseInt(req.params.userID);
  const { available } = req.body || {};
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID." });
  if (available === undefined || available === null) {
    return res
      .status(400)
      .json({ success: false, message: "Availability value is required." });
  }
  try {
    const result = await Driver.setAvailability(id, Boolean(available));
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found." });
    return res.json({
      success: true,
      message: `Driver is now ${result.available ? "available" : "unavailable"}.`,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Driver.getAvailableOrders();
    return res.json({
      success: true,
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, orders: [], error: e.message });
  }
};

exports.acceptDelivery = async (req, res) => {
  const driverUserID = req.user.userID;
  const orderID = parseInt(req.params.orderID);

  if (isNaN(orderID)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });
  }

  try {
    const result = await Orders.assignDriver(orderID, driverUserID);
    return res.json({
      success: true,
      message: "Delivery accepted.",
      order: result,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getDriverOrders = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id))
    return res
      .status(400)
      .json({ success: false, orders: [], message: "Invalid ID." });

  // Only the driver themselves or an admin can view
  if (req.user.role !== "Admin" && req.user.userID !== id) {
    return res
      .status(403)
      .json({ success: false, orders: [], message: "Forbidden." });
  }

  try {
    const orders = await Driver.getByDriver(id);

    const deliveredToday = await Driver.getDeliveredToday(id);

    return res.json({
      success: true,
      orders: Array.isArray(orders) ? orders : [],
      deliveredToday,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      orders: [],
      deliveredToday: 0,
      error: e.message,
    });
  }
};

exports.getAllManagers = async (req, res) => {
  try {
    return res.json(await RestaurantManager.getAll());
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.getManagerById = async (req, res) => {
  const id = parseInt(req.params.userID);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    const mgr = await RestaurantManager.getById(id);
    if (!mgr) return res.status(404).json({ error: "Manager not found." });
    return res.json(mgr);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.updateRestaurantInfo = async (req, res) => {
  const id = parseInt(req.params.userID);
  const { restaurantName, openingHours } = req.body || {};
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID." });
  if (!restaurantName || String(restaurantName).trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Restaurant name is required." });
  }
  if (!openingHours || String(openingHours).trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Opening hours are required." });
  }
  try {
    const updated = await RestaurantManager.updateRestaurantInfo(
      id,
      restaurantName.trim(),
      openingHours.trim(),
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Manager not found." });
    return res.json({ success: true, message: "Restaurant info updated." });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
