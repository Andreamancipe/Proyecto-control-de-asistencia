/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_BASE = "/api";

let fotoRegistroBase64 = "";
let fotoAsistenciaBase64 = "";

let streamRegistro = null;
let streamAsistencia = null;

let usuarioActual = "";
let perfilActual = "";
let registrosReportes = [];


/* =========================================================
   LOGIN
========================================================= */

function iniciarSesion() {
    const usuarioInput = document.getElementById("usuario");
    const claveInput = document.getElementById("clave");
    const error = document.getElementById("loginError");

    const usuario = usuarioInput.value.trim();
    const clave = claveInput.value.trim();

    error.textContent = "";

    if (!usuario || !clave) {
        error.textContent = "Ingrese usuario y contraseña.";
        return;
    }

    /*
       USUARIO ADMINISTRADOR
       PIN: 4
    */
    if (
        usuario.toLowerCase() === "administrador" &&
        clave === "4"
    ) {
        usuarioActual = usuario;
        perfilActual = "Administrador";

        entrarAlSistema();
        return;
    }

    /*
       USUARIO CONSULTA
       PIN: 6
    */
    if (
        usuario.toLowerCase() === "consulta" &&
        clave === "6"
    ) {
        usuarioActual = usuario;
        perfilActual = "Consulta";

        entrarAlSistema();
        return;
    }

    error.textContent = "Usuario o contraseña incorrectos.";
}


/* =========================================================
   ENTRAR AL SISTEMA
========================================================= */

function entrarAlSistema() {

    const loginView = document.getElementById("loginView");
    const appView = document.getElementById("appView");

    loginView.classList.add("hidden");
    appView.classList.remove("hidden");

    /*
       Mostrar perfil en el Dashboard
    */
    const tituloPerfil =
        document.querySelector(".dashboard-top h3");

    if (tituloPerfil) {
        tituloPerfil.textContent =
            `PERFIL ${perfilActual.toUpperCase()}`;
    }

    configurarPermisos();

    mostrarVista("dashboard");
}


/* =========================================================
   PERMISOS SEGÚN PERFIL
========================================================= */

function configurarPermisos() {

    const botones =
        document.querySelectorAll(".sidebar button");

    botones.forEach((boton) => {

        const texto =
            boton.textContent.toLowerCase();

        /*
           Administrador:
           puede acceder a todo.
        */
        if (perfilActual === "Administrador") {
            boton.style.display = "";
            return;
        }

        /*
           Consulta:
           solo Dashboard y Reportes.
        */
        if (perfilActual === "Consulta") {

            if (
                texto.includes("trabajadores") ||
                texto.includes("asistencia") ||
                texto.includes("turnos")
            ) {
                boton.style.display = "none";
            } else {
                boton.style.display = "";
            }
        }
    });
}


/* =========================================================
   CERRAR SESIÓN
========================================================= */

function cerrarSesion() {

    detenerCamara(streamRegistro);
    detenerCamara(streamAsistencia);

    streamRegistro = null;
    streamAsistencia = null;

    fotoRegistroBase64 = "";
    fotoAsistenciaBase64 = "";

    document
        .getElementById("appView")
        .classList.add("hidden");

    document
        .getElementById("loginView")
        .classList.remove("hidden");

    document.getElementById("usuario").value = "";
    document.getElementById("clave").value = "";
    document.getElementById("loginError").textContent = "";

    usuarioActual = "";
    perfilActual = "";
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function mostrarVista(vista) {

    const secciones =
        document.querySelectorAll("main section");

    secciones.forEach((seccion) => {
        seccion.classList.add("hidden");
    });

    const seccion =
        document.getElementById(vista);

    if (!seccion) {
        console.error(
            `No existe la vista: ${vista}`
        );
        return;
    }

    seccion.classList.remove("hidden");


    /*
       Dashboard
    */
    if (vista === "dashboard") {
        const fechaDashboard = document.getElementById("fechaDashboard");
        if (fechaDashboard && !fechaDashboard.value) {
            fechaDashboard.value = new Date().toISOString().slice(0, 10);
        }
        cargarDashboard();
    }


    /*
       Trabajadores
    */
    if (vista === "trabajador") {
        cargarTrabajadores();
    }


    /*
       Asistencia
    */
    if (vista === "asistencia") {
        cargarTrabajadoresEnSelect();
        cargarAsistenciasAsistencia();
    }


    /*
       Reportes
    */
    if (vista === "reportes") {
        cargarReportes();
    }

    if (vista === "turnos") {
        cargarDatosTurnos();
    }
}


/* =========================================================
   CÁMARA - REGISTRO DE TRABAJADOR
========================================================= */

async function iniciarCamaraRegistro() {

    try {

        streamRegistro =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });

        const video =
            document.getElementById("videoRegistro");

        video.srcObject = streamRegistro;

    } catch (error) {

        console.error(
            "Error accediendo a la cámara:",
            error
        );

        alert(
            "No se pudo acceder a la cámara."
        );
    }
}


/* =========================================================
   CAPTURAR FOTO DEL TRABAJADOR
========================================================= */

function capturarFotoRegistro() {

    const video =
        document.getElementById("videoRegistro");

    const canvas =
        document.getElementById("canvasRegistro");

    const preview =
        document.getElementById("previewRegistro");


    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {
        alert(
            "Primero debe abrir la cámara."
        );
        return;
    }


    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    const contexto =
        canvas.getContext("2d");


    contexto.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    fotoRegistroBase64 =
        canvas.toDataURL("image/png");


    preview.src =
        fotoRegistroBase64;

    preview.classList.remove("hidden");
}


/* =========================================================
   CÁMARA - ASISTENCIA
========================================================= */

async function iniciarCamaraAsistencia() {

    try {

        streamAsistencia =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });

        const video =
            document.getElementById(
                "videoAsistencia"
            );

        video.srcObject =
            streamAsistencia;

    } catch (error) {

        console.error(
            "Error accediendo a la cámara:",
            error
        );

        alert(
            "No se pudo acceder a la cámara."
        );
    }
}


/* =========================================================
   CAPTURAR FOTO PARA ASISTENCIA
========================================================= */

function capturarFotoAsistencia() {

    const video =
        document.getElementById(
            "videoAsistencia"
        );

    const canvas =
        document.getElementById(
            "canvasAsistencia"
        );

    const preview =
        document.getElementById(
            "previewAsistencia"
        );


    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {
        alert(
            "Primero debe abrir la cámara."
        );
        return;
    }


    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const contexto =
        canvas.getContext("2d");


    contexto.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    fotoAsistenciaBase64 =
        canvas.toDataURL("image/png");


    preview.src =
        fotoAsistenciaBase64;

    preview.classList.remove("hidden");
}


/* =========================================================
   DETENER CÁMARA
========================================================= */

function detenerCamara(stream) {

    if (!stream) {
        return;
    }

    stream
        .getTracks()
        .forEach((track) => {
            track.stop();
        });
}


/* =========================================================
   REGISTRAR TRABAJADOR
========================================================= */

async function registrarTrabajador() {

    /*
       Solo Administrador
    */
    if (perfilActual !== "Administrador") {
        alert(
            "No tiene permisos para registrar trabajadores."
        );
        return;
    }


    const nombre =
        document.getElementById("nombre")
            .value
            .trim();

    const apellido =
        document.getElementById("apellido")
            .value
            .trim();

    const cedula =
        document.getElementById("cedula")
            .value
            .trim();

    const correo =
        document.getElementById("correo")
            .value
            .trim();

    const cargo =
        document.getElementById("cargo")
            .value
            .trim();

    const fechaIngreso =
        document.getElementById("fechaIngreso")
            .value;


    /*
       Validaciones
    */

    if (!nombre) {
        alert("Ingrese el nombre.");
        return;
    }

    if (!apellido) {
        alert("Ingrese el apellido.");
        return;
    }

    if (!cedula) {
        alert("Ingrese la cédula.");
        return;
    }

    if (!correo) {
        alert("Ingrese el correo.");
        return;
    }

    if (!cargo) {
        alert("Ingrese el cargo.");
        return;
    }

    if (!fechaIngreso) {
        alert("Ingrese la fecha de ingreso.");
        return;
    }

    if (!fotoRegistroBase64) {
        alert(
            "Debe tomar la foto biométrica."
        );
        return;
    }


    /*
       Validación de correo
    */

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
        alert(
            "Ingrese un correo electrónico válido."
        );
        return;
    }


    try {

        /*
           Consultar trabajadores existentes
        */

        const resCheck =
            await fetch(
                `${API_BASE}/trabajadores`
            );


        if (!resCheck.ok) {
            throw new Error(
                "No fue posible consultar los trabajadores."
            );
        }


        const trabajadores =
            await resCheck.json();


        /*
           Verificar cédula duplicada
        */

        const existe =
            trabajadores.some(
                (trabajador) =>
                    String(trabajador.cedula) ===
                    String(cedula)
            );


        if (existe) {

            alert(
                "Ya existe un trabajador con esa cédula."
            );

            return;
        }


        /*
           Datos que enviamos a Node.js
        */

        const datos = {

            nombre: nombre,

            apellido: apellido,

            cedula: cedula,

            correo: correo,

            cargo: cargo,

            fechaIngreso: fechaIngreso,

            foto: fotoRegistroBase64
        };


        /*
           POST
           FRONTEND → NODE.JS → MYSQL
        */

        const respuesta =
            await fetch(
                `${API_BASE}/trabajadores`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                resultado.error ||
                "No fue posible registrar el trabajador."
            );

            return;
        }


        /*
           Limpiar formulario
        */

        document.getElementById("nombre").value = "";
        document.getElementById("apellido").value = "";
        document.getElementById("cedula").value = "";
        document.getElementById("correo").value = "";
        document.getElementById("cargo").value = "";
        document.getElementById("fechaIngreso").value = "";


        fotoRegistroBase64 = "";


        const preview =
            document.getElementById(
                "previewRegistro"
            );


        preview.src = "";
        preview.classList.add("hidden");


        alert(
            "Trabajador registrado correctamente."
        );


        /*
           Actualizar información
        */

        await cargarTrabajadores();

        await cargarDashboard();

        await cargarTrabajadoresEnSelect();

    } catch (error) {

        console.error(
            "Error registrando trabajador:",
            error
        );

        alert(
            "Error comunicando con Node.js."
        );
    }
}


/* =========================================================
   CARGAR TRABAJADORES
========================================================= */

async function cargarTrabajadores() {

    try {

        const respuesta =
            await fetch(
                `${API_BASE}/trabajadores`
            );


        if (!respuesta.ok) {
            throw new Error(
                "Error consultando trabajadores."
            );
        }


        const trabajadores =
            await respuesta.json();


        const tbody =
            document.getElementById(
                "tablaTrabajadores"
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = "";


        trabajadores.forEach(
            (trabajador) => {

                const fila =
                    document.createElement("tr");


                fila.innerHTML = `

                    <td>
                        ${trabajador.id || ""}
                    </td>

                    <td>
                        ${
                            trabajador.foto
                                ? `
                                    <img
                                        src="${trabajador.foto}"
                                        width="60"
                                        height="60"
                                        alt="Foto trabajador"
                                    >
                                  `
                                : "Sin foto"
                        }
                    </td>

                    <td>
                        ${trabajador.nombre || ""}
                    </td>

                    <td>
                        ${trabajador.apellido || ""}
                    </td>

                    <td>
                        ${trabajador.cedula || ""}
                    </td>

                    <td>
                        ${trabajador.correo || ""}
                    </td>

                    <td>
                        ${trabajador.cargo || ""}
                    </td>

                    <td>
                        ${soloFecha(
                            trabajador.fecha_ingreso
                        )}
                    </td>

                    <td>
                        ${formatearFecha(
                            trabajador.fecha_registro
                        )}
                    </td>

                `;


                tbody.appendChild(fila);
            }
        );

    } catch (error) {

        console.error(
            "Error cargando trabajadores:",
            error
        );

        alert(
            "No se pudieron cargar los trabajadores."
        );
    }
}


/* =========================================================
   CARGAR TRABAJADORES EN SELECT
========================================================= */

async function cargarTrabajadoresEnSelect() {

    try {

        const respuesta =
            await fetch(
                `${API_BASE}/trabajadores`
            );


        if (!respuesta.ok) {
            throw new Error(
                "Error consultando trabajadores."
            );
        }


        const trabajadores =
            await respuesta.json();


        const select =
            document.getElementById(
                "trabajadorAsistencia"
            );


        if (!select) {
            return;
        }


        select.innerHTML = `
            <option value="">
                Seleccione trabajador
            </option>
        `;


        trabajadores.forEach(
            (trabajador) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    trabajador.id;


                option.textContent =
                    `${trabajador.nombre} ${trabajador.apellido}`;


                option.dataset.foto =
                    trabajador.foto || "";


                select.appendChild(option);
            }
        );

    } catch (error) {

        console.error(
            "Error cargando trabajadores en select:",
            error
        );

        alert(
            "No se pudieron cargar los trabajadores."
        );
    }
}


/* =========================================================
   REGISTRAR ASISTENCIA
========================================================= */

async function registrarAsistencia(tipo) {

    /*
       Solo Administrador
    */

    if (perfilActual !== "Administrador") {

        alert(
            "No tiene permisos para registrar asistencia."
        );

        return;
    }


    const select =
        document.getElementById(
            "trabajadorAsistencia"
        );


    if (!select) {
        return;
    }


    const trabajadorId =
        select.value;


    if (!trabajadorId) {

        alert(
            "Seleccione un trabajador."
        );

        return;
    }


    if (!fotoAsistenciaBase64) {

        alert(
            "Debe capturar el rostro."
        );

        return;
    }


    try {

        /*
           Enviar asistencia a Node.js
        */

        const respuesta =
            await fetch(
                `${API_BASE}/asistencia`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            trabajador_id:
                                trabajadorId,

                            estado:
                                tipo
                        })
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                resultado.error ||
                `No fue posible registrar la ${tipo}.`
            );

            return;
        }


        alert(
            tipo === "entrada"
                ? "Entrada registrada correctamente."
                : "Salida registrada correctamente."
        );


        /*
           Limpiar foto
        */

        fotoAsistenciaBase64 = "";


        const preview =
            document.getElementById(
                "previewAsistencia"
            );


        if (preview) {

            preview.src = "";

            preview.classList.add(
                "hidden"
            );
        }


        /*
           Actualizar información
        */

        await cargarDashboard();

        await cargarReportes();

        await cargarAsistenciasAsistencia();

    } catch (error) {

        console.error(
            "Error registrando asistencia:",
            error
        );

        alert(
            "Error comunicando con Node.js."
        );
    }
}


/* =========================================================
   ASISTENCIAS DEL PANEL DE ASISTENCIA
========================================================= */

async function cargarAsistenciasAsistencia() {

    try {
        const respuesta = await fetch(`${API_BASE}/reportes?fecha=hoy`);

        if (!respuesta.ok) {
            throw new Error("No fue posible obtener las asistencias.");
        }

        const datos = await respuesta.json();
        const tbody = document.getElementById("tablaAsistencia");

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        datos.forEach((registro) => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${registro.id}</td>
                <td>${registro.trabajador || ""}</td>
                <td>${soloFecha(registro.fecha)}</td>
                <td>${soloHora(registro.fecha)}</td>
                <td>${registro.estado}</td>
                <td>${registro.puntualidad || "Sin turno asignado"}</td>
            `;

            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error("Error cargando asistencias del panel:", error);
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function cargarDashboard() {

    try {

        /*
           Resumen
        */

        const respuesta =
            await fetch(
                `${API_BASE}/reportes/resumen?fecha=${document.getElementById("fechaDashboard")?.value || ""}`
            );


        if (!respuesta.ok) {
            throw new Error(
                "No fue posible obtener el resumen."
            );
        }


        const datos =
            await respuesta.json();


        const totalTrabajadores =
            document.getElementById(
                "totalTrabajadores"
            );

        const totalAsistencias =
            document.getElementById(
                "totalAsistenciasHoy"
            );

        const totalTurnos =
            document.getElementById(
                "totalTurnosActivos"
            );

        const totalReportes =
            document.getElementById(
                "totalReportes"
            );


        if (totalTrabajadores) {
            totalTrabajadores.textContent =
                datos.totalTrabajadores || 0;
        }


        if (totalAsistencias) {
            totalAsistencias.textContent =
                datos.totalAsistenciasHoy || 0;
        }


        if (totalTurnos) {
            totalTurnos.textContent =
                datos.totalTurnosActivos || 1;
        }


        if (totalReportes) {
            totalReportes.textContent =
                datos.totalReportes || 0;
        }


        /*
           Cargar tabla de asistencia
        */

        await cargarAsistenciasDashboard();

    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }
}


/* =========================================================
   ASISTENCIAS DEL DASHBOARD
========================================================= */

async function cargarAsistenciasDashboard() {

    try {

        const respuesta =
            await fetch(
                `${API_BASE}/reportes?fecha=${document.getElementById("fechaDashboard")?.value || "hoy"}`
            );


        if (!respuesta.ok) {
            throw new Error(
                "No fue posible obtener los reportes."
            );
        }


        const datos =
            await respuesta.json();


        const tbody =
            document.getElementById(
                "tablaDashboard"
            );


        if (!tbody) {
            return;
        }


        const filtroPresencia = document.getElementById("filtroPresenciaDashboard")?.value || "todos";
        const ultimaMarcacion = new Map();

        datos.forEach((registro) => {
            if (!ultimaMarcacion.has(String(registro.trabajador_id))) {
                ultimaMarcacion.set(String(registro.trabajador_id), registro);
            }
        });

        const datosFiltrados = filtroPresencia === "todos"
            ? datos
            : Array.from(ultimaMarcacion.values()).filter((registro) => (
                filtroPresencia === "dentro"
                    ? registro.estado === "entrada"
                    : registro.estado === "salida"
            ));

        tbody.innerHTML = "";

        datosFiltrados.forEach((registro) => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${registro.trabajador_id || ""}
                    </td>

                    <td>
                        ${registro.cedula || ""}
                    </td>

                    <td>
                        ${registro.trabajador || ""}
                    </td>

                    <td>
                        ${soloFecha(
                            registro.fecha
                        )}
                    </td>

                    <td>
                        ${soloHora(
                            registro.fecha
                        )}
                    </td>

                    <td>
                        ${registro.estado || ""}
                    </td>

                    <td>
                        ${registro.puntualidad || ""}
                    </td>

                `;


                tbody.appendChild(fila);
            });

    } catch (error) {

        console.error(
            "Error cargando asistencias del dashboard:",
            error
        );
    }
}

async function cargarDatosTurnos() {
    try {
        const [trabajadoresResponse, turnosResponse, asignacionesResponse] = await Promise.all([
            fetch(`${API_BASE}/trabajadores`),
            fetch(`${API_BASE}/turnos`),
            fetch(`${API_BASE}/turnos/asignaciones`)
        ]);
        const trabajadores = await trabajadoresResponse.json();
        const turnos = await turnosResponse.json();
        const asignaciones = await asignacionesResponse.json();

        const empleadoSelect = document.getElementById("empleadoTurno");
        const turnoSelect = document.getElementById("turnoAsignar");
        empleadoSelect.innerHTML = '<option value="">Seleccione empleado</option>';
        turnoSelect.innerHTML = '<option value="">Seleccione turno</option>';

        trabajadores.forEach((trabajador) => {
            const option = document.createElement("option");
            option.value = trabajador.id;
            option.textContent = `${trabajador.nombre} ${trabajador.apellido} - ${trabajador.cedula || "Sin cédula"}`;
            empleadoSelect.appendChild(option);
        });

        turnos.forEach((turno) => {
            const option = document.createElement("option");
            option.value = turno.id;
            option.textContent = `${turno.nombre} (${turno.hora_entrada} - ${turno.hora_salida})${turno.extras ? " - Extra" : ""}`;
            turnoSelect.appendChild(option);
        });

        const tbody = document.getElementById("tablaAsignaciones");
        tbody.innerHTML = asignaciones.map((asignacion) => `
            <tr><td>${asignacion.trabajador}</td><td>${asignacion.cedula || ""}</td>
            <td>${asignacion.turno}</td><td>${asignacion.hora_entrada} - ${asignacion.hora_salida}</td></tr>
        `).join("");
    } catch (error) {
        console.error("Error cargando turnos:", error);
        alert("No se pudieron cargar los turnos.");
    }
}

async function crearTurno() {
    const datos = {
        nombre: document.getElementById("nombreTurno").value.trim(),
        horaEntrada: document.getElementById("horaEntradaTurno").value,
        horaSalida: document.getElementById("horaSalidaTurno").value,
        dias: document.getElementById("diasTurno").value,
        extras: document.getElementById("turnoExtra").checked
    };

    const respuesta = await fetch(`${API_BASE}/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        alert(resultado.error || "No se pudo crear el turno.");
        return;
    }

    alert("Turno creado correctamente.");
    document.getElementById("nombreTurno").value = "";
    cargarDatosTurnos();
}

async function asignarTurno() {
    const respuesta = await fetch(`${API_BASE}/turnos/asignar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trabajadorId: document.getElementById("empleadoTurno").value,
            turnoId: document.getElementById("turnoAsignar").value
        })
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        alert(resultado.error || "No se pudo asignar el turno.");
        return;
    }

    alert("Turno asignado correctamente.");
    cargarDatosTurnos();
}


/* =========================================================
   REPORTES
========================================================= */

async function cargarReportes() {

    try {

        const respuesta =
            await fetch(
                `${API_BASE}/reportes`
            );


        if (!respuesta.ok) {
            throw new Error(
                "No fue posible obtener reportes."
            );
        }


        const datos =
            await respuesta.json();


        registrosReportes = datos;
        cargarEmpleadosFiltro();
        aplicarFiltrosReportes();

    } catch (error) {

        console.error(
            "Error cargando reportes:",
            error
        );

        alert(
            "No se pudieron cargar los reportes."
        );
    }
}

async function cargarEmpleadosFiltro() {
    const select = document.getElementById("filtroEmpleado");

    if (!select) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/trabajadores`);
        const trabajadores = await respuesta.json();

        select.innerHTML = '<option value="">Todos los empleados</option>';

        trabajadores.forEach((trabajador) => {
            const option = document.createElement("option");
            option.value = trabajador.id;
            option.textContent = `${trabajador.nombre} ${trabajador.apellido} - ${trabajador.cedula || "Sin cédula"}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando empleados para filtros:", error);
    }
}

function aplicarFiltrosReportes() {
    const busqueda = (document.getElementById("filtroGeneral")?.value || "").trim().toLowerCase();
    const empleado = document.getElementById("filtroEmpleado")?.value || "";
    const fechaDesde = document.getElementById("filtroFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("filtroFechaHasta")?.value || "";
    const tbody = document.getElementById("tablaReportes");

    if (!tbody) {
        return;
    }

    const registrosFiltrados = registrosReportes.filter((registro) => {
        const textoRegistro = [
            registro.id,
            registro.trabajador_id,
            registro.cedula,
            registro.trabajador,
            registro.fecha,
            registro.estado
        ].join(" ").toLowerCase();

        const fechaRegistro = String(registro.fecha).slice(0, 10);

        return (!busqueda || textoRegistro.includes(busqueda))
            && (!empleado || String(registro.trabajador_id) === empleado)
            && (!fechaDesde || fechaRegistro >= fechaDesde)
            && (!fechaHasta || fechaRegistro <= fechaHasta);
    });

    tbody.innerHTML = "";

    registrosFiltrados.forEach((registro) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${registro.id || ""}</td>
            <td>${registro.cedula || ""}</td>
            <td>${registro.trabajador || ""}</td>
            <td>${formatearFechaReporte(registro.fecha)}</td>
            <td>${registro.hora || soloHora(registro.fecha)}</td>
            <td>${registro.estado || ""}</td>
            <td>${registro.puntualidad || ""}</td>
        `;
        tbody.appendChild(fila);
    });
}

function limpiarFiltrosReportes() {
    document.getElementById("filtroGeneral").value = "";
    document.getElementById("filtroEmpleado").value = "";
    document.getElementById("filtroFechaDesde").value = "";
    document.getElementById("filtroFechaHasta").value = "";
    aplicarFiltrosReportes();
}


/* =========================================================
   EXPORTAR EXCEL
========================================================= */

function exportarExcel() {
    const parametros = new URLSearchParams();
    const busqueda = document.getElementById("filtroGeneral")?.value.trim() || "";
    const empleado = document.getElementById("filtroEmpleado")?.value || "";
    const fechaDesde = document.getElementById("filtroFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("filtroFechaHasta")?.value || "";

    if (busqueda) parametros.set("buscar", busqueda);
    if (empleado) parametros.set("empleado", empleado);
    if (fechaDesde) parametros.set("desde", fechaDesde);
    if (fechaHasta) parametros.set("hasta", fechaHasta);

    window.open(
        `${API_BASE}/reportes/excel?${parametros.toString()}`,
        "_blank"
    );
}


/* =========================================================
   FORMATO DE FECHAS
========================================================= */

function formatearFecha(valor) {

    if (!valor) {
        return "";
    }

    const fecha =
        new Date(valor);

    if (isNaN(fecha.getTime())) {
        return valor;
    }

    return fecha.toLocaleString(
        "es-CO"
    );
}

function formatearFechaReporte(valor) {
    if (!valor) {
        return "";
    }

    const fecha = new Date(valor);

    if (isNaN(fecha.getTime())) {
        return valor;
    }

    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${año}/${mes}/${dia}`;
}


function soloFecha(valor) {

    if (!valor) {
        return "";
    }

    const fecha =
        new Date(valor);

    if (isNaN(fecha.getTime())) {
        return valor;
    }

    return fecha.toLocaleDateString(
        "es-CO"
    );
}


function soloHora(valor) {

    if (!valor) {
        return "";
    }

    const fecha =
        new Date(valor);

    if (isNaN(fecha.getTime())) {
        return valor;
    }

    return fecha.toLocaleTimeString(
        "es-CO"
    );
}


/* =========================================================
   ENTER PARA INICIAR SESIÓN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const clave =
            document.getElementById(
                "clave"
            );


        if (clave) {

            clave.addEventListener(
                "keydown",
                (evento) => {

                    if (
                        evento.key === "Enter"
                    ) {
                        iniciarSesion();
                    }
                }
            );
        }

        ["filtroGeneral", "filtroEmpleado", "filtroFechaDesde", "filtroFechaHasta"].forEach((id) => {
            const control = document.getElementById(id);

            if (control) {
                control.addEventListener("input", aplicarFiltrosReportes);
                control.addEventListener("change", aplicarFiltrosReportes);
            }
        });

        const fechaDashboard = document.getElementById("fechaDashboard");
        if (fechaDashboard) {
            fechaDashboard.addEventListener("change", cargarDashboard);
        }

        const filtroPresencia = document.getElementById("filtroPresenciaDashboard");
        if (filtroPresencia) {
            filtroPresencia.addEventListener("change", cargarAsistenciasDashboard);
        }
    }
);


/* =========================================================
   HACER FUNCIONES DISPONIBLES PARA HTML
========================================================= */

window.iniciarSesion =
    iniciarSesion;

window.cerrarSesion =
    cerrarSesion;

window.mostrarVista =
    mostrarVista;

window.iniciarCamaraRegistro =
    iniciarCamaraRegistro;

window.capturarFotoRegistro =
    capturarFotoRegistro;

window.iniciarCamaraAsistencia =
    iniciarCamaraAsistencia;

window.capturarFotoAsistencia =
    capturarFotoAsistencia;

window.registrarTrabajador =
    registrarTrabajador;

window.registrarAsistencia =
    registrarAsistencia;

window.exportarExcel =
    exportarExcel;

window.crearTurno =
    crearTurno;

window.asignarTurno =
    asignarTurno;

window.limpiarFiltrosReportes =
    limpiarFiltrosReportes;
