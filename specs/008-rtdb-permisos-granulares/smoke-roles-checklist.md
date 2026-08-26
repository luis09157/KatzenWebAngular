# Checklist smoke post-deploy RTDB — Spec 008 + política 011

**Fecha checklist:** 2026-08-26  
**Fuente:** `database.rules.json` + `src/app/core/config/staff-role.config.ts`  
**Entorno:** localhost `:4200` (UI) + rules en prod tras `firebase deploy --only database`  
**Importante:** no hace falta writes destructivos en prod; preferir abrir módulo / diálogo y cancelar.

**Leyenda Resultado:** `PASS` | `FAIL` | `PENDIENTE` | `N/A`

**Política 011:** todo staff (doctor / recepcionista / peluquero / administrador) tiene acceso admin operativo. Solo portal client restringido. Usuarios/AuthPerfiles write = solo administrador.

**Nota 012 (perfiles dual / dueñas):** matriz limpia y flujo `/auth/contexto` en `specs/012-perfiles-dual-y-duenas/`. Credencial admin Cypress: **no rotar** en ese turno.

**Última corrida automatizada:** 2026-08-26 — política 011: Cypress roles **16/16 PASS**; cy:admin **23/23 PASS**; RTDB probe **ALLOW** operativo (doctor/recepcionista/peluquero); deploy database **OK**; build **PASS**; `:4200` vivo.

**Herramientas smoke multi-rol**

```bash
# 1) Provisionar staff efímero (doctor/recepcionista/peluquero) con admin de cypress.env.json
node scripts/smoke-008-provision-roles.mjs provision

# 2) Probe writes RTDB (ALLOW operativo para todos los roles staff)
node scripts/smoke-008-provision-roles.mjs rtdb-probe

# 3) Cypress UI por rol
npx cypress run --spec cypress/e2e/admin-roles-008-smoke.cy.ts --browser chrome

# 4) Desactivar usuarios efímeros
node scripts/smoke-008-provision-roles.mjs deactivate
```

Credenciales rol → `cypress.env.json` / `cypress.env.smoke-roles.json` (**gitignored**, no passwords en repo).

**Matriz RTDB (write) — política 011**

| Nodo | admin | doctor | recepcionista | peluquero | portal client |
|------|-------|--------|---------------|-----------|---------------|
| Citas | R/W | R/W | R/W | R/W | R propias; W no |
| Historiales_Clinicos | R/W | R/W | R/W | R/W | R propias (sin oculto_portal); W no |
| Inventario | R/W | R/W | R/W | R/W | sin acceso staff |
| Banios / Peluqueros | R/W | R/W | R/W | R/W | sin acceso |
| Vacunas / Medicamentos / Diagnósticos / Tratamientos | R/W | R/W | R/W | R/W | R propias vacunas; W no |
| Cliente / Mascota / Recordatorios | R/W | R/W | R/W | R/W | R propias; W clínico no |
| Usuarios / AuthPerfiles | R/W admin | R; W no | R; W no | R; W no | no |
| Producto / Productos / Venta (legacy móvil) | R/W staff | idem | idem | idem | no |

---

## Cómo ejecutar

1. Confirmar `http://localhost:4200` vivo.
2. Credenciales en `cypress.env.json` (admin + roles via script) — **nunca** commitear passwords.
3. Marcar cada ítem `- [x]` y rellenar **Resultado**.
4. Registrar resumen en `specs/011-staff-acceso-admin-unificado/tasks.md` § Testing.

---

## A. Administrador / Doctor

> Doctor: mismos módulos y writes operativos que admin (política 011).  
> Provision Usuarios sigue solo administrador (callable + rules).

### A1. Administrador (credencial Cypress `adminEmail`)

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| A1.1 | Login admin → `/admin` | OK | PENDIENTE | re-smoke 011 |
| A1.2–A1.10 | Módulos operativos R/W UI | PASS | PENDIENTE | igual que antes |

### A2. Doctor — usuario efímero + Cypress / RTDB probe

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| A2.1 | Login doctor → menú admin completo | OK | PENDIENTE | 011: incluye inventario/usuarios |
| A2.2 | Citas R/W | PASS | PENDIENTE | |
| A2.3 | Historiales R/W | PASS | PENDIENTE | |
| A2.4 | Inventario: módulo **sí** en menú UI | PASS | PENDIENTE | 011 (antes DENIED) |
| A2.5 | Inventario write RTDB ALLOW | ALLOW | PENDIENTE | 011 |
| A2.6 | Baños R/W | PASS | PENDIENTE | |

---

## B. Recepcionista

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| B.1 | Login → menú admin completo | OK | PENDIENTE | 011 |
| B.2 | Citas R/W | PASS | PENDIENTE | |
| B.3 | Historiales R/W (UI + RTDB) | PASS | PENDIENTE | 011 (antes W DENIED) |
| B.4 | Inventario R/W | PASS / ALLOW | PENDIENTE | 011 |
| B.5 | Baños R/W | PASS | PENDIENTE | |
| B.6 | Vacunas R/W | PASS / ALLOW | PENDIENTE | 011 |

---

## C. Peluquero

| # | Acción mínima | Esperado | Resultado | Notas |
|---|---------------|----------|-----------|-------|
| C.1 | Login → menú admin completo | OK | PENDIENTE | 011 |
| C.2 | Citas R/W | PASS / ALLOW | PENDIENTE | 011 |
| C.3 | Historiales R/W | PASS / ALLOW | PENDIENTE | 011 |
| C.4 | Inventario R/W | PASS / ALLOW | PENDIENTE | 011 |
| C.5 | Baños R/W | PASS | PENDIENTE | |

---

## D. Portal cliente

Sin cambio: lectura propia; write clínico DENIED. (Credencial portal pendiente.)

---

## F. Validación automatizada

| # | Acción | Esperado | Resultado | Notas |
|---|--------|----------|-----------|-------|
| F.1 | `database.rules.json` parse JSON | OK | PENDIENTE | |
| F.2 | Cypress admin smoke | PASS | PENDIENTE | |
| F.5 | Cypress multi-rol (011 expectations) | PASS | PENDIENTE | |
| F.6 | RTDB probe: ALLOW operativo todos roles | PASS | PENDIENTE | |
