const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/auth");

console.log("[ROUTES] Router module loaded");

const {
  // Auth
  login,
  register,
  guestLogin,
  logout,
  deleteAccount,

  // Admin
  getAllAdmins,
  getAdminById,
  getAllUsers,
  removeUsers,
  generateOrdersReport,

  // Promo
  validatePromo,
  getAllPromoCodes,
  addPromoCode,
  deactivatePromoCode,

  // Menu
  getPublicMenu,

  // Customer
  getAllCustomers,
  getCustomerById,
  updateDeliveryAddress,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getOrdersHistory,
  trackOrderstatus,
  placeCustomerOrder,

  // Driver
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  setAvailability,
  acceptDelivery,
  updateDeliveryStatus,
  getPendingOrders,
  getDriverOrders,

  // Manager
  getAllManagers,
  getManagerById,
  updateRestaurantInfo,
  getMenu,
  addManagerMenuItem,
  getOrdersQueue,
  updateOrderstatus,
} = require("../controllers/controller");

// AUTH
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/guest", guestLogin);
router.post("/auth/logout", authMiddleware, logout);
router.delete("/auth/account", authMiddleware, deleteAccount);

// PROMO
router.post("/promo/validate", authMiddleware, validatePromo);
router.get("/promo", authMiddleware, isAdmin, getAllPromoCodes);
router.post("/promo", authMiddleware, isAdmin, addPromoCode);
router.delete("/promo/:code", authMiddleware, isAdmin, deactivatePromoCode);

// MENU
router.get("/menu", authMiddleware, getPublicMenu);

// ADMIN
router.get("/admin", authMiddleware, getAllAdmins);
router.get("/admin/users", authMiddleware, isAdmin, getAllUsers);
// NOTE: static "/admin/reports/orders" must be BEFORE "/admin/:userID"
router.get(
  "/admin/reports/orders",
  authMiddleware,
  isAdmin,
  generateOrdersReport,
);
router.get("/admin/:userID", authMiddleware, getAdminById);
router.delete("/admin/users/:userID", authMiddleware, isAdmin, removeUsers);

// CART
router.get("/cart", authMiddleware, getCart);
router.post("/cart/items", authMiddleware, addCartItem);
router.patch("/cart/items/:itemID", authMiddleware, updateCartItem);
router.delete("/cart/items/:itemID", authMiddleware, removeCartItem);
router.delete("/cart", authMiddleware, clearCart);

// CUSTOMER ORDERS
router.post("/customers/orders", authMiddleware, placeCustomerOrder);
router.get(
  "/customers/orders/:orderID/track",
  authMiddleware,
  trackOrderstatus,
);
router.get("/customers/:userID/orders", authMiddleware, getOrdersHistory);

// CUSTOMER PROFILE
router.get("/customers", authMiddleware, getAllCustomers);
router.get("/customers/:userID", authMiddleware, getCustomerById);
router.put("/customers/:userID/address", authMiddleware, updateDeliveryAddress);

// ORDERS
router.get("/orders/pending", authMiddleware, getPendingOrders);

// DRIVER
router.get("/drivers", authMiddleware, getAllDrivers);
router.get("/drivers/available", authMiddleware, getAvailableDrivers);
router.put(
  "/drivers/orders/:orderID/status",
  authMiddleware,
  updateDeliveryStatus,
);
router.get("/drivers/:userID", authMiddleware, getDriverById);
router.get("/drivers/:userID/orders", authMiddleware, getDriverOrders);
router.put("/drivers/:userID/availability", authMiddleware, setAvailability);
router.post("/drivers/:userID/accept/:orderID", authMiddleware, acceptDelivery);

// MANAGER
router.put(
  "/managers/orders/:orderID/status",
  authMiddleware,
  updateOrderstatus,
);
router.get("/managers", authMiddleware, getAllManagers);
router.get("/managers/:userID", authMiddleware, getManagerById);
router.put("/managers/:userID", authMiddleware, updateRestaurantInfo);
router.get("/managers/:userID/menu", authMiddleware, getMenu);
router.post("/managers/:userID/menu", authMiddleware, addManagerMenuItem);
router.get("/managers/:userID/orders", authMiddleware, getOrdersQueue);

module.exports = router;
