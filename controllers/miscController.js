const stubJson = (payload) => (req, res) => res.json(payload);

exports.getAllCustomers = stubJson([]);
exports.getCustomerById = stubJson({});
exports.updateDeliveryAddress = stubJson({ success: true });

exports.getAllDrivers = stubJson([]);
exports.getAvailableDrivers = stubJson([]);
exports.getDriverById = stubJson({});
exports.setAvailability = stubJson({ success: true });
exports.acceptDelivery = stubJson({ success: true });
exports.updateDeliveryStatus = stubJson({ success: true });

exports.getAllManagers = stubJson([]);
exports.getManagerById = stubJson({});
exports.updateRestaurantInfo = stubJson({ success: true });
