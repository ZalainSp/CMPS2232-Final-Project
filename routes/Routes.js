const express = require("express");
const router = express.Router();

const { authMiddleware, isAdmin } = require("../middleware/auth");

console.log("[ROUTES] Router module loaded");

const {
    login,
    register,
    guestLogin,
    logout,

    getAllAdmins,
    getAdminById,
    getAllUsers,
    removeUsers,
    generateOrdersReport,

    getAllCustomers,
    getCustomerById,
    updateDeliveryAddress,
    getOrdersHistory,
    trackOrderstatus,

    getAllDrivers,
    getAvailableDrivers,
    getDriverById,
    setAvailability,
    acceptDelivery,
    updateDeliveryStatus,

    getAllManagers,
    getManagerById,
    updateRestaurantInfo,
    getMenu,
    getOrdersQueue,
    updateOrderstatus
} = require("../controllers/controller");

// AUTH
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/guest", guestLogin);
router.post("/auth/logout", authMiddleware, logout);

// ADMIN
router.get("/admin", authMiddleware, getAllAdmins);
router.get("/admin/users", authMiddleware, isAdmin, getAllUsers);
router.get("/admin/:userID", authMiddleware, getAdminById);
router.delete("/admin/users/:userID", authMiddleware, isAdmin, removeUsers);
router.get("/admin/reports/orders", authMiddleware, generateOrdersReport);

// CUSTOMER
router.get("/customers", authMiddleware, getAllCustomers);
router.get("/customers/:userID", authMiddleware, getCustomerById);
router.put("/customers/:userID/address", authMiddleware, updateDeliveryAddress);
router.get("/customers/:userID/orders", authMiddleware, getOrdersHistory);
router.get("/customers/orders/:orderID/track", authMiddleware, trackOrderstatus);

// DRIVER
router.get("/drivers", authMiddleware, getAllDrivers);
router.get("/drivers/available", authMiddleware, getAvailableDrivers);
router.get("/drivers/:userID", authMiddleware, getDriverById);
router.put("/drivers/:userID/availability", authMiddleware, setAvailability);
router.post("/drivers/:userID/accept/:orderID", authMiddleware, acceptDelivery);
router.put("/drivers/orders/:orderID/status", authMiddleware, updateDeliveryStatus);

// MANAGER
router.get("/managers", authMiddleware, getAllManagers);
router.get("/managers/:userID", authMiddleware, getManagerById);
router.put("/managers/:userID", authMiddleware, updateRestaurantInfo);
router.get("/managers/:userID/menu", authMiddleware, getMenu);
router.get("/managers/:userID/orders", authMiddleware, getOrdersQueue);
router.put("/managers/orders/:orderID/status", authMiddleware, updateOrderstatus);

module.exports = router;