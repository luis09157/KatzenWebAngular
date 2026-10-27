# Tareas 104

- [x] Picker: dual por defecto, mascota primero, opción con datos de Pacientes, búsqueda por teléfono
- [x] Orden: primero mascotas cuyo nombre coincide (`ordenarPacientesPorNombre` + spec); cursor inicia en la mascota
- [x] Textos de Cobrar
- [x] QA (2026-10-26, datos reales, sin guardar): Cobrar a 1280 y 412 px — «jack» muestra los Jack primero con especie · raza · edad · dueño; al elegir «Jack» se llenó el dueño (Juan José Govea Salgado — tel.); se cerró sin crear ticket (sigue solo el de Raquel). Citas: mascota arriba del dueño.

## Seguimiento (2026-10-26) — mascotas del dueño

- Luis: al elegir primero al dueño (LUIS NIÑO MARTINEZ) no salía su mascota. Datos correctos (Oreon ligado por `idCliente`, activo); el campo de mascota con autocompletar solo listaba al hacer clic.
- Arreglo: debajo de la mascota salen botones «Mascotas de este dueño» (nombre — especie · raza · edad); un toque la elige.
