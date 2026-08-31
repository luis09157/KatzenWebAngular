# Spec: Expediente y directorio unificados (legacy)

**ID:** 057-expediente-directorio-legacy  
**Estado:** done  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

En producción, **Buscar paciente** (`/admin/paciente`) y **Directorio de pacientes** (`/admin/pacientes-admin`) no muestran el mismo universo de mascotas ni la misma ficha.

1. En Buscar paciente se ven mascotas que **no** aparecen en Directorio.
2. El detalle del Directorio es una ficha corta (sin historial, vacunas ni recordatorios).
3. Clientes y mascotas **antiguos** (app móvil) no salen en listados ni búsquedas — ejemplo: **Luis Alfonso Niño Martínez** y su paciente **Oreon**.
4. El expediente a veces muestra **historial vacío** (ej. Nieves) aunque existan registros clínicos.

Causas observadas en código (sin tocar prod):

- Directorio y listado de clientes cargan solo la **última página RTDB** (~100 keys; tras filtrar `activo` quedan ~96). Los registros viejos (push-key anterior) no entran.
- Buscar paciente carga **todo** `Katzen/Mascota`.
- Al hidratar filas se hace `{ id: key, ...val }`: un `id` interno del móvil **pisa** la key RTDB → mismatch dueño / historial.
- Búsqueda de clientes usa solo `nombre` + apellidos, sin `Nombre` / razón social, sin normalizar acentos ni espacios.
- Historial se consulta solo por `paciente_id`; la app móvil puede guardar `idPaciente`.

---

## User stories

### US-1 — Misma lista de mascotas en ambos menús

Como **staff**  
Quiero **ver las mismas mascotas activas en Buscar paciente y en Directorio**  
Para **no perder pacientes legacy ni recientes**

**Criterios de aceptación:**

- [x] SC-001: Ambas vistas leen `Katzen/Mascota` con el mismo criterio de “existe” (`activo !== false`, incluye sin campo `activo`).
- [x] SC-002: El Directorio no se queda en la primera página de ~100 keys; Oreon (u otra mascota antigua) aparece al buscar por nombre si está en RTDB y no está dada de baja.

### US-2 — Expediente completo en ambas entradas

Como **staff**  
Quiero **ver datos del paciente + expediente clínico (historial, vacunas, recordatorios, baños)**  
Para **atender sin saltar entre menús incompletos**

**Criterios de aceptación:**

- [x] SC-003: Buscar paciente muestra ficha (dueño, peso, datos) y pestañas clínicas.
- [x] SC-004: Desde Directorio, “Ver expediente” abre el mismo `/admin/paciente?id=` (misma ficha).
- [x] SC-005: Historial/vacunas/recordatorios resuelven `paciente_id` **y** `idPaciente` (y key vs `id` interno).

### US-3 — Encontrar clientes legacy por nombre

Como **staff**  
Quiero **encontrar a “Luis Alfonso Niño Martínez”** aunque el registro sea móvil (`Nombre`), con ñ o espacios raros  
Para **abrir su ficha y la de Oreon**

**Criterios de aceptación:**

- [x] SC-006: El listado de clientes carga la colección activa completa (no solo 100 keys recientes).
- [x] SC-007: La búsqueda normaliza acentos/espacios y cubre `nombre` / `Nombre` / apellidos / `razonSocial`.

---

## Fuera de alcance

- Migración masiva o reescritura de nodos legacy en RTDB
- Borrado o `remove()` de clientes/mascotas
- Deploy de Hosting, Functions o rules (solo cambio aditivo de `.indexOn` en repo)
- Unificar los dos ítems de menú en uno solo

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo **lectura** aditiva y mapeo en cliente. Escrituras existentes (alta/edición/baja lógica) no cambian de forma destructiva. App móvil no se ve afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Mascota` | staff | sin cambio de contrato | fuente única; hidratar `nombre`/`Nombre`, `idCliente`/`cliente_id`; `id` de fila = key RTDB |
  | `Katzen/Cliente` | staff | sin cambio | hidratar `Nombre`/`nombre`/apellidos/`razonSocial`; listado completo |
  | `Katzen/Historiales_Clinicos` | staff | no | query `paciente_id` + `idPaciente` |
  | `Katzen/Vacunas` | staff | no | query `idPaciente` + `paciente_id` |
  | `Katzen/Recordatorios` | staff | no | query `paciente_id` + `idPaciente` |
  | `Katzen/Banios` | staff | no | query `paciente_id` + `idPaciente` |

- **Estrategia de Datos de Prueba:** Mocks en `src/app/core/testing/mock-data.ts` (`MOCK_CLIENTE_LEGACY_NOMBRE`, `MOCK_MASCOTA_OREON`). Unit tests de utils. **Prohibido** consultar RTDB de producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** `admin-page`, `app-admin-page-banner`, `app-admin-data-panel`, expediente existente en `pacientes.component`, diálogos `admin-dialog-shell` para alta/edición en Directorio. Navegación a `/admin/paciente?id=`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí (módulos paciente / pacientes-admin) |
| recepcionista | sí si el módulo está en su matriz |

---

## UI (rutas y layout)

- `/admin/paciente` — búsqueda + expediente (query `id`)
- `/admin/pacientes-admin` — directorio CRUD; Ver expediente → misma ruta con `?id=`
- `/admin/clientes` — listado completo + búsqueda normalizada

---

## Backend

- [ ] Cloud Function: no
- [x] Reglas RTDB: `.indexOn` aditivo `idPaciente` en Historiales y Recordatorios (deploy **solo** con autorización de Luis)
- [ ] Email / integración externa: no

---

## Testing

- [ ] Unit: hidratación de filas, búsqueda con acentos y `Nombre`
- [ ] `npm run build`
- [ ] Smoke local `:4200` (listados / navegación expediente)

---

## Riesgos

- Clínicas con muchos miles de nodos: cargar colección completa puede ser más lento que 100 keys; aceptable para el tamaño actual y ya lo hace Buscar paciente.
- Query `idPaciente` en Historiales sin índice desplegado: RTDB igual responde; puede avisar en consola hasta el deploy de rules.
