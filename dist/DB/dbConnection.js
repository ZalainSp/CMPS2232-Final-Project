"use strict";
const { Pool } = require("pg");
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "CMPS2232-FP",
    password: "Rainbow1962***",
    port: 5432
});
module.exports = pool;
