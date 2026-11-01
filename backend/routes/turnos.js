const express = require("express");
const router = express.Router();
const db = require("../db");

const schemaReady = (async () => {
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS turnos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      hora_entrada TIME NOT NULL,
      hora_salida TIME NOT NULL,
      dias VARCHAR(30) NOT NULL DEFAULT '2,3,4,5,6',
      extras TINYINT(1) NOT NULL DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS trabajador_turnos (
      trabajador_id INT PRIMARY KEY,
      turno_id INT NOT NULL
    )
  `);
  await db.promise().query(`
    INSERT INTO turnos (nombre, hora_entrada, hora_salida, dias, extras)
    SELECT 'Turno 1', '08:00:00', '17:00:00', '2,3,4,5,6', 0
    WHERE NOT EXISTS (SELECT 1 FROM turnos WHERE nombre = 'Turno 1')
  `);
  await db.promise().query(`
    INSERT INTO turnos (nombre, hora_entrada, hora_salida, dias, extras)
    SELECT 'Turno Mañana', '08:00:00', '12:30:00', '2,3,4,5,6', 0
    WHERE NOT EXISTS (SELECT 1 FROM turnos WHERE nombre = 'Turno Mañana')
  `);
  await db.promise().query(`
    INSERT INTO turnos (nombre, hora_entrada, hora_salida, dias, extras)
    SELECT 'Turno Tarde', '14:00:00', '17:00:00', '2,3,4,5,6', 0
    WHERE NOT EXISTS (SELECT 1 FROM turnos WHERE nombre = 'Turno Tarde')
  `);

  try {
    await db.promise().query(
      "ALTER TABLE trabajador_turnos DROP PRIMARY KEY, ADD PRIMARY KEY (trabajador_id, turno_id)"
    );
  } catch (err) {
    if (err.code !== "ER_MULTIPLE_PRI_KEY" && err.code !== "ER_DROP_INDEX_FK") {
      console.warn("La clave de turnos ya usa el formato compatible o requiere revisión:", err.code);
    }
  }
})();

router.get("/", async (req, res) => {
  try {
    await schemaReady;
    const [rows] = await db.promise().query(`
      SELECT id, nombre, TIME_FORMAT(hora_entrada, '%H:%i') AS hora_entrada,
             TIME_FORMAT(hora_salida, '%H:%i') AS hora_salida, dias, extras
      FROM turnos
      ORDER BY extras, hora_entrada, nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al consultar turnos:", err);
    res.status(500).json({ error: "Error al consultar turnos" });
  }
});

router.post("/", async (req, res) => {
  const { nombre, horaEntrada, horaSalida, dias, extras } = req.body;

  if (!nombre || !horaEntrada || !horaSalida) {
    return res.status(400).json({ error: "Nombre, hora de entrada y hora de salida son obligatorios" });
  }

  try {
    await schemaReady;
    const [result] = await db.promise().query(
      `INSERT INTO turnos (nombre, hora_entrada, hora_salida, dias, extras) VALUES (?, ?, ?, ?, ?)`,
      [nombre, horaEntrada, horaSalida, dias || "1,2,3,4,5", extras ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, nombre, horaEntrada, horaSalida });
  } catch (err) {
    console.error("Error al crear turno:", err);
    res.status(500).json({ error: "Error al crear turno" });
  }
});

router.get("/asignaciones", async (req, res) => {
  try {
    await schemaReady;
    const [rows] = await db.promise().query(`
      SELECT t.id AS trabajador_id, CONCAT(t.nombre, ' ', t.apellido) AS trabajador,
             t.cedula, tu.id AS turno_id, tu.nombre AS turno,
             TIME_FORMAT(tu.hora_entrada, '%H:%i') AS hora_entrada,
             TIME_FORMAT(tu.hora_salida, '%H:%i') AS hora_salida
      FROM trabajador_turnos tt
      INNER JOIN trabajadores t ON t.id = tt.trabajador_id
      INNER JOIN turnos tu ON tu.id = tt.turno_id
      ORDER BY trabajador
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al consultar asignaciones:", err);
    res.status(500).json({ error: "Error al consultar asignaciones" });
  }
});

router.post("/asignar", async (req, res) => {
  const { trabajadorId, turnoId } = req.body;

  if (!trabajadorId || !turnoId) {
    return res.status(400).json({ error: "Debe seleccionar trabajador y turno" });
  }

  try {
    await schemaReady;
    await db.promise().query(
      `INSERT IGNORE INTO trabajador_turnos (trabajador_id, turno_id) VALUES (?, ?)`,
      [trabajadorId, turnoId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al asignar turno:", err);
    res.status(500).json({ error: "Error al asignar turno" });
  }
});

module.exports = router;
