const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());

app.use(express.json({
    limit: "20mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "20mb"
}));

app.get("/api/health", (req, res) => {
    db.query("SELECT 1 AS conectado", (err, results) => {
        if (err) {
            return res.status(503).json({
                ok: false,
                error: "No se pudo conectar a la base de datos"
            });
        }

        res.json({
            ok: true,
            database: results[0].conectado === 1
        });
    });
});

// Rutas API
const trabajadoresRoutes = require("./routes/trabajadores");
const asistenciaRoutes = require("./routes/asistencia");
const reportesRoutes = require("./routes/reportes");
const turnosRoutes = require("./routes/turnos");

app.use("/api/trabajadores", trabajadoresRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/turnos", turnosRoutes);

// Servir FRONTEND desde Node.js
app.use(
    express.static(
        path.join(__dirname, "..", "frontend")
    )
);

// Página principal
app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "..",
            "frontend",
            "index.html"
        )
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Servidor corriendo en http://localhost:${PORT}`
    );
});