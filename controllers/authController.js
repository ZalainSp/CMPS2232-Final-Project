const { Auth } = require("../dist/Classes/Auth");
const { Users } = require("../dist/Classes/Users");

const readBearerToken = (header = "") => {
  const [, token] = (header || "").split(" ");
  return token || null;
};

exports.login = async (req, res) => {
  const { username, password, role } = req.body || {};

  if (!username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Username, password, and role are required.",
    });
  }

  try {
    const result = await Auth.login(username.trim(), password, role);
    return res.status(result.success ? 200 : 401).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  const { username, email, contactNumber, password, confirmPassword, role } =
    req.body || {};

  if (
    !username ||
    !email ||
    !contactNumber ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be filled in.",
    });
  }
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match." });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter a valid email address." });
  }

  try {
    const result = await Auth.register(req.body);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.guestLogin = async (req, res) => {
  try {
    const token = await Auth.createSession(null, "Guest");
    return res.json({ success: true, token, users: { role: "Guest" } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  const token = readBearerToken(req.headers.authorization);
  if (token) await Auth.logout(token);
  return res.json({ success: true });
};

exports.deleteAccount = async (req, res) => {
  try {
    const userID = Number(req.user?.userID);
    if (!userID || isNaN(userID)) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    await Users.delete(userID);
    return res.json({
      success: true,
      message: "Account deactivated successfully.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
