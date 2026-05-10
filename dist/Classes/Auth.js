"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = exports.AuthDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const crypto_1 = __importDefault(require("crypto"));
class AuthDef {}
exports.AuthDef = AuthDef;
class Auth extends AuthDef {
  static async login(username, password, role) {
    try {
      const usersRes = await dbConnection_1.default.query(
        `SELECT userID AS "userID", username AS "username", email AS "email",
                contactNumber AS "contactNumber",
                passwordHash AS "passwordHash", passwordSalt AS "passwordSalt"
         FROM Users WHERE username = $1`,
        [username],
      );
      if (usersRes.rowCount === 0) {
        return { success: false, message: "Invalid username or password." };
      }
      const user = usersRes.rows[0];
      const hashed = Auth.hashPassword(password, user.passwordSalt);
      if (hashed !== user.passwordHash) {
        return { success: false, message: "Invalid username or password." };
      }
      const roleTable = Auth.getRoleTable(role);
      if (!roleTable) {
        return { success: false, message: "Invalid role selected." };
      }
      const roleRes = await dbConnection_1.default.query(
        `SELECT * FROM ${roleTable} WHERE userID = $1`,
        [user.userID],
      );
      if (roleRes.rowCount === 0) {
        return {
          success: false,
          message: `No ${role} account found for this user.`,
        };
      }
      const roleRow = roleRes.rows[0];
      const token = await Auth.createSession(user.userID, role);
      // Attach role-specific fields the frontend dashboards depend on
      const extra = {};
      if (role === "Manager") {
        extra.restaurantID =
          roleRow.restaurantid ?? roleRow.restaurantID ?? null;
        extra.restaurantName =
          roleRow.restaurantname ?? roleRow.restaurantName ?? null;
        extra.openingHours =
          roleRow.openinghours ?? roleRow.openingHours ?? null;
      } else if (role === "Driver") {
        extra.vehicleType = roleRow.vehicletype ?? roleRow.vehicleType ?? null;
        extra.available = roleRow.available ?? false;
      } else if (role === "Customer") {
        extra.deliveryAddress =
          roleRow.deliveryaddress ?? roleRow.deliveryAddress ?? null;
      }
      return {
        success: true,
        message: "Login successful",
        token,
        users: {
          userID: user.userID,
          username: user.username,
          email: user.email,
          contactNumber: user.contactNumber,
          role,
          ...extra,
        },
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
  static async register(data) {
    const { username, email, contactNumber, password, confirmPassword, role } =
      data;
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }
    const salt = Auth.generateSalt();
    const hash = Auth.hashPassword(password, salt);
    const client = await dbConnection_1.default.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query(
        "SELECT userID FROM Users WHERE username = $1 OR email = $2",
        [username, email],
      );
      if ((existing.rowCount ?? 0) > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message: "Username or email is already in use.",
        };
      }
      const userRes = await client.query(
        `INSERT INTO Users (username, email, contactNumber, passwordHash, passwordSalt)
         VALUES ($1,$2,$3,$4,$5) RETURNING userID AS "userID"`,
        [username, email, contactNumber, hash, salt],
      );
      const userID = userRes.rows[0].userID;
      await Auth.insertRoleRecord(client, userID, role, data);
      // Every customer gets a Cart row
      if (role === "Customer") {
        await client.query(
          "INSERT INTO Cart (userID) VALUES ($1) ON CONFLICT (userID) DO NOTHING",
          [userID],
        );
      }
      await client.query("COMMIT");
      const token = await Auth.createSession(userID, role);
      return {
        success: true,
        message: "Registration successful.",
        token,
        users: { userID, username, email, role },
      };
    } catch (e) {
      await client.query("ROLLBACK");
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }
  static async logout(token) {
    await dbConnection_1.default.query("DELETE FROM Session WHERE token = $1", [
      token,
    ]);
  }
  static async createSession(userID, role) {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    await dbConnection_1.default.query(
      "INSERT INTO Session (token, userID, role, expiresAt) VALUES ($1,$2,$3, NOW() + INTERVAL '8 hours')",
      [token, userID, role],
    );
    return token;
  }
  static async verifySession(token) {
    const res = await dbConnection_1.default.query(
      `SELECT userID AS "userID", role AS "role"
       FROM Session WHERE token = $1 AND expiresAt > NOW()`,
      [token],
    );
    if (res.rowCount === 0) return null;
    return { userID: res.rows[0].userID, role: res.rows[0].role };
  }
  static generateSalt() {
    return crypto_1.default.randomBytes(16).toString("hex");
  }
  static hashPassword(password, salt) {
    return crypto_1.default
      .createHmac("sha256", salt)
      .update(password)
      .digest("hex");
  }
  static getRoleTable(role) {
    const map = {
      Customer: "Customer",
      Manager: "RestaurantManager",
      Driver: "Driver",
      Admin: "Admin",
    };
    return map[role] || null;
  }
  static async insertRoleRecord(client, userID, role, data) {
    switch (role) {
      case "Customer":
        await client.query(
          "INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1,$2,'Active')",
          [userID, data.deliveryAddress ?? ""],
        );
        break;
      case "Manager":
        // restaurantID is GENERATED ALWAYS AS IDENTITY — never insert it explicitly
        await client.query(
          "INSERT INTO RestaurantManager (userID, restaurantName, openingHours) VALUES ($1,$2,$3)",
          [userID, data.restaurantName, data.openingHours],
        );
        break;
      case "Driver":
        await client.query(
          "INSERT INTO Driver (userID, vehicleType, available) VALUES ($1,$2,true)",
          [userID, data.vehicleType],
        );
        break;
      case "Admin":
        await client.query(
          "INSERT INTO Admin (userID, roleTitle) VALUES ($1,'System Admin')",
          [userID],
        );
        break;
    }
  }
}
exports.Auth = Auth;
