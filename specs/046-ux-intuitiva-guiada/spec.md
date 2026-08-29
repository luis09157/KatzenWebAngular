# Spec: UX intuitiva guiada (admin “como móvil”)

**ID:** 046-ux-intuitiva-guiada  
**Estado:** done  
**Fecha:** 2026-08-27  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 005 (loading), 029 (picker cliente/paciente), 032/036 (ticket), **045** (hub visita + grid), 044 (producto picker)

---

## Alcance transversal (todos los módulos)

**046 no es solo el ticket:** es el **estándar UX** que debe aplicarse a todo el admin (y copy portal donde aplique). Cada módulo se mejora por olas; no hace falta un rediseño total en un solo PR.

| Módulo / ruta | Qué debe entender el staff | Guía “te falta X” (mínimo) | Empty state con CTA | Ola UX |
|---------------|----------------------------|----------------------------|---------------------|--------|
| Inicio `/admin/inicio` | Resumen del día + atajos | — | KPI → rutas | 4 |
| Clientes | Dueños de mascotas | Teléfono/correo claros | Nuevo cliente | 3 |
| Pacientes / expediente | Mascotas + dueño | “Elige dueño primero” | Nueva mascota | 3 |
| Citas | Agenda | Dueño + mascota + vet | Nueva cita | 3 |
| Historiales | Consulta clínica | Paciente | Nuevo historial | 3 |
| Vacunas | Aplicación / calendario | Paciente | Nueva vacuna | 3 |
| Recordatorios | Pendientes | Paciente | Nuevo | 3 |
| **Peluquería / baños** | Operación grooming | Dueño → mascota | Nuevo baño | **1–3** |
| **Visitas / cuenta del día** | Cobro del día (POS) | Dueño o mostrador; líneas | Incluir / vender | **1 (045)** |
| Caja / finanzas | Dinero entró/salió | Concepto + monto | Nuevo movimiento | 3 |
| **Inventario productos** | Catálogo + stock | — | Grid + nuevo producto | **1 (045)** |
| Movimientos / OC / proveedores | Stock / compras | Producto | Pickers 044 | 3 |
| Pensión | Estancia | Dueño + mascota | Nueva estancia | 3 |
| Consentimientos | Documentos firmados | Cliente/paciente | Nuevo | 3 |
| Usuarios / portal | Accesos | Correo válido | Provision | 4 |
| Portal dueño | Ver su mascota | Login | — | 4 |
| Landing | Marketing | — | — | N/A |

**Regla de implementación:** al tocar cualquier módulo (bugfix o feature), aplicar checklist UX de esta spec (empty, hints, orden natural, copy). No dejar “solo funciona para quien ya sabe”.

---

## Problema

Hoy el admin es **potente pero opaco**: pantallas con muchos campos, atajos que no explican el siguiente paso, y flujos que asumen que el staff ya sabe el orden correcto (cliente → paciente → baño → ticket → caja). Incluso quien conoce el código se pierde.

En clínica real (recepción, peluquería, petshop) la gente necesita algo **como una app móvil**:

1. Un objetivo claro por pantalla (“Cobrar el día”, “Registrar baño”, “Vender producto”).
2. Si falta un dato, el sistema **dice qué falta y ofrece el botón** (“Primero elige o crea el dueño”).
3. Venta de mostrador **sin obligar** a registrar cliente (walk-in), pero **invitar** a vincularlo si ya existe o se quiere historial / saldo / ticket.

Sin esta capa de UX, el ticket (045) y el resto de módulos seguirán sintiéndose “difíciles” aunque la lógica de negocio sea correcta.

---

## Principios de producto (no negociables en UI admin)

