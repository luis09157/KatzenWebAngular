# Plan técnico: Fase 4 — Hoy, roles y onboarding

**Spec:** `specs/072-fase4-hoy-roles-onboarding/spec.md`  
**Estado:** approved  
**Nivel:** L3 (solo por `Katzen/Config/clinica` + rules aditivas)

---

## Resumen

Un menú de 6 grupos y un Hoy operativo para vet/recepción; el dashboard de dueño queda detrás de rol admin. El guard deja de ser `*` para recepción/peluquero/doctor. La clínica se guarda en `Katzen/Config/clinica` (aditivo). Ayuda y «No volver a mostrar» son solo UI + `localStorage`.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/config/staff-role.config.ts` | modificar | ACCESS por rol + compacto doctor + `configuracion` |
| `src/app/auth/staff-role.guard.ts` | modificar | mensaje humano + redirect |
| `src/app/layouts/admin-main-layout.*` | modificar | 6 grupos + Ayuda |
| `src/app/dashboard/dashboard.component.*` | modificar | Hoy por rol |
| `src/app/clientes/cliente-dialog.*` | modificar | indicador de avisos |
| `src/app/configuracion/` | crear | página admin |
| `src/app/ayuda/` | crear | diálogo 4 flujos |
| `src/app/shared/components/flow-hint/` | modificar | dismiss localStorage |
| `src/app/core/services/clinic-config.service.ts` | modificar | `clinica` |
| `src/app/app-routing.module.ts` | modificar | `/admin/configuracion` |
| `src/app/visitas/visita-dialog.component.ts` | modificar | nombre de clínica en ticket |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | hijo `Config/clinica` write admin |

### Docs

| Archivo | Acción |
|---------|--------|
| `docs/MANUAL-USUARIO.md` | crear |
| `specs/PLAN-UX-VETERINARIAS.md` | marcar Fase 4 |
| `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md` | cerrar #3 y #4 |

---

## Modelo de datos

```text
Katzen/Config                    # ya existe (inversionMeta, Vacunacion)
  clinica?                       # NUEVO, opcional
    nombre?: string
    logoUrl?: string
    horario?: string             # texto libre (ej. Lun–Vie 9–19)
    ivaDefaultPct?: number       # 0–100
    vetDefaultUid?: string
    vetDefaultNombre?: string
    updatedAt?: string
    updatedBy?: string
```

Sin eliminar ni renombrar nodos. La app móvil no consume `clinica`.

---

## Flujos

### Config

1. Admin abre `/admin/configuracion`.
2. Lee `Katzen/Config/clinica` (vacío = defaults en UI: nombre KatzenVet, IVA 0).
3. Guarda con `LoadingService`; `hide` en success y error.

### Guard

1. `canAccessModule` false → Swal/texto humano → `/admin/inicio`.

### Errores esperados

| Caso | Mensaje usuario |
|------|-----------------|
| Recepción abre `/admin/finanzas` | «Caja y finanzas las ve administración. Te llevamos a Hoy.» |
| Recepción abre `/admin/usuarios` | «El personal lo administra la dueña o un administrador.» |
| Peluquero abre inventario | «El inventario lo ve administración.» |
| Sin permiso al guardar config | `ErrorMessagesService` contexto «guardar configuración» |

---

## Servicios

- `ClinicConfigService` — `getClinica$()` / `saveClinica()` en `Katzen/Config/clinica`
- Utils puros: canal de recordatorios, dismiss de hints, defaults de clínica

---

## UI (admin)

- Contenedor: `.configuracion-contenedor`
- `app-admin-page-banner` + formulario en `admin-data-panel`
- Diálogo ayuda: `admin-dialog-shell` + `ADMIN_DIALOG_DETAIL`
- Menú: grupos Agenda / Más con hijos (no 3 ítems sueltos al nivel de Cobrar)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Config/clinica` | nuevo hijo opcional | no | el padre `Config` ya existe |
  | `inversionMeta` / `Vacunacion` | no tocar | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (`nombre` → KatzenVet)

- **Estrategia de Datos de Prueba:** emulador Auth + RTDB. Seed `recepcion@katzen.test` para smoke de Hoy sin KPIs. Prohibido prod.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Página | `admin-page`, banner, data-panel |
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
  | Errores | `ErrorMessagesService` |
  | Loading | `LoadingService` + `hide` en `finally` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos.
- [ ] Compilación local (`npm run build`) — se registra en `tasks.md`.
- [x] Rollback documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Rules `clinica` mal escritas (bloquean `Config`) | Revertir el bloque `clinica` en `database.rules.json`. El `.read` de `Config` no cambia. **No deploy** en esta entrega; si Luis ya desplegó rules, redeploy del JSON anterior (autorización explícita). |
| UI rompe menú / guard | Revertir `staff-role.config.ts` + layout + guard. ACCESS `*` restaura 011. |
| `clinica` con basura | Borrar solo el hijo `Katzen/Config/clinica` (no tocar `inversionMeta`). Ticket vuelve a «KatzenVet». |
| Hints desaparecen | Borrar keys `kz-flow-hint:*` en localStorage del navegador. |

**Prod:** este commit **no** despliega database ni hosting. Hasta el deploy de rules, `saveClinica` fallará en prod con permiso denegado (el cliente muestra mensaje humano). Emulador sí escribe.

---

## Deploy (solo si Luis autoriza)

```bash
# NO ejecutar en esta entrega
firebase deploy --only database   # rules con Config/clinica
# hosting aparte, si pide UI
```

---

## Riesgos

- Cypress `admin-roles-008-smoke` aún asume política 011 (menú completo). Queda desactualizado; no se corre en el cierre L2 de esta spec.
- Rol staff desconocido: se trata como **doctor** (clínico + POS), no como admin.
