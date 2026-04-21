const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const {
  //auth
  login, register, guestLogin, logout,
  //admin
  getAllAdmins, getAdminById, getAllUsers, removeUser, generateOrderReport,
  //customer
  getAllCustomers, getCustomerById, updateDeliveryAddress, getOrderHistory, trackOrderStatus,
  //driver
  getAllDrivers, getAvailableDrivers, getDriverById, setAvailability, acceptDelivery, updateDeliveryStatus,
  //manager
  getAllManagers, getManagerById, updateRestaurantInfo, getMenu,getOrderQueue, updateOrderStatus,
} = require("../controllers/controllers");

//auth
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/guest", guestLogin);
router.post("/auth/logout", authMiddleware, logout);

//admin
router.get("/admin", authMiddleware, getAllAdmins);
router.get("/admin/:userID", authMiddleware, getAdminById);
router.get("/admin/users", authMiddleware, getAllUsers);
router.delete("/admin/users/:userID", authMiddleware, removeUser);
router.get("/admin/reports/orders", authMiddleware, generateOrderReport);

//customer
router.get("/customers", authMiddleware, getAllCustomers);
router.get("/customers/:userID", authMiddleware, getCustomerById);
router.put("/customers/:userID/address", authMiddleware, updateDeliveryAddress);
router.get("/customers/:userID/orders", authMiddleware, getOrderHistory);
router.get("/customers/orders/:orderID/track", authMiddleware, trackOrderStatus,);

//driver
router.get("/drivers", authMiddleware, getAllDrivers);
router.get("/drivers/available", authMiddleware, getAvailableDrivers);
router.get("/drivers/:userID", authMiddleware, getDriverById);
router.put("/drivers/:userID/availability", authMiddleware, setAvailability);
router.post("/drivers/:userID/accept/:orderID", authMiddleware, acceptDelivery);
router.put("/drivers/orders/:orderID/status", authMiddleware, updateDeliveryStatus,);

//rest manager
router.get("/managers", authMiddleware, getAllManagers);
router.get("/managers/:userID", authMiddleware, getManagerById);
router.put("/managers/:userID", authMiddleware, updateRestaurantInfo);
router.get("/managers/:userID/menu", authMiddleware, getMenu);
router.get("/managers/:userID/orders", authMiddleware, getOrderQueue);
router.put("/managers/orders/:orderID/status", authMiddleware, updateOrderStatus,);

module.exports = router;
