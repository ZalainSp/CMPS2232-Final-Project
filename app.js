const express = require("express");
const path = require("path");
const cors = require("cors");
const routes = require("./routes/Routes");

const app = express();

/* ============== LOGGER ============== */
const log = (module, msg) => console.log(`[${module}] ${msg}`);

/* ============== CORS CONFIG ============== */
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

log("APP", "CORS configured");

app.use(express.json());

/* ---------------- FRONTEND ---------------- */
app.use(express.static(path.join(__dirname, "Frontend")));

app.get("/login", (req, res) => {
    res.redirect("/html/login.html");
});

app.get("/register", (req, res) => {
    res.redirect("/html/register.html");
});

/* ---------------- API ---------------- */
app.use("/api", routes);
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

/* ---------------- HOME ---------------- */
app.get("/", (req, res) => {
    res.redirect("/html/login.html");
});

const PORT = 3000;
app.listen(PORT, () => {
    log("SERVER", `🚀 GoBites running at http://localhost:${PORT}`);
});