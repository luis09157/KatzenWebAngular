# Tasks: Fase 4 — Hoy, roles y onboarding

**Spec:** `specs/072-fase4-hoy-roles-onboarding/spec.md`  
**Plan:** `specs/072-fase4-hoy-roles-onboarding/plan.md`  
**Nivel de cambio:** L3

---

## Implementación

### Setup

- [x] Carpeta spec creada y alcance confirmado
- [x] Plan con Contratos de Datos / Rollback

### Backend

- [x] Reglas RTDB — aditivas (`Config/clinica` write admin)
- [x] Cloud Function — N/A
- [x] Deploy documentado (Luis autoriza; **no** ejecutado)

### Frontend

- [x] `staff-role.config` ACCESS + compacto doctor + módulo `configuracion`
- [x] `StaffRoleGuard` mensaje humano
- [x] Menú 6 grupos + Ayuda
- [x] Dashboard Hoy por rol
- [x] Indicador recordatorios en ficha cliente
- [x] Módulo `/admin/configuracion` + `ClinicConfigService`
- [x] Ticket/WhatsApp leen nombre de clínica
- [x] `app-flow-hint` dismiss localStorage
- [x] `docs/MANUAL-USUARIO.md` + diálogo Ayuda

---

## Validación

> L3: guía `specs/templates/qa-validation-guide.md`. Sin deploy. Emulador RTDB; Auth de `ng serve` sigue en Firebase real (no se usó prod ni el seed de Auth).

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | exit 0 · Hash `4fb464ffa50778af` · warning budget 2.50 MB preexistente |
| Unit tests del util/servicio | OK | subset 072: **21/21** · `npm run test:ci` **402 SUCCESS** exit 0 |
| `npm run lint` | OK | **0 errors** (`ng lint --quiet`) |
| Smoke local 375 / 1280 | parcial | login 375/1280 en `/tmp/kz-072/` · menú/Hoy/config/Ayuda requieren sesión staff; Auth no apunta al emulador (seed `recepcion@katzen.test` no se usó contra prod) |
| RTDB aditiva / compatible app móvil | OK | `Katzen/Config/clinica` hijo nuevo; no se tocan `inversionMeta`/`Vacunacion` |
| Chips + loading no trabado | OK | config usa `LoadingService` + `hide` en `finally` |

```
npm run build → exit 0 · Hash 4fb464ffa50778af
npm run test:ci → 402 SUCCESS
ng lint --quiet → All files pass linting
subset 072 → 21 SUCCESS
```

### Resultados QA — 2026-09-04

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — config vacía | OK | nombre required; defaults KatzenVet / IVA 0 |
| Formularios — IVA fuera de rango | OK | util `clampIvaPct` 0–100 |
| Guard recepción → finanzas | OK | tests ACCESS + mensaje humano |
| Guard peluquero → inventario | OK | tests |
| Owner-dash solo admin | OK | `staffRoleSeesOwnerDashboard` |
| Hint dismiss | OK | util localStorage |
| Canal recordatorios | OK | util sin jerga |
| UI — layout desktop | parcial | login 1280 OK; panel autenticado pendiente de Luis |
| Deploy database | N/A | no ejecutado |

---

## Criterios spec (SC-xxx)

- [x] SC-001: menú 6 grupos
- [x] SC-002: compacto doctor
- [x] SC-003: owner-dash solo admin
- [x] SC-004: bloques Hoy operativos
- [x] SC-005: ACCESS por rol
- [x] SC-006: guard + mensaje
- [x] SC-007: indicador ficha cliente
- [x] SC-008: config clínica RTDB
- [x] SC-009: manual + Ayuda
- [x] SC-010: hint dismiss localStorage

---

## Cierre

- [x] Validación del nivel registrada arriba (smoke autenticado pendiente de Luis)
- [x] Fase 4 marcada en PLAN-UX; #3 y #4 cerrados en 054
- [x] `node scripts/specs-index.mjs`
- [ ] Commit / deploy — solo si Luis lo pidió

---

## Follow-up UX menú (L1/L2) — 2026-10-04

Claridad Cobrar vs catálogo vs finanzas (**sin** cambiar rutas ni `STAFF_MODULE_ACCESS`):

| Label menú | Ruta | Notas |
|------------|------|-------|
| Cobrar | `/admin/visitas` | tooltip POS; toolbar alineada |
| Catálogo de servicios | `/admin/servicios-clinica` | antes «Servicios de clínica»; junto a Inventario |
| Finanzas y corte | `/admin/finanzas` | antes «Caja / finanzas»; bloque Administración (con Personal/Config) |

- Reorden Más: catálogo tras inventario; finanzas lejos de Cobrar (subgrupo Administración).
- Archivos: `admin-main-layout`, `admin-route-labels`, `STAFF_NAV_MAS`, banner 056/093, Cypress titles.
- Relaciona copy catálogo: spec **093**.

---

## Follow-up 2026-10-04 — `saveClinica` sin `undefined` en RTDB

- **Causa:** `payloadClinicaParaGuardar` ponía `logoUrl`/`horario`/vet vacíos como `undefined` → Firebase `set failed` al guardar solo vet preferida con logo vacío.
- **Fix:** `omitUndefinedRtdb` en `clinica-config.util.ts` (opcionales vacíos se omiten del objeto). Tests en `clinica-config.util.spec.ts`.
- **Loading (005):** hide antes de Swal en `configuracion.component` **sigue** (Luis ya ve el Swal de error).
- [x] Unit `clinica-config.util.spec.ts` — **4/4** SUCCESS
- [x] `npm run build` — exit 0 · Hash `c9a5727abd49242a` (2026-10-04)

---

## Follow-up 2026-10-18 — Calendario de citas bajo cards (L2)

Luis: debajo de Clínica / POS / Inventario, ver agenda del mes (antes solo «Citas de hoy» vacío; el calendario vivía al final de la página).

- **Qué muestra:** mes con puntos/conteo de citas activas; día seleccionado (default hoy) → lista hora · mascota · dueño; clic cita → `CitaDialog` modo ver; Atender → expediente; CTA «Llegó un paciente» y atajos intactos. Baños/pensión del día: no en calendario (prioridad citas; siguen paneles aparte).
- **Código:** `dashboard-calendario.util.ts` (+ spec); `dashboard.component.*` (panel `#calendario-citas` tras tiles); `CitaDialogModule` en dashboard.
- [x] Unit `dashboard-calendario.util.spec.ts` — **4/4** SUCCESS
- [x] `npm run build` — exit 0 · Hash `4e5305744db4abe2` (2026-10-18)
- [ ] Smoke 375 / 1280 en `/admin/inicio` — pendiente Luis (sesión local)

---

## Follow-up 2026-10-25 — Agenda del mes: citas, peluquería y pensión (L2)

Luis: en el calendario de Hoy, cada día también muestra baños de esa `fecha_banio` y estancias cuyo rango ingreso–salida cubre el día. El contador del punto suma los tres. Clic cita → `verDetalleCita` (Atender intacto). Peluquería → `/admin/banios` (`BanioDetalle` no está en el módulo Hoy). Pensión → `/admin/pension`. No se tocaron listados ni rieles de cobro.

- **Código:** `dashboard-calendario.util.ts` (`buildBaniosMapByDate`, `estanciaCubreDia`, `eventosAgendaDelDia`); `dashboard.component` panel `#calendario-citas`.
- [ ] Unit `dashboard-calendario.util.spec.ts` — pendiente de corrida
- [ ] `npm run build` — pendiente
- [ ] QA Hoy en localhost: día con baño y estancia, cita abre detalle — pendiente
