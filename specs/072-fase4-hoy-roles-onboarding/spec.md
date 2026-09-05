# Spec: Fase 4 — Hoy, roles y onboarding

**ID:** 072-fase4-hoy-roles-onboarding  
**Estado:** in_progress  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L3 (nodo RTDB aditivo `Katzen/Config/clinica` + rules staff-only; UI L2)  
**Relaciona:** PLAN-UX Fase 4 · **054** decisiones #3 y #4 · **048** `app-flow-hint` · **049** hub/menú · **011** (URL ya no es `*` para todo staff) · **070** Llegó un paciente / Atender · **071** ticket 80 mm

---

## Problema

La recepcionista y la veterinaria ven el mismo menú largo y el mismo dashboard de dueño (ingresos, meta, top productos). Pueden abrir Finanzas y Personal por URL. Nadie sabe si un dueño recibirá recordatorios. No hay datos de la clínica compartidos entre estaciones ni un manual corto. Los hints de 048 no se pueden ocultar.

---

## User stories

### US-1 — Menú 6 grupos (4.1)

Como **vet / recepción**  
Quiero **Hoy · Pacientes · Agenda · Cobrar · Recordatorios · Más**  
Para no mezclar peluquería y pensión al mismo nivel que Cobrar

**Criterios de aceptación:**

- [x] SC-001: Compacto (recepción, peluquero, **doctor**): Hoy, Pacientes, Agenda (Citas + Peluquería + Pensión como hijos), Cobrar, Recordatorios, Más (Clientes, Consentimientos, Inventario, Finanzas, Servicios, Personal, Contactos, Configuración — visibles según rol). Admin/dueño ve lo mismo más ítems en Más; **un solo** Hoy/Inicio.
- [x] SC-002: `STAFF_NAV_COMPACT` incluye `doctor`. Historiales y vacunas viven en Más (o expediente), no como ítems sueltos al nivel de Cobrar.

### US-2 — Dashboard «Hoy» por rol (4.2)

Como **recepción / vet**  
Quiero el día operativo, no las métricas del negocio  
Para atender y cobrar sin ver ingresos/meta/tops

**Criterios de aceptación:**

- [x] SC-003: Owner-dash (ingresos, meta, top productos) **solo** admin/dueño/super_admin. Cierra 054 #3: hub operativo es la home de vet/recepción; dueño sigue viendo métricas debajo.
- [x] SC-004: Hoy muestra: citas + Atender; recordatorios vencidos/hoy + Llamar / WhatsApp / Hecho; por cobrar; en pensión; stock bajo **solo admin**; CTA grande «Llegó un paciente» (070, sin duplicar).

### US-3 — Permisos por URL (4.3)

Como **administradora**  
Quiero que recepción no abra Finanzas ni Personal pegando la URL  
Para que el menú y el guard digan lo mismo

**Criterios de aceptación:**

- [x] SC-005: `STAFF_MODULE_ACCESS` deja de ser `*` para recepción, peluquero y doctor. Recepción: no `finanzas` ni `usuarios`. Peluquero: no finanzas/usuarios/inventario. Doctor: clínico + POS; no finanzas/usuarios. Siguen POS, citas, pacientes, recordatorios (y el resto clínico que ya usan).
- [x] SC-006: `StaffRoleGuard` redirige a `/admin/inicio` con mensaje humano (sin jerga).

### US-4 — Canal de recordatorios en ficha (4.4)

Como **recepción**  
Quiero ver si el dueño recibirá avisos  
Para no prometer un WhatsApp automático que no existe

**Criterios de aceptación:**

- [x] SC-007: En ficha/edición de cliente: «Este dueño sí/no recibirá recordatorios» y faltantes en lenguaje claro: correo / activar portal / permitir avisos. Datos: email, `portalActivo`, token de avisos si existe. Nada de FCM/claims.

### US-5 — Configuración de clínica (4.5)

Como **admin**  
Quiero nombre, logo (URL), horario, IVA % y vet de preferencia  
Para que todas las estaciones vean lo mismo

**Criterios de aceptación:**

- [x] SC-008: Ruta `/admin/configuracion` solo admin. Persistencia aditiva `Katzen/Config/clinica`. Rules staff-read / admin-write. Ticket 80 mm y WhatsApp leen el **nombre** si está guardado; si no, «KatzenVet». IVA % y vet default se guardan; aplicarlos al POS/citas es follow-up si no cabe en este diff.

### US-6 — Ayuda y hints (4.6)

Como **cualquier staff**  
Quiero un manual corto y poder ocultar las pistas  
Para no depender de quien instaló el sistema

**Criterios de aceptación:**

- [x] SC-009: `docs/MANUAL-USUARIO.md` (cobro, llegada, corte, expediente). Ítem de menú «Ayuda» abre esos 4 flujos (diálogo). Sin jerga.
- [x] SC-010: `app-flow-hint` con `hintId` muestra «No volver a mostrar» y persiste en `localStorage` (054 #4, L2, sin RTDB).

---

## Fuera de alcance

- Deploy de `database` / hosting / functions (Luis autoriza).
- Scheduler FCM, dominio Resend, impresora térmica física.
- Borrar cobro directo legacy (054 #2).
- Preferencia de hints en `Katzen/Usuarios/{uid}` (se eligió localStorage).

---

## Contratos de Datos y UI

- **Impacto en Firebase RTDB:** nodo hijo **nuevo y opcional** bajo `Katzen/Config` (el padre ya existe: `inversionMeta`, `Vacunacion`). La app móvil no lee `clinica`.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Config/clinica` | staff (`role != client`) | admin / dueño | campos opcionales; defaults en lectura |

- **Estrategia de datos de prueba:** emulador localhost o mocks. Prohibido `katzen-a0e3e` prod.
- **Patrones UI:** `admin-page` + banner + panel; diálogo `admin-dialog-shell`; menú existente; `ErrorMessagesService` + `LoadingService`.

---

## Roles

| Rol staff | Hoy / menú 6 | Owner-dash | Finanzas / Personal | Config |
|-----------|--------------|------------|---------------------|--------|
| administrador / dueño / super_admin | sí + Más amplio | sí | sí | sí |
| doctor | compacto 6 grupos | no | no | no |
| recepcionista | compacto 6 grupos | no | no | no |
| peluquero | compacto (sin pensión si no está en nav) | no | no | no |

---

## UI (rutas y layout)

- `/admin/inicio` — Hoy por rol
- `/admin/configuracion` — solo admin
- Ayuda: diálogo desde el sidenav (todos los staff)
- Menú: ver SC-001

---

## Backend

- [x] Cloud Function: no
- [x] Reglas RTDB: sí — hijo `clinica` aditivo (ver `plan.md`)
- [ ] Email / FCM: no

---

## Testing mínimo

Ver `tasks.md`. Utils: nav/acceso, canal recordatorios, config, dismiss de hints. `npm run build`. Smoke 375/1280.

---

## Notas / decisiones

- **054 #3:** owner-dash solo admin/dueño. Vet/recepción = Hoy operativo.
- **054 #4:** hints se ocultan por usuario en **localStorage** (L2). No se toca `Katzen/Usuarios`.
- **011:** el acceso unificado al *panel* se mantiene; los *módulos* ya no son `*` para recepción/peluquero/doctor.
- Config es L3 por rules + nodo. **No hay deploy** en esta entrega: en emulador se ve; en prod compartido hace falta que Luis despliegue `database`.
- Follow-up: IVA default y vet default en POS/citas; logo como archivo (hoy URL).
