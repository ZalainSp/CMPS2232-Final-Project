// Controller aggregator: re-export per-feature controllers
module.exports = {
    ...require("./authController"),
    ...require("./adminController"),
    ...require("./cartController"),
    ...require("./orderController"),
    ...require("./menuController"),
    ...require("./miscController")
};