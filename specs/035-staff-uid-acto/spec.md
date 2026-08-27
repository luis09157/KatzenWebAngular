# Spec: Staff UID por acto clínico

**ID:** 035-staff-uid-acto  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (confirmación Luis Alfonso Niño Martínez — sí, seguir con Staff UID por acto)

---

## Problema

Los actos clínicos y operativos (citas, historiales, vacunas, baños) suelen guardar solo un **nombre libre** (`veterinario`, `medico_atendio`) o un id no unificado. Eso impide reportes fiables, trazabilidad al usuario Auth (`Katzen/Usuarios/{uid}`) y prefill del staff logueado. Los datos legacy con solo nombre no deben romperse.

---

## User stories

### US-1 — Enlace UID + nombre display

Como **staff**  
Quiero seleccionar al responsable del acto desde usuarios staff activos  
Para guardar **UID canónico + nombre denormalizado** (legacy / portal).

**Criterios de aceptación:**

- [x] SC-001: Componente compartido `app-staff-picker` (select/autocomplete) de staff activos
- [x] SC-002: Al guardar se escriben UID + nombre display según contrato por entidad
- [x] SC-003: Lectura legacy: si solo hay nombre, se muestra el nombre; no TypeError
- [x] SC-004: Prefill del usuario logueado al crear (cuando tenga sentido / rol compatible)

### US-2 — Migración módulos mínimos

Como **admin / doctor / peluquero**  
Quiero el picker en historiales, vacunas, baños y citas  
Para dejar de depender solo de texto libre.

**Criterios:**

- [x] SC-005: Historiales — `medico_atendio_uid` + `medico_atendio`
- [x] SC-006: Vacunas — `veterinario_id` + `veterinario`
- [x] SC-007: Baños — `peluquero_id` + `peluquero` (nombre denormalizado al guardar)
- [x] SC-008: Citas — `veterinario_id` + `veterinario`
- [x] SC-009: Visitas — `atendidoPorUid` + `atendidoPorNombre` opcionales

### US-3 — Listados y docs

- [x] SC-010: Chip / tag “Atendido por” en listados (citas, historiales, vacunas, baños)
- [x] SC-011: Mocks actualizados; `domain-context` + `ROADMAP`; sin Resend

---

## Fuera de alcance

- Resend / correo / FCM
- Migración masiva de registros legacy (solo lectura compatible)
- Cambiar lógica de solape de agenda (sigue por nombre denormalizado; UID opcional refuerza)
- Pensión / recordatorios (sin campo clínico de “quién atendió”; `created_by` ya existe)
- App móvil (campos aditivos opcionales)
- Catálogo `Katzen/Peluqueros` legacy (baños usan `Katzen/Usuarios`)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo campos **opcionales aditivos**. No se eliminan ni renombran nodos ni campos legacy de nombre. App móvil ignora campos desconocidos.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Citas` | staff / client filtrado | staff | `veterinario_id?: string` (UID); `veterinario` nombre (legacy + denorm) |
  | `Katzen/Historiales_Clinicos` | staff / client filtrado | staff | `medico_atendio_uid?: string`; `medico_atendio` nombre |
  | `Katzen/Vacunas` | staff / client filtrado | staff | `veterinario_id?: string`; `veterinario` nombre |
  | `Katzen/Banios` | staff / client filtrado | staff | `peluquero_id` (ya existía); `peluquero?: string` denorm al guardar |
  | `Katzen/Visitas` | staff / client filtrado | staff | `atendidoPorUid?`, `atendidoPorNombre?` opcionales |
  | `Katzen/Usuarios` | staff | — | fuente del picker (activos) |

- **Estrategia de Datos de Prueba:** mocks en `src/app/core/testing/mock-data.ts`. Prohibido RTDB producción en pruebas del agente.

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `mat-select` / Material admin, `SharedModule`, tags `.tag` / chips listado, `LoadingService`, `CurrentStaffService` + `UsuariosService`.

### Campos canónicos (documentados)

| Entidad | UID canónico | Nombre display (legacy) |
|---------|--------------|-------------------------|
| Cita | `veterinario_id` | `veterinario` |
| Historial | `medico_atendio_uid` | `medico_atendio` |
| Vacuna | `veterinario_id` | `veterinario` |
| Baño | `peluquero_id` | `peluquero` |
| Visita | `atendidoPorUid` | `atendidoPorNombre` |

Alias genérico en código util: `resolveStaffDisplay(uid, nombre)` — no se escribe un campo `staffUid` genérico en RTDB para no duplicar; el nombre de campo por entidad es el canónico.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (todos los módulos) |
| doctor | sí (citas, historiales, vacunas, visitas) |
| recepcionista | sí (citas; según matriz de módulos) |
| peluquero | sí (baños) |

---

## UI (rutas y layout)

- Sin ruta nueva; integra en diálogos existentes de `/admin/citas`, `/admin/historiales`, `/admin/vacunas`, `/admin/banios`, `/admin/visitas`
- Patrón: picker en `SharedModule` (`app-staff-picker`)
- Listados: conservar columna existente; chip/tag muestra nombre (UID no visible al usuario)

---

## Backend

- [ ] Cloud Function nueva — no
- [ ] Reglas RTDB — no (campos opcionales bajo nodos ya permitidos a staff)
- [ ] Email / Resend — no

---

## Testing mínimo

Ver `tasks.md` sección Testing + QA exhaustiva.

---

## Notas / decisiones

- Baños ya guardaban `peluquero_id`; esta entrega añade denormalización de `peluquero` y unifica UI vía picker.
- Prefill: si el usuario logueado está en la lista filtrada (doctor / staff), se selecciona por defecto en **alta**; en edición se respeta el valor guardado (UID o match por nombre legacy).
- Conflictos de agenda citas: siguen usando `veterinario` (nombre); al guardar siempre se denormaliza el nombre desde el UID elegido.
