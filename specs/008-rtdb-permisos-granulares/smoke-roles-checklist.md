# Checklist smoke post-deploy RTDB — Spec 008

**Fecha checklist:** 2026-08-25 / 2026-08-26  
**Fuente:** `database.rules.json` + `src/app/core/config/staff-role.config.ts`  
**Entorno:** localhost `:4200` (UI) + rules en prod tras `firebase deploy --only database`  
**Importante:** no hace falta writes destructivos en prod; preferir abrir módulo / diálogo y cancelar. DENIED se valida con usuario del rol (o emulador / rules-unit).

**Leyenda Resultado:** `PASS` | `FAIL` | `PENDIENTE` | `N/A`

**Última corrida automatizada:** 2026-08-26 — Cypress admin **23/23 PASS**; roles 008 **16/16 PASS**; RTDB probe multi-rol **PASS**; unit portal-mapper **8/8 PASS**; `:4200` vivo.

**Herramientas smoke multi-rol**

```bash
# 1) Provisionar staff efímero (doctor/recepcionista/peluquero) con admin de cypress.env.json
node scripts/smoke-008-provision-roles.mjs provision

# 2) Probe writes RTDB (ALLOW/DENIED) — limpia probes si ALLOW
node scripts/smoke-008-provision-roles.mjs rtdb-probe

# 3) Cypress UI por rol
npx cypress run --spec cypress/e2e/admin-roles-008-smoke.cy.ts --browser chrome

# 4) Desactivar usuarios efímeros
node scripts/smoke-008-provision-roles.mjs deactivate
```

Credenciales rol → `cypress.env.json` / `cypress.env.smoke-roles.json` (**gitignored**, no passwords en repo).

**Matriz RTDB (write) — resumen**

| Nodo | admin | doctor | recepcionista | peluquero | sin staffRole (legacy) | portal client |
|------|-------|--------|---------------|-----------|------------------------|---------------|
| Citas | R/W | R/W | R/W | R solo* | R/W | R propias; W no |
| Historiales_Clinicos | R/W | R/W | R; W no | R; W no | R/W | R propias (sin oculto_portal); W no |
| Inventario | R/W | R; W no | R; W no | R; W no | R/W | sin acceso staff |
| Banios / Peluqueros | R/W | R/W | R/W | R/W | R/W | sin acceso |
| Vacunas / Medicamentos / Diagnósticos / Tratamientos | R/W | R/W | R; W no | R; W no | R/W | R propias vacunas; W no |
| Cliente / Mascota / Recordatorios | R/W | R/W | R/W | R; W no | R/W | R propias; W clínico no |
| Producto / Productos / Venta / Gasolina / Campaña (legacy móvil) | R/W staff | idem | idem | idem | idem | no |

\* UI peluquero **no** incluye módulo citas (`staff-role.config`); RTDB igual deniega write citas a peluquero.

**Notas internas (`notas_internas`):** write vía historial (solo admin/doctor + fallback). El portal **no** las expone en mapper (`mapHistorial`); RTDB no oculta el campo hijo — la garantía es app + write clínico.

**Evidencia RTDB probe 2026-08-26** (`smoke-roles-rtdb-probe.json`): doctor Inventario DENIED / resto clínico ALLOW; recepcionista Historiales+Vacunas+Inventario DENIED / Citas+Baños ALLOW; peluquero solo Baños ALLOW.

---

## Cómo ejecutar

1. Confirmar `http://localhost:4200` vivo.
2. Credenciales en `cypress.env.json` (admin + roles via script) — **nunca** commitear passwords.
3. Marcar cada ítem `- [x]` y rellenar **Resultado**.
4. Registrar resumen en `tasks.md` § Testing.

---

## A. Administrador / Doctor

> Doctor: mismos writes clínicos que admin **excepto Inventario** (solo admin escribe Inventario).  
> UI doctor: sin inventario ni usuarios ni contactos-web.

### A1. Administrador (credencial Cypress `adminEmail`)

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| A1.1 | Login admin → `/admin` | OK | **PASS** | Cypress `cy.loginAdmin` 2026-08-26 |
| A1.2 | Lectura Citas (`/admin/citas` carga) | PASS | **PASS** | `admin-modules-authenticated` |
| A1.3 | Escritura Citas (abrir «Nueva cita», cancelar) | PASS | **PASS** | diálogo abre/cierra |
| A1.4 | Lectura Historiales | PASS | **PASS** | módulos autenticados |
| A1.5 | Escritura Historiales (Nuevo / picker alcanzable) | PASS | **PASS** | `admin-features-008-010-smoke` |
| A1.6 | Campo `notas_internas` visible en diálogo historial | PASS | **PASS** | expediente → Nuevo historial |
| A1.7 | Lectura Inventario productos/movimientos | PASS | **PASS** | productos + movimientos |
| A1.8 | Escritura Inventario (UI alcanzable / sin DENIED) | PASS | **PASS** | lectura/UI OK; no se persistió write |
| A1.9 | Lectura/escritura Baños | PASS | **PASS** | `banios-flujos` diálogo Nuevo baño |
| A1.10 | Lectura Vacunas + Recordatorios | PASS | **PASS** | + diálogo nuevo recordatorio |

Checklist rápido:

- [x] A1.1 Login administrador — **PASS** 2026-08-26
- [x] A1.2 Lectura Citas — **PASS**
- [x] A1.3 Escritura Citas (diálogo) — **PASS**
- [x] A1.4 Lectura Historiales — **PASS**
- [x] A1.5 Escritura Historiales (flujo Nuevo) — **PASS**
- [x] A1.6 Notas internas visibles (staff) — **PASS**
- [x] A1.7 Lectura Inventario — **PASS**
- [x] A1.8 Escritura Inventario (admin) — **PASS** (UI alcanzable)
- [x] A1.9 Baños R/W — **PASS** (diálogo)
- [x] A1.10 Vacunas / Recordatorios — **PASS**

### A2. Doctor — usuario efímero `provisionStaffUser` + Cypress / RTDB probe

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| A2.1 | Login doctor → módulos clínicos | OK | **PASS** | Cypress `admin-roles-008-smoke` 16/16 |
| A2.2 | Citas R/W | PASS | **PASS** | UI diálogo + RTDB ALLOW |
| A2.3 | Historiales R/W | PASS | **PASS** | UI + RTDB ALLOW |
| A2.4 | Inventario: módulo **no** en menú UI | PASS (UI) | **PASS** | menú + guard → inicio |
| A2.5 | Inventario write RTDB DENIED si se intenta directo | DENIED | **PASS** | rtdb-probe |
| A2.6 | Baños R/W | PASS | **PASS** | UI diálogo + RTDB ALLOW |

- [x] A2.1 Login doctor — **PASS**
- [x] A2.2 Citas R/W — **PASS**
- [x] A2.3 Historiales R/W — **PASS**
- [x] A2.4 UI sin inventario — **PASS**
- [x] A2.5 Inventario write DENIED (RTDB) — **PASS**
- [x] A2.6 Baños R/W — **PASS**

---

## B. Recepcionista — usuario efímero + Cypress / RTDB probe

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| B.1 | Login → citas / clientes / baños / recordatorios | OK | **PASS** | menú OK; sin historiales/inventario/vacunas |
| B.2 | Citas R/W | PASS | **PASS** | UI + RTDB ALLOW |
| B.3 | Historiales: lectura OK; write DENIED (RTDB) | R OK / W DENIED | **PASS** | UI módulo denegado; RTDB W DENIED |
| B.4 | Inventario: sin módulo UI; write DENIED | DENIED | **PASS** | UI + RTDB |
| B.5 | Baños R/W | PASS | **PASS** | UI + RTDB ALLOW |
| B.6 | Vacunas write DENIED | DENIED | **PASS** | UI denegado + RTDB DENIED |

- [x] B.1 Login recepcionista — **PASS**
- [x] B.2 Citas R/W — **PASS**
- [x] B.3 Historiales: R OK, W DENIED — **PASS** (UI deny + RTDB W DENIED)
- [x] B.4 Inventario W DENIED — **PASS**
- [x] B.5 Baños R/W — **PASS**
- [x] B.6 Vacunas W DENIED — **PASS**

---

## C. Peluquero — usuario efímero + Cypress / RTDB probe

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| C.1 | Login → solo inicio / paciente / baños (UI) | OK | **PASS** | menú estricto |
| C.2 | Citas write DENIED | DENIED | **PASS** | UI deny + RTDB DENIED |
| C.3 | Historiales write DENIED | DENIED | **PASS** | UI deny + RTDB DENIED |
| C.4 | Inventario write DENIED | DENIED | **PASS** | UI deny + RTDB DENIED |
| C.5 | Baños R/W | PASS | **PASS** | UI + RTDB ALLOW |

- [x] C.1 Login peluquero — **PASS**
- [x] C.2 Citas W DENIED — **PASS**
- [x] C.3 Historiales W DENIED — **PASS**
- [x] C.4 Inventario W DENIED — **PASS**
- [x] C.5 Baños R/W — **PASS**

---

## D. Portal cliente — **bloqueado** (falta credencial / cliente de prueba)

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| D.1 | Login `/portal` | OK | **PENDIENTE** | ver bloqueo abajo |
| D.2 | Lee solo sus mascotas / citas / historiales | PASS | **PENDIENTE** | |
| D.3 | No escribe Citas / Historiales / Vacunas / Inventario | DENIED | **PENDIENTE** | |
| D.4 | No ve `notas_internas` en UI portal (mapper) | PASS | **PASS** (unit) | `portal-mapper.util.spec.ts` 8/8; E2E portal PENDIENTE |
| D.5 | Historial con `oculto_portal: true` no visible | PASS | **PASS** (unit) | mismas specs unit |

- [ ] D.1 Login portal — **PENDIENTE**
- [ ] D.2 Lectura solo datos propios
- [ ] D.3 Write clínico DENIED
- [x] D.4 Dueño NO ve notas internas — **PASS unit** 2026-08-26 (E2E portal pendiente)
- [x] D.5 Oculto portal respeta flag — **PASS unit**

### Bloqueo portal (qué falta de Luis)

`provisionPortalClient` exige un `clienteId` real con correo válido y envía email Resend (tocaría prod). No hay `portalEmail`/`portalPassword` en `cypress.env.json`.

Para cerrar D.1–D.3 hace falta **una** de:

1. Credencial portal de prueba ya existente: `portalEmail` + `portalPassword` en `cypress.env.json` (local), **o**
2. Autorización explícita: `clienteId` desechable + permiso para llamar `provisionPortalClient` (correo Resend) y luego `deactivatePortalClient`.

---

## E. Staff sin `staffRole` (legacy móvil) — **bloqueado** (no creable vía UI/callable)

Fallback en rules: `auth.token.staffRole == null` → write como staff genérico (comportamiento pre-008).

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| E.1 | Token staff sin claim `staffRole` | claims OK | **PENDIENTE** | ver nota |
| E.2 | Write Historiales OK (fallback) | PASS | **PENDIENTE** | |
| E.3 | Write Inventario OK (fallback) | PASS | **PENDIENTE** | |
| E.4 | Write Citas / Baños OK | PASS | **PENDIENTE** | |

- [ ] E.1 Identificar usuario sin staffRole — **PENDIENTE**
- [ ] E.2 Historiales W OK
- [ ] E.3 Inventario W OK
- [ ] E.4 Citas / Baños W OK

### Nota técnica legacy

`provisionStaffUser` / `syncClaimsForUid` **siempre** asignan `staffRole` (si falta en AuthPerfiles → default `'doctor'`). No hay emulador RTDB / rules-unit en el repo (`F.4`).

Para probar E.* hace falta **una** de:

1. Usuario Auth legacy real cuyo token aún tenga `staffRole == null` (sin re-sync), **o**
2. Admin SDK (`setCustomUserClaims` sin `staffRole`) + evitar trigger `onAuthPerfilWrite`, **o**
3. Rules unit tests / emulador (no existe hoy).

---

## F. Validación automatizada (sin roles extra)

| # | Acción | Esperado | Resultado | Notas |
|---|--------|----------|-----------|-------|
| F.1 | `database.rules.json` parse JSON | OK | **PASS** | ya validado en tasks |
| F.2 | Cypress admin: módulos citas/historiales/inventario/baños | PASS | **PASS** | 23/23 2026-08-26 |
| F.3 | Unit portal: `notas_internas` no en mapper | PASS | **PASS** | 8/8 |
| F.4 | Rules-unit / emulador por rol | — | **PENDIENTE** | no existe en repo |
| F.5 | Cypress multi-rol 008 | PASS | **PASS** | 16/16 `admin-roles-008-smoke` |
| F.6 | RTDB probe multi-rol | PASS | **PASS** | `smoke-roles-rtdb-probe.json` |

- [x] F.1 Parse rules — **PASS**
- [x] F.2 Cypress admin smoke módulos 008 — **PASS** 23/23
- [x] F.3 Unit mapper notas internas — **PASS** 8/8
- [ ] F.4 Emulador multi-rol — no existe en repo
- [x] F.5 Cypress roles doctor/recepcionista/peluquero — **PASS** 16/16
- [x] F.6 RTDB probe writes por rol — **PASS**
