const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "CMPS2232-FP", 
  password: "-", 
  port: 5432
});

module.exports = pool;