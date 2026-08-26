# Checklist smoke post-deploy RTDB — Spec 008

**Fecha checklist:** 2026-08-25 / 2026-08-26  
**Fuente:** `database.rules.json` + `src/app/core/config/staff-role.config.ts`  
**Entorno:** localhost `:4200` (UI) + rules en prod tras `firebase deploy --only database`  
**Importante:** no hace falta writes destructivos en prod; preferir abrir módulo / diálogo y cancelar. DENIED se valida con usuario del rol (o emulador / rules-unit).

**Leyenda Resultado:** `PASS` | `FAIL` | `PENDIENTE` | `N/A`

**Última corrida automatizada:** 2026-08-26 — Cypress admin **23/23 PASS**; unit portal-mapper **8/8 PASS**; `:4200` vivo.

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

---

## Cómo ejecutar

1. Confirmar `http://localhost:4200` vivo.
2. Credenciales en `cypress.env.json` (solo admin en repo local) o usuarios de prueba por rol.
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

### A2. Doctor — requiere usuario doctor

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| A2.1 | Login doctor → módulos clínicos | OK | **PENDIENTE** | requiere usuario doctor |
| A2.2 | Citas R/W | PASS | **PENDIENTE** | |
| A2.3 | Historiales R/W | PASS | **PENDIENTE** | |
| A2.4 | Inventario: módulo **no** en menú UI | PASS (UI) | **PENDIENTE** | |
| A2.5 | Inventario write RTDB DENIED si se intenta directo | DENIED | **PENDIENTE** | |
| A2.6 | Baños R/W | PASS | **PENDIENTE** | |

- [ ] A2.1 Login doctor — **requiere usuario doctor**
- [ ] A2.2 Citas R/W
- [ ] A2.3 Historiales R/W
- [ ] A2.4 UI sin inventario
- [ ] A2.5 Inventario write DENIED (RTDB)
- [ ] A2.6 Baños R/W

---

## B. Recepcionista — requiere usuario recepcionista

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| B.1 | Login → citas / clientes / baños / recordatorios | OK | **PENDIENTE** | requiere usuario recepcionista |
| B.2 | Citas R/W | PASS | **PENDIENTE** | |
| B.3 | Historiales: lectura OK; write DENIED (RTDB) | R OK / W DENIED | **PENDIENTE** | UI puede ocultar módulo |
| B.4 | Inventario: sin módulo UI; write DENIED | DENIED | **PENDIENTE** | |
| B.5 | Baños R/W | PASS | **PENDIENTE** | |
| B.6 | Vacunas write DENIED | DENIED | **PENDIENTE** | |

- [ ] B.1 Login recepcionista — **requiere usuario recepcionista**
- [ ] B.2 Citas R/W
- [ ] B.3 Historiales: R OK, W DENIED
- [ ] B.4 Inventario W DENIED
- [ ] B.5 Baños R/W
- [ ] B.6 Vacunas W DENIED

---

## C. Peluquero — requiere usuario peluquero

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| C.1 | Login → solo inicio / paciente / baños (UI) | OK | **PENDIENTE** | requiere usuario peluquero |
| C.2 | Citas write DENIED | DENIED | **PENDIENTE** | |
| C.3 | Historiales write DENIED | DENIED | **PENDIENTE** | |
| C.4 | Inventario write DENIED | DENIED | **PENDIENTE** | |
| C.5 | Baños R/W | PASS | **PENDIENTE** | |

- [ ] C.1 Login peluquero — **requiere usuario peluquero**
- [ ] C.2 Citas W DENIED
- [ ] C.3 Historiales W DENIED
- [ ] C.4 Inventario W DENIED
- [ ] C.5 Baños R/W

---

## D. Portal cliente — requiere usuario portal

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| D.1 | Login `/portal` | OK | **PENDIENTE** | requiere usuario portal |
| D.2 | Lee solo sus mascotas / citas / historiales | PASS | **PENDIENTE** | `clienteId` en claims |
| D.3 | No escribe Citas / Historiales / Vacunas / Inventario | DENIED | **PENDIENTE** | |
| D.4 | No ve `notas_internas` en UI portal (mapper) | PASS | **PASS** (unit) | `portal-mapper.util.spec.ts` 8/8; E2E portal PENDIENTE |
| D.5 | Historial con `oculto_portal: true` no visible | PASS | **PASS** (unit) | mismas specs unit |

- [ ] D.1 Login portal — **requiere usuario portal**
- [ ] D.2 Lectura solo datos propios
- [ ] D.3 Write clínico DENIED
- [x] D.4 Dueño NO ve notas internas — **PASS unit** 2026-08-26 (E2E portal pendiente)
- [x] D.5 Oculto portal respeta flag — **PASS unit**

---

## E. Staff sin `staffRole` (legacy móvil) — requiere token/usuario legacy

Fallback en rules: `auth.token.staffRole == null` → write como staff genérico (comportamiento pre-008).

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| E.1 | Token staff sin claim `staffRole` | claims OK | **PENDIENTE** | requiere usuario legacy / emulador |
| E.2 | Write Historiales OK (fallback) | PASS | **PENDIENTE** | |
| E.3 | Write Inventario OK (fallback) | PASS | **PENDIENTE** | |
| E.4 | Write Citas / Baños OK | PASS | **PENDIENTE** | |

- [ ] E.1 Identificar usuario sin staffRole — **requiere usuario legacy**
- [ ] E.2 Historiales W OK
- [ ] E.3 Inventario W OK
- [ ] E.4 Citas / Baños W OK

---

## F. Validación automatizada (sin roles extra)

| # | Acción | Esperado | Resultado | Notas |
|---|--------|----------|-----------|-------|
| F.1 | `database.rules.json` parse JSON | OK | **PASS** | ya validado en tasks |
| F.2 | Cypress admin: módulos citas/historiales/inventario/baños | PASS | **PASS** | 23/23 2026-08-26 |
| F.3 | Unit portal: `notas_internas` no en mapper | PASS | **PASS** | 8/8 |
| F.4 | Rules-unit / emulador por rol | — | **PENDIENTE** | no existe en repo |

- [x] F.1 Parse rules — **PASS**
- [x] F.2 Cypress admin smoke módulos 008 — **PASS** 23/23
- [x] F.3 Unit mapper notas internas — **PASS** 8/8
- [ ] F.4 Emulador multi-rol — no existe en repo
