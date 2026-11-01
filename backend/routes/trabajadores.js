const express = require("express");
const router = express.Router();
const db = require("../db");

// Registrar trabajador
router.post("/", (req, res) => {
  const {
    nombre,
    apellido,
    cedula,
    correo,
    cargo,
    fechaIngreso,
    foto
  } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({
      error: "Nombre y apellido son obligatorios"
    });
  }

  const sql = `
    INSERT INTO trabajadores
    (nombre, apellido, cedula, correo, cargo, fecha_ingreso, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nombre,
      apellido,
      cedula || null,
      correo || null,
      cargo || null,
      fechaIngreso || null,
      foto || null
    ],
    (err, result) => {
      if (err) {
        console.error("Error al registrar trabajador:", err);
        return res.status(500).json({
          error: "Error al guardar el trabajador"
        });
      }

      res.status(201).json({
        id: result.insertId,
        nombre,
        apellido,
        cedula,
        correo,
        cargo,
        fechaIngreso
      });
    }
  );
});

// Obtener trabajadores
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      id,
      nombre,
      apellido,
      cedula,
      correo,
      cargo,
      fecha_ingreso,
      fecha_registro,
      foto
    FROM trabajadores
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al consultar trabajadores:", err);
      return res.status(500).json({
        error: "Error al consultar trabajadores"
      });
    }

    res.json(results);
  });
});

async function cargarTrabajadores() {
  try {
    const res = await fetch(`${API_BASE}/trabajadores`);
    const data = await res.json();
    
    const tbody = document.getElementById("tablaTrabajadores");
    tbody.innerHTML = "";
    
    data.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td><img src="${t.foto || ''}" width="60" height="60" style="object-fit:cover;border-radius:8px;"></td>
        <td>${t.nombre}</td>
        <td>${t.apellido}</td>
        <td>${t.cedula}</td>
        <td>${t.correo}</td>
        <td>${t.cargo}</td>
        <td>${soloFecha(t.fechaIngreso)}</td>
        <td>${soloFecha(t.fecha_registro)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error cargando trabajadores:", error);
  }
}


module.exports = router;