const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/resumen", async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    const condicionFecha = fecha ? "DATE(fecha) = ?" : "DATE(fecha) = CURDATE()";
    const parametrosFecha = fecha ? [fecha] : [];
    const [trabajadores] = await db.promise().query(
      "SELECT COUNT(*) AS total FROM trabajadores"
    );
    const [asistenciasHoy] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM asistencias WHERE ${condicionFecha}`,
      parametrosFecha
    );
    const [reportesHoy] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM asistencias WHERE ${condicionFecha}`,
      parametrosFecha
    );
    const [turnosActivos] = await db.promise().query(`
      SELECT COUNT(*) AS total
      FROM asistencias a
      INNER JOIN (
        SELECT trabajador_id, MAX(id) AS ultimo_id
        FROM asistencias
        WHERE ${condicionFecha}
        GROUP BY trabajador_id
      ) ultimos ON ultimos.ultimo_id = a.id
      WHERE a.estado = 'entrada'
    `, parametrosFecha);

    res.json({
      totalTrabajadores: trabajadores[0].total,
      totalAsistenciasHoy: asistenciasHoy[0].total,
      totalTurnosActivos: turnosActivos[0].total,
      totalReportes: reportesHoy[0].total
    });
  } catch (err) {
    console.error("Error al obtener resumen:", err);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
});

router.get("/", (req, res) => {
  const esHoy = req.query.fecha === "hoy";
  const fecha = req.query.fecha && !esHoy ? req.query.fecha : null;
  const filtroFecha = esHoy
    ? "WHERE DATE(a.fecha) = CURDATE()"
    : fecha
      ? "WHERE DATE(a.fecha) = ?"
      : "";
  const parametros = fecha ? [fecha] : [];

  const sql = `
    SELECT
      a.id,
      a.trabajador_id,
      t.cedula,
      CONCAT(t.nombre, ' ', t.apellido) AS trabajador,
      a.fecha,
      TIME_FORMAT(a.fecha, '%H:%i:%s') AS hora,
      a.estado,
      tu.nombre AS turno,
      CASE
        WHEN TIME(a.fecha) >= '12:30:00' AND TIME(a.fecha) < '14:00:00' THEN 'Horario de almuerzo'
        WHEN a.estado = 'entrada' AND tu.id IS NULL THEN 'Sin turno asignado'
        WHEN a.estado = 'entrada' AND TIME(a.fecha) <= tu.hora_entrada THEN 'A tiempo'
        WHEN a.estado = 'entrada' THEN 'Retraso'
        WHEN a.estado = 'salida' AND tu.id IS NULL THEN 'Sin turno asignado'
        WHEN a.estado = 'salida' AND TIME(a.fecha) < tu.hora_salida THEN 'Salida anticipada'
        ELSE 'Salida a tiempo'
      END AS puntualidad
    FROM asistencias a
    INNER JOIN trabajadores t ON t.id = a.trabajador_id
    LEFT JOIN turnos tu ON tu.id = (
      SELECT tt2.turno_id
      FROM trabajador_turnos tt2
      INNER JOIN turnos tu2 ON tu2.id = tt2.turno_id
      WHERE tt2.trabajador_id = a.trabajador_id
        AND FIND_IN_SET(DAYOFWEEK(a.fecha), tu2.dias)
      ORDER BY ABS(TIME_TO_SEC(TIME(a.fecha)) - TIME_TO_SEC(tu2.hora_entrada))
      LIMIT 1
    )
    ${filtroFecha}
    ORDER BY a.id DESC
  `;

  db.query(sql, parametros, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al generar reporte" });
    }
    res.json(results);
  });
});

router.get("/excel", (req, res) => {
  const { buscar, empleado, desde, hasta } = req.query;
  const condiciones = [];
  const parametros = [];

  if (buscar) {
    condiciones.push(`(
      CAST(a.id AS CHAR) LIKE ? OR
      CAST(a.trabajador_id AS CHAR) LIKE ? OR
      t.cedula LIKE ? OR
      CONCAT(t.nombre, ' ', t.apellido) LIKE ? OR
      CAST(DATE(a.fecha) AS CHAR) LIKE ? OR
      a.estado LIKE ?
    )`);
    const texto = `%${buscar}%`;
    parametros.push(texto, texto, texto, texto, texto, texto);
  }

  if (empleado) {
    condiciones.push("a.trabajador_id = ?");
    parametros.push(empleado);
  }

  if (desde) {
    condiciones.push("a.fecha >= ?");
    parametros.push(`${desde} 00:00:00`);
  }

  if (hasta) {
    condiciones.push("a.fecha < DATE_ADD(?, INTERVAL 1 DAY)");
    parametros.push(`${hasta} 00:00:00`);
  }

  const where = condiciones.length
    ? `WHERE ${condiciones.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      a.id,
      a.trabajador_id,
      t.cedula,
      CONCAT(t.nombre, ' ', t.apellido) AS trabajador,
      DATE_FORMAT(a.fecha, '%Y/%m/%d') AS fecha,
      TIME_FORMAT(a.fecha, '%H:%i:%s') AS hora,
      a.estado,
      tu.nombre AS turno,
      CASE
        WHEN TIME(a.fecha) >= '12:30:00' AND TIME(a.fecha) < '14:00:00' THEN 'Horario de almuerzo'
        WHEN a.estado = 'entrada' AND tu.id IS NULL THEN 'Sin turno asignado'
        WHEN a.estado = 'entrada' AND TIME(a.fecha) <= tu.hora_entrada THEN 'A tiempo'
        WHEN a.estado = 'entrada' THEN 'Retraso'
        WHEN a.estado = 'salida' AND tu.id IS NULL THEN 'Sin turno asignado'
        WHEN a.estado = 'salida' AND TIME(a.fecha) < tu.hora_salida THEN 'Salida anticipada'
        ELSE 'Salida a tiempo'
      END AS puntualidad
    FROM asistencias a
    INNER JOIN trabajadores t ON t.id = a.trabajador_id
    LEFT JOIN turnos tu ON tu.id = (
      SELECT tt2.turno_id
      FROM trabajador_turnos tt2
      INNER JOIN turnos tu2 ON tu2.id = tt2.turno_id
      WHERE tt2.trabajador_id = a.trabajador_id
        AND FIND_IN_SET(DAYOFWEEK(a.fecha), tu2.dias)
      ORDER BY ABS(TIME_TO_SEC(TIME(a.fecha)) - TIME_TO_SEC(tu2.hora_entrada))
      LIMIT 1
    )
    ${where}
    ORDER BY a.id DESC
  `;

  db.query(sql, parametros, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al exportar");
    }

    let csv = "ID,ID trabajador,Cedula,Trabajador,Fecha,Hora,Estado,Turno,Puntualidad\n";

    rows.forEach(r => {
      csv += `"${r.id}","${r.trabajador_id}","${r.cedula || ""}","${r.trabajador}","${r.fecha}","${r.hora}","${r.estado}","${r.turno || ""}","${r.puntualidad}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=reporte_asistencia.csv");
    res.send("\ufeff" + csv);
  });
});

module.exports = router;