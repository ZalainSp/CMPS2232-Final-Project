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
    res.sendFile(path.join(__dirname, "Frontend", "login.html"));
});

/* ---------------- API ---------------- */
app.use("/api", routes);

/* ---------------- HOME ---------------- */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Frontend", "login.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    log("SERVER", `🚀 GoBites running at http://localhost:${PORT}`);
});