const mysql = require("mysql2");

const connection = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "admin",
    database: process.env.DB_NAME || "control_asistencia",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

connection.query("SELECT 1", (err) => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
        return;
    }

    console.log("Conectado a MySQL");
});

module.exports = connection;