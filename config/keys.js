var mysql = require("mysql");

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  // user: "bttcprei_kallolray",
  // password: "yy-hJ[PZM5AM",
  database: process.env.DATABASE,
  multipleStatements: true,
});

module.exports = { connection };
