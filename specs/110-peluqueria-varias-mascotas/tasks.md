# Tasks — spec 110

- [x] Tipos Cepillado / Baño con cepillado + etiquetas (listado, portal)
- [x] Util `banio-varias-mascotas` + unit tests
- [x] Chips «¿Trae más mascotas?» y guardado de N baños
- [x] Campo Hora de regreso
- [x] Precio al final: «Iniciar» sin precio; se pide al terminar/cobrar
- [x] QA en preview (1280 y 412) — ver registro abajo

## Registro QA
2026-10-27 · preview QA con datos reales, sin guardar:
- 1280: chips Cepillado / Baño con cepillado; Hora 05:49 p.m. junto a Fecha.
- Maruca (Alejandra Berlanga) → «¿Trae más mascotas?» con Coco, Nacho, Tina; marcadas → botón «Guardar 4 baños». Cancelado.
- Lista: baños sin precio muestran ▶ Iniciar; «Terminar y cobrar ahora» pregunta «¿Cuánto se cobra por Coco?». Cancelado.
- 412: chips y hora en una columna, sin scroll lateral.
- CI verde (Lint · Test · Build).

## Arreglo de fechas de citas (2026-10-27)
Cita del 28/10 a las 18:00 salía en «Jueves 29/10». `fecha` se guarda en UTC con Z (18:00 MTY = 00:00Z del 29) y la lista tomaba los 10 primeros caracteres.
- `normalizeFechaIso` y `fechaIsoLocalDeValor`: un instante con zona se pasa a día local.
- `fechaLocalCita` (cita-agenda.util) — `fecha` manda; Cierre del día, Por cobrar hoy y tickets desde cita la usan.
- `cita-dialog`: `fecha_hora` se guarda en hora local (antes UTC sin zona). Sin migrar datos: las 15 citas existentes se leen bien por `fecha`.

## Servicio por mascota y «Llegó un paciente» por mascota (2026-10-27, noche)
Luis: «uno solo viene a baño y el otro a baño y corte y me los agenda igual»; «Llegó un paciente también es búsqueda por dueño».
- Nuevo baño: al marcar otra mascota sale «Servicio de {mascota}» (por defecto «Igual: {servicio}»). Cada baño se guarda con su servicio.
- «¿Trae más mascotas?» también desde «Llegó un paciente» / expediente (sin buscador): carga las mascotas del dueño.
- «Llegó un paciente»: paso 1 = un buscador de mascota (también por dueño o teléfono). Elegir mascota → dueño se llena y salta a «¿Qué viene a hacer?». Elegir dueño → paso 2 como antes. «Dueño nuevo» igual.
- Resumen del baño (sin buscador / editar): vuelve «Molly · Karla Rojas» (los getters se habían perdido en un refactor; salía solo «Mascota»).
- QA preview (sin guardar): «Llegó un paciente» → «Molly» lista 4 Molly con su dueño; elegir la de Karla Rojas → paso 3 directo. «Karla Rojas» → Molly y Milo + la dueña. Baño desde ahí: «Milo · Karla Rojas», «¿Trae más mascotas?» con Molly; servicio de Milo «Baño con corte» con Molly en «Baño» → «Guardar 2 baños». Cancelado. CI verde.
