const express = require("express");
const router = express.Router();
const db = require("../db");

// Registrar asistencia
router.post("/", (req, res) => {
  const { trabajador_id, estado } = req.body;

  if (!trabajador_id) {
    return res.status(400).json({
      error: "Debe seleccionar un trabajador"
    });
  }

  if (!estado || !["entrada", "salida"].includes(estado)) {
    return res.status(400).json({
      error: "El estado debe ser 'entrada' o 'salida'"
    });
  }

  const sql = `
    INSERT INTO asistencias (trabajador_id, fecha, estado)
    VALUES (?, NOW(), ?)
  `;

  db.query(sql, [trabajador_id, estado], (err, result) => {
    if (err) {
      console.error("Error al registrar asistencia:", err);
      return res.status(500).json({
        error: "Error al registrar asistencia"
      });
    }

    res.status(201).json({
      id: result.insertId,
      trabajador_id,
      estado
    });
  });
});

// Obtener asistencias
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM asistencias
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al consultar asistencias:", err);
      return res.status(500).json({
        error: "Error al consultar asistencias"
      });
    }

    res.json(results);
  });
});

module.exports = router;