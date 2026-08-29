# Cierre realista — KatzenVet Web operable en clínica

**Fecha:** 2026-08-28  
**Spec:** `specs/054-cierre-sistema/`  
**Qué significa “sistema completo” aquí:** un producto de **clínica operable** (no 40 features mediocres): clínica + POS + inventario + portal + vacunas + recordatorios + roles.

No es un wishlist infinito. Lo que no está abajo **no bloquea** abrir la clínica mañana.

---

## Ya está (código en repo)

| Superficie | Qué cubre | Spec |
|------------|-----------|------|
| Clínica | Clientes, expediente, directorio pacientes, citas, historiales, alergias, consentimientos, notas internas | 010–012, 029, 034, 037 |
| Vacunas | Acto + esquemas por especie + confirmación vet + recordatorio + PWA portal | 033, **052 done** |
| Recordatorios / push | CRUD + FCM al write + scheduler vacunas (código) | 017, 023, 052 |
| POS / cobro | Ticket del día, walk-in, pendientes baño, venta→stock, un solo camino de cobro | 032, 039–042, 045, 046, 050 |
| Inventario | Productos, foto/QR, picker, mermas, OC, alertas | 007, 043, 044 |
| Finanzas | Caja, márgenes, pensión, dashboard dueño | 014, 018, 021, 022, 025 |
| Portal | Login, mascotas, vacunas, citas, baños, pensión, self-reg, enlace a ficha | 002, 013, 047 ola 1–2 |
| Roles | Staff unificado (011); menú compacto recepción/peluquería (**054**) | 011, 012, 049, 054 |
| Auth UX | Auto-redirect login, dual, portal lock | 015, 051 |

---

## P0 — Falta para operar (esta entrega / inmediato)

| # | Ítem | Quién | Estado 2026-08-28 |
|---|------|-------|-------------------|
| 1 | **Desparasitación ola 1** — motor + diálogo confirmar + recordatorio (espejo 052, sin nodo RTDB nuevo) | Agente | **Hecho en esta sesión** → spec **053** |
| 2 | **Wizard ticket** — pasos dueño → líneas → cobrar en `visita-dialog` | Agente | **Hecho en esta sesión** |
| 3 | **Menú compacto por rol** (recepción / peluquería). Guards siguen 011 (acceso por URL) | Agente | **Hecho en esta sesión** |
| 4 | **Labels pacientes** — Expediente (`/admin/paciente`) vs Directorio (`/admin/pacientes-admin`) | Agente | **Hecho en esta sesión** |
| 5 | Empty/copy residuales (directorio + desparasitación) | Agente | **Hecho en esta sesión** |

---

## P1 — Siguiente bloque (código, no mezclar con 053)

| # | Ítem | Notas |
|---|------|-------|
| 1 | **053 ola 2** — listado/filtro desparasitaciones en Recordatorios + CTA cobro ticket | Tras usar ola 1 en clínica |
| 2 | **047 ola 3** — match self-reg por teléfono + confirmación (no auto-vínculo) | Spec ya escrita; Functions; **no** en esta entrega |
| 3 | Cerrar QA de **048 / 049 / 050** (`in_progress` → `done`) | Código mayormente listo; falta registro QA en tasks |
| 4 | Deploy **functions-fcm scheduler** 052 (`onVacunaPushSchedule`) | Código listo; **autorización Luis** |
| 5 | Medicamento controlado: salida inventario ligada a historial | Dominio §12; spec nueva |

---

## P2 — No bloquea clínica

| Ítem | Quién | Notas |
|------|-------|-------|
| CFDI / PAC / timbrar | Luis + spec | 024 es preparación; **sin PAC** hasta OK explícito |
| WhatsApp / ContactosWeb automatización | — | Baja |
| Multi-sucursal real | — | Una sucursal hoy |
| Super-admin operativo extra | — | Mínimo 012 ya existe |
| Fusión masiva de clientes duplicados | — | Fuera de 047 |
| Cypress credenciales portal/admin en CI | **Luis-only** | Tests skip sin env |
| Hosting version limit Firebase | **Luis-only** | Consola Firebase |

---

## Luis-only (el agente no puede / no debe)

| Ítem | Por qué | Dónde |
|------|---------|-------|
| **Resend fase B** — dominio DNS + `PORTAL_FROM_EMAIL` | Sin dominio, el correo solo llega al inbox Resend | `specs/038-resend-correo-portal/FASE-B-DOMINIO.md` |
| Smoke correo portal a cliente real | Requiere fase B | 038 |
| **Deploy** hosting / functions / database | Constitución | Luis autoriza |
| Deploy scheduler FCM vacunas | functions-fcm | 052 |
| **Hosting version limit** | Consola Firebase | Luis |
| Credenciales Cypress (`CYPRESS_*` / portalEmail) | Secretos | CI / `.env` local de Luis |
| RTDB producción | Aislamiento | Nunca el agente |

**No inventar `RESEND_API_KEY`.** Fase A (secret + callables) ya está.

---

## Qué no es “completar el sistema”

- Nueva app móvil
- Facturación SAT
- Campañas / gasolina / nodos legacy `Venta`
- Rediseño total del admin
- Match teléfono 047 si no hay diseño de confirmación (riesgo de unir dueños)

---

## Cómo saber que la clínica puede operar

Checklist de un día real:

1. Recepcionista ve menú corto: Ticket, Citas, Clientes, Directorio, Peluquería, Recordatorios.
2. Alta dueño + mascota → expediente.
3. Cita / baño / vacuna / **desparasitación** → recordatorio confirmado por vet.
4. Todo el cobro pasa por **Ticket del día** (pasos dueño → líneas → cobrar).
5. Producto en ticket descuenta inventario.
6. Dueño entra al portal (si hay correo; correo real = Luis DNS).
7. Doctor ve historial, vacunas, alergias.

Si eso funciona en localhost (y, cuando Luis despliegue, en producción), el producto es **operable**.
