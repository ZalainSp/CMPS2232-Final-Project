const { PromoCode } = require("../dist/Classes/PromoCode");

exports.validatePromo = async (req, res) => {
  const { code, subtotal } = req.body || {};

  if (!code || String(code).trim() === "") {
    return res
      .status(400)
      .json({ valid: false, message: "Please enter a promo code." });
  }
  const sub = parseFloat(subtotal);
  if (isNaN(sub) || sub < 0) {
    return res
      .status(400)
      .json({ valid: false, message: "Invalid subtotal amount." });
  }

  try {
    const result = await PromoCode.validate(code.trim(), sub);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch (e) {
    return res.status(500).json({ valid: false, message: e.message });
  }
};

exports.getAllPromoCodes = async (req, res) => {
  try {
    const codes = await PromoCode.getAll();
    return res.json({ success: true, codes });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

exports.addPromoCode = async (req, res) => {
  const { code, discountPercent } = req.body || {};

  if (!code || String(code).trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Promo code text is required." });
  }
  const pct = parseFloat(discountPercent);
  if (isNaN(pct) || pct <= 0 || pct > 100) {
    return res
      .status(400)
      .json({ success: false, message: "Discount must be between 1 and 100." });
  }

  try {
    const existing = await PromoCode.getByCode(code.trim());
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Promo code already exists." });

    const promo = await PromoCode.add(code.trim(), pct);
    return res.status(201).json({ success: true, promo });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

exports.deactivatePromoCode = async (req, res) => {
  const code = req.params.code;
  if (!code)
    return res
      .status(400)
      .json({ success: false, message: "Code is required." });

  try {
    const result = await PromoCode.deactivate(code);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Promo code not found." });
    return res.json({
      success: true,
      message: `"${code.toUpperCase()}" deactivated.`,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
