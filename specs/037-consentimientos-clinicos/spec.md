# Spec: Consentimientos clínicos

**ID:** 037-consentimientos-clinicos  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  

---

## Problema

La clínica necesita registrar **consentimientos informados** (cirugía, anestesia, egreso, hospitalización, etc.) ligados a paciente/cliente, con evidencia de quién firmó, quién registró (staff UID) y cuándo. Hoy no hay módulo dedicado en el admin web.

---

## User stories

### US-1 — Registrar consentimiento

Como **staff**  
Quiero **crear un consentimiento ligado a cliente y paciente**  
Para **dejar evidencia clínica/legal básica en el expediente**

**Criterios de aceptación:**

- [x] SC-001: Alta con picker cliente→paciente (029), tipo, fecha, firmante, notas
- [x] SC-002: Staff UID/nombre vía `app-staff-picker` (035), prefill usuario logueado
- [x] SC-003: Lista admin con KPIs, buscar, chips de estado, borrar (baja lógica)

### US-2 — Consultar en portal

Como **dueño portal**  
Quiero **ver los consentimientos de mi mascota**  
Para **saber qué autorizaciones están registradas**

**Criterios de aceptación:**

- [x] SC-004: Portal read-only `/portal/mascotas/:id/consentimientos`
- [x] SC-005: Rules RTDB: staff escribe; cliente solo lee los suyos

---

## Fuera de alcance

- Firma digital avanzada / eID / captcha biométrica
- Resend / envío por correo (al final del backlog)
- CFDI / PDF legal certificado
- Catálogo RTDB editable de tipos (MVP: catálogo fijo en código)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** nodo nuevo aditivo `Katzen/Consentimientos/{id}`. App móvil no depende hoy.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Consentimientos` | staff / client (propios) | staff | campos opcionales; `activo` baja lógica |

- **Estrategia de Datos de Prueba:** mocks en `mock-data.ts` (`MOCK_CONSENTIMIENTO*`). Prohibido RTDB prod en desarrollo del agente.
- **Patrones UI:** `admin-page` + KPI grid + banner + data-panel + `admin-dialog-shell` + picker 029 + staff-picker 035. Portal: card + `PortalListSection`.

### Campos RTDB

| Campo | Tipo | Notas |
|-------|------|-------|
| `cliente_id` / `cliente` | string | requerido |
| `paciente_id` / `paciente` | string | requerido |
| `tipo` | enum | ver catálogo |
| `fecha` | ISO date | fecha del consentimiento |
| `firmado_por` | string | nombre de quien firma (dueño/tutor) |
| `parentesco` | string? | opcional |
| `staff_uid` / `staff_nombre` | string? | quién registró |
| `notas` | string? | |
| `estado` | `vigente` \| `revocado` | |
| `activo` | boolean | baja lógica |
| `created_at` / `updated_at` / `created_by` | | |

### Tipos MVP

`cirugia`, `anestesia`, `egreso`, `hospitalizacion`, `eutanasia`, `tratamiento`, `otro`

---

## Plan de Mitigación y Rollback

- **Mitigación:** solo nodo nuevo; no toca Mascota/Cliente/Historial.
- **Rollback:** ocultar ruta/menú; datos RTDB quedan (aditivos). Revert commit + redeploy hosting/rules si hace falta.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| todos (`*`) | sí |

---

## UI

- Admin: `/admin/consentimientos`
- Portal: `/portal/mascotas/:id/consentimientos`

---

## Backend

- [x] Reglas RTDB aditivas
- [ ] Cloud Function: no
- [ ] Email: no (Resend diferido)
