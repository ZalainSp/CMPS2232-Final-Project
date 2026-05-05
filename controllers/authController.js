const { Auth } = require("../dist/Classes/Auth");
const db = require("../dist/DB/dbConnection");

const readBearerToken = (header = "") => {
    const [, token] = header.split(" ");
    return token || null;
};

const attachCreatedAt = async (result) => {
    try {
        if (!result || !result.success || !result.users || !result.users.userID) return result;
        const res = await db.query('SELECT createdat AS "createdAt", created_at FROM Users WHERE userID = $1', [result.users.userID]);
        if (res.rowCount > 0) {
            const row = res.rows[0];
            result.users.createdAt = row.createdAt || row.created_at || null;
        }
    } catch (e) {
        // non-fatal; ignore
    }
    return result;
};

const attachRoleSpecificData = async (result) => {
    try {
        if (!result || !result.success || !result.users || !result.users.userID || !result.users.role) return result;
        
        const userID = result.users.userID;
        const role = result.users.role;

        if (role === "Manager") {
            const managerRes = await db.query(
                'SELECT restaurantID, restaurantName, openingHours FROM RestaurantManager WHERE userID = $1',
                [userID]
            );
            if (managerRes.rowCount > 0) {
                const manager = managerRes.rows[0];
                result.users.restaurantID = manager.restaurantid || manager.restaurantID || null;
                result.users.restaurantName = manager.restaurantname || manager.restaurantName || null;
                result.users.openingHours = manager.openinghours || manager.openingHours || null;
            }
        } else if (role === "Driver") {
            const driverRes = await db.query(
                'SELECT vehicleType, available FROM Driver WHERE userID = $1',
                [userID]
            );
            if (driverRes.rowCount > 0) {
                const driver = driverRes.rows[0];
                result.users.vehicleType = driver.vehicletype || driver.vehicleType || null;
                result.users.available = driver.available !== undefined ? driver.available : false;
            }
        } else if (role === "Customer") {
            const customerRes = await db.query(
                'SELECT deliveryAddress FROM Customer WHERE userID = $1',
                [userID]
            );
            if (customerRes.rowCount > 0) {
                const customer = customerRes.rows[0];
                result.users.deliveryAddress = customer.deliveryaddress || customer.deliveryAddress || null;
            }
        }
    } catch (e) {
        console.error("Error attaching role data:", e.message);
        // non-fatal; ignore
    }
    return result;
};

exports.login = async (req, res) => {
    try {
        const result = await Auth.login(
            req.body.username,
            req.body.password,
            req.body.role
        );

        await attachCreatedAt(result);
        await attachRoleSpecificData(result);
        return res.status(result.success ? 200 : 401).json(result);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.register = async (req, res) => {
    const result = await Auth.register(req.body);
    await attachCreatedAt(result);
    await attachRoleSpecificData(result);
    res.status(result.success ? 201 : 400).json(result);
};

exports.guestLogin = async (req, res) => {
    const result = await Auth.guestLogin();
    res.json(result);
};

exports.logout = async (req, res) => {
    const token = readBearerToken(req.headers.authorization);

    if (token) {
        await Auth.logout(token);
    }

    res.json({ success: true });
};

exports.deleteAccount = async (req, res) => {
    try {
        if (!req.user || !req.user.userID) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userID = Number(req.user.userID);
        if (Number.isNaN(userID)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        await db.query("DELETE FROM Users WHERE userID = $1", [userID]);
        res.json({ success: true, message: "Account deactivated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