| # | Principio | Qué significa en la clínica |
|---|-----------|-------------------------------|
| P1 | **Un trabajo por pantalla / diálogo** | “Registrar baño” no es “cobrar”; cobrar es el ticket o caja. |
| P2 | **Guía, no castigo** | Si falta dueño: mensaje + CTA “Agregar dueño”, no solo campo rojo. |
| P3 | **Orden natural** | Cliente → paciente (si aplica) → servicio/producto → cuenta del día → pago. |
| P4 | **Walk-in permitido** | Petshop puede vender sin cliente; el ticket/venta queda como “Mostrador / público”. |
| P5 | **Registro opcional pero valioso** | Si hay cliente: mejor (historial, CxC, pendientes de baño en el ticket). |
| P6 | **Lenguaje de clínica** | Evitar jerga interna. Preferir “Cuenta del día”, “Incluir en la cuenta”, “Vender producto”. |
| P7 | **Empty states útiles** | Nunca “Sin datos”. Siempre: qué es esto + 1–2 acciones. |
| P8 | **Touch-first** | Botones grandes, chips, grid de productos con foto; menos tablas densas en flujos de cobro. |

---

## Modelo mental (cómo debe “sentirse”)

```text
¿Qué quieres hacer?
  ├─ Atender / bañar / citar  → módulo operativo (con guía de dueño/mascota)
  ├─ Vender en petshop        → venta rápida (cliente opcional) → sale a cuenta del día
  └─ Cobrar / ver saldo       → Cuenta del día (ticket) → pago en caja
```

**Regla de oro:** la operación (baño, vacuna, producto) **alimenta** la cuenta; la cuenta **cobra**. No tres cajas distintas.

---

## User stories

### US-1 — “Te falta X primero”

Como **recepción / peluquero**  
Quiero que si intento un baño sin dueño (o sin mascota cuando el flujo lo requiere) el sistema me diga **qué falta** y me lleve a crearlo/elegirlo  
Para no adivinar el orden

**Criterios:**

- [ ] SC-001: Baño nuevo: sin `cliente_id` → banner o bloqueo suave: “Elige o crea el dueño para continuar” + botón a picker / alta rápida.
- [ ] SC-002: Vacuna / historial / cita: mismo patrón cliente→paciente si falta.
- [ ] SC-003: Ticket / cuenta del día: sin cliente → explicar dos caminos: (A) elegir cliente, (B) “Venta de mostrador (sin cliente)” si el flujo lo permite (ver US-3).
- [ ] SC-004: Los mensajes usan español latino claro; sin códigos técnicos ni nombres de nodos RTDB.

### US-2 — Empty states y copy de ayuda

Como **staff nuevo**  
Quiero textos cortos que digan qué hace la pantalla y el siguiente paso  
Para aprender usándola

**Criterios:**

- [ ] SC-005: Visitas: empty de líneas explica “Incluye un baño pendiente, vende un producto o agrega una consulta”.
- [ ] SC-006: Peluquería: si no hay baños, CTA “Nuevo baño” + hint “Primero dueño y mascota”.
- [ ] SC-007: Productos (grid 045): sin resultados → “Prueba otro nombre o crea un producto”.
- [ ] SC-008: Subtítulos de banner/diálogo en 1 frase de propósito (no relleno genérico).

### US-3 — Petshop / walk-in (cliente opcional)

Como **mostrador**  
Quiero vender un producto **aunque el comprador no esté registrado**  
Y si sí está, vincular la venta a su cuenta del día

**Criterios:**

- [ ] SC-009: Flujo “Venta rápida / mostrador”: producto + cantidad + cobro; `cliente_id` **opcional**.
- [ ] SC-010: Si no hay cliente: línea/ticket marcado como mostrador (copy visible: “Sin cliente · venta de mostrador”); no bloquea stock ni caja.
- [ ] SC-011: Si elige cliente: misma venta entra a la **cuenta del día** (ticket 032/045) cuando exista/abra.
- [ ] SC-012: CTA suave “¿Es cliente de la clínica? Vincular” sin obligar.

### US-4 — Flujo guiado cuenta del día (ticket)

Como **recepción**  
Quiero ver la cuenta del día como un POS simple  
Para cobrar baño + producto + consulta juntos

**Criterios:**

