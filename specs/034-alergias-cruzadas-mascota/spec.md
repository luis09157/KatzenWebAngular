# Spec: Alergias cruzadas de la mascota

**ID:** 034-alergias-cruzadas-mascota  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (confirmación Luis Alfonso Niño Martínez — sí, seguir con alergias cruzadas)  

---

## Problema

Hoy las **alergias** solo se capturan de forma local en baños (`alergias_conocidas` en `Katzen/Banios`), sin fuente de verdad en el expediente de la mascota. El staff que registra historial, vacuna, visita o salida de inventario **no ve** un aviso cruzado. Riesgo clínico: productos de peluquería, fármacos o tratamientos aplicados sin recordar alergias conocidas.

---

## User stories

### US-1 — Captura canónica en expediente

Como **staff**  
Quiero editar las alergias de la mascota en el diálogo de paciente / expediente  
Para tener una sola fuente de verdad en `Katzen/Mascota`.

**Criterios de aceptación:**

- [x] SC-001: Campo aditivo `alergias: string[]` en `Katzen/Mascota` (opcional)
- [x] SC-002: UI chips + agregar/quitar en `paciente-admin-dialog` (crear / editar / ver)
- [x] SC-003: Lectura normaliza legacy (`alergiasTexto`, texto suelto, `alergias_conocidas` si se hereda) sin borrar campos antiguos
- [x] SC-004: Guardar no bloquea si la lista está vacía (alergias opcionales)

### US-2 — Alerta cruzada al operar

Como **staff**  
Quiero ver un **aviso fuerte** (no hard-block) si la mascota tiene alergias al abrir historial, baño, vacuna, visita (y salida inventario si hay `pacienteId`)  
Para no pasar por alto el riesgo clínico.

**Criterios:**

- [x] SC-005: Componente compartido `app-alergias-alerta` visible solo si hay ≥1 alergia
- [x] SC-006: Integrado en diálogos: historial, baño, vacuna, visita
- [x] SC-007: Opcional: salida inventario cuando `data.pacienteId` está presente
- [x] SC-008: Guardar **no** se bloquea solo por alergias (aviso, no hard-block)

### US-3 — Baños sincronizados con Mascota

Como **staff de peluquería**  
Quiero que las alergias del baño reflejen (y actualicen) las de la mascota  
Para no guardar alergias solo locales sin sync.

**Criterios:**

- [x] SC-009: Al seleccionar paciente, se cargan alergias desde Mascota y se muestran en alerta (+ editor)
- [x] SC-010: Al guardar baño, si se editaron alergias → `actualizarPaciente` con `alergias`; `alergias_conocidas` del baño queda como snapshot alineado
- [x] SC-011: Sin migración destructiva de baños legacy

### US-4 — Portal dueño (lectura)

Como **dueño portal**  
Quiero ver las alergias de mi mascota en el detalle  
Para conocer el expediente sin editar datos clínicos (staff write).

**Criterios:**

- [x] SC-012: Card / sección alergias en `/portal/mascotas/:id` (solo lectura)
- [x] SC-013: Mapper portal incluye `alergias` normalizadas
- [x] SC-014: Sin cambio de rules si portal solo lee (preferido); si en el futuro edita → rules aditivas

### US-5 — Mocks y docs

- [x] SC-015: Mocks en `mock-data.ts` con alergias de ejemplo
- [x] SC-016: `domain-context` + `ROADMAP` actualizados; 031 backlog “alergias cruzadas” → hecho vía 034

---

## Fuera de alcance

- Resend / correo / FCM
- Hard-block al guardar por alergias
- Edición de alergias desde portal (MVP = solo lectura)
- Catálogo RTDB de tipos de alergia (sugerencias UI locales OK)
- App móvil (solo campo aditivo compatible)
- Migración masiva de `Banios.alergias_conocidas` → Mascota

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos **opcionales aditivos** en `Katzen/Mascota`. No se eliminan ni renombran nodos. App móvil ignora campos desconocidos.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Mascota` | staff / client (propias) | staff | `alergias?: string[]`; opcional `alergiasTexto?: string` legacy/compat |
  | `Katzen/Banios` | staff / client filtrado | staff | `alergias_conocidas` se mantiene como snapshot; sync hacia Mascota al guardar |

- **Estrategia de Datos de Prueba:** mocks en `src/app/core/testing/mock-data.ts`. Prohibido RTDB producción en pruebas del agente.

- **Patrones UI Reutilizados:** `admin-dialog-shell`, chips/tags tipo `detail-tag--warn`, `SharedModule`, portal card en detalle mascota, `LoadingService`, SweetAlert solo para errores (no bloqueo por alergias).

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (write) |
| doctor | sí |
| recepcionista | sí |
| peluquero | sí |
| portal client | lectura propias mascotas |

---

## UI (rutas y layout)

- Captura: `/admin/pacientes` → diálogo paciente (sección Alergias)
- Alertas: diálogos historial, baño, vacuna, visita; salida inventario si hay paciente
- Portal: `/portal/mascotas/:id` card alergias

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no (MVP staff write + portal read ya cubierto)
- [ ] Email / Resend: no

---

## Testing mínimo

Ver `tasks.md` sección Testing + QA exhaustiva.

---

## Notas / decisiones

- Confirmado Luis (2026-08-26): seguir con alergias cruzadas.
- Aviso fuerte, **sin** hard-block.
- Fuente de verdad: **Mascota.alergias**.
- Portal: solo lectura en esta entrega.