- [ ] SC-013: Renombrar en UI (sin romper RTDB): preferir “Cuenta del día” / “Ticket de cobro” en títulos y menú (alias aceptable: Visitas).
- [ ] SC-014: Pasos visibles o chips: 1 Dueño → 2 Pendientes / productos → 3 Cobrar.
- [ ] SC-015: Panel “Pendientes de hoy” (baños) con “Incluir” (045).
- [ ] SC-016: Atajo Producto = picker + cantidad, no texto libre (045).
- [ ] SC-017: Botón Cobrar deshabilitado con hint: “Agrega al menos una línea” / “No hay saldo pendiente”.

### US-5 — Sensación móvil / touch

Como **staff en tablet o laptop**  
Quiero controles grandes y poca densidad en flujos de cobro  
Para no equivocarme bajo presión

**Criterios:**

- [ ] SC-018: En ticket y venta mostrador: botones primarios grandes; presets como chips.
- [ ] SC-019: Catálogo productos: vista cuadrícula foto+datos (045) por defecto o toggle memorable.
- [ ] SC-020: Evitar más de un “modo experto” oculto sin explicación en la misma pantalla.

### US-6 — Estándar al tocar cualquier módulo

Como **agente / desarrollador**  
Al tocar cualquier módulo (bugfix o feature)  
Debo aplicar este checklist UX antes de cerrar el cambio  
Para no dejar pantallas que “solo funcionan para quien ya sabe”

**Checklist (obligatorio):**

- [ ] **Empty:** empty state útil (qué es + CTA); nunca “Sin datos” genérico.
- [ ] **Hint:** si falta un dato crítico, mensaje “te falta X” + CTA (no solo campo rojo).
- [ ] **Orden:** flujo en orden natural (dueño → paciente → servicio/producto → cobro cuando aplique).
- [ ] **Copy:** español latino claro; subtítulo/propósito en 1 frase; sin jerga técnica.
- [ ] **Touch:** controles usables en tablet (botones/chips legibles; menos densidad en cobro).

---

## Fuera de alcance (046)

- Rediseño total del sidenav / branding landing.
- App nativa móvil.
- Unificar `ProductosPeluqueria` con inventario clínico.
- Cambios destructivos RTDB o migración masiva.
- Implementar todo el admin de golpe: **045** cubre hub ticket + grid; **046** define el estándar UX y el MVP de guía/walk-in; el resto de módulos se adapta por olas.

---

## Contratos de Datos y UI (Obligatorio)

- **RTDB:** preferir **solo campos opcionales** ya existentes (`cliente_id?`, `visitaId?`, etc.). Si walk-in necesita marcar venta sin cliente: usar ticket/línea sin `cliente_id` **o** cliente sistema “Mostrador” (decidir en `plan.md` sin romper móvil).
- **Pruebas:** mocks locales / emuladores — nunca producción `katzen-a0e3e`.
- **UI:** `admin-dialog-shell`, banners, empty states (`app-admin-empty-state`), pickers 029/044, SweetAlert solo para confirmaciones; guías inline preferibles a modales en cadena.
- **Patrones:** mensajes “te falta X” reutilizables (componente o helper de copy) para no duplicar texto en cada módulo.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí |
| recepcionista | sí (público principal) |
| peluquero | sí (baño + guía dueño) |
| portal cliente | no (solo lectura existente) |

---

## Definition of Done

- [x] Spec + plan + tasks revisados con Luis
- [x] MVP implementado según `tasks.md` (olas 1–3)
- [x] `npm run build` OK
- [x] QA guía en `tasks.md` (empty states, walk-in, mensajes “te falta X”)
- [x] Preview `http://localhost:4200` + hosting prod
- [x] `domain-context.md` actualizado con principios UX

---

## Olas de implementación (sugeridas)

| Ola | Qué | Spec |
|-----|-----|------|
| 1 | Cuenta del día guiada + pendientes baño + producto + copy | **045** + esta 046 (MVP) |
| 2 | Walk-in petshop (venta sin cliente) + CTA vincular | 046 |
| 3 | Empty states + “te falta X” en baños, citas, vacunas | 046 |
| 4 | Renombres menú / onboarding corto recepción | 046 (opcional) |
