# Plan de trabajo — KatzenVet usable por veterinarias

**Fecha:** 2026-09-04 · **Origen:** auditoría UX de solo lectura (flujos operativos + clínicos + navegación) · **Dueño:** Luis
**Objetivo:** que una veterinaria o recepcionista **sin conocimiento técnico** opere la clínica completa sin saber "a qué menú ir". El sistema pide lo que falta y lo resuelve ahí mismo.

## Principios de diseño (aplican a toda feature nueva)

1. **Llevar de la mano:** si un paso necesita un prerequisito (cliente antes que paciente, caja antes que cobro, producto antes que venta), el sistema lo ofrece inline, nunca "ve al menú X".
   - **Regla de negocio (Luis, 2026-09-04):** ser cliente **no** es requisito para comprar en recepción. Cualquier persona compra productos de petshop/farmacia sin registrarse. Cliente + paciente solo se exigen para **consultar o atender** (historial, vacuna, baño, pensión, cita). El POS abre en modo **venta rápida** (mostrador) y pregunta "¿Es cliente / trae mascota?" solo cuando la usuaria agrega un servicio clínico.
2. **Mínimo obligatorio:** solo los campos sin los cuales el registro no sirve. Todo lo demás opcional y colapsado.
3. **Cero jerga:** nada de UID, RTDB, Firebase, claims, override, spec NNN, "dual", "provisionar" en pantalla.
4. **Lo automático no se pregunta:** cobro → movimiento de caja; vacuna → recordatorio; venta → salida de stock; primer cobro del día → turno de caja abierto.
5. **Un solo lugar por tarea:** una entrada a pacientes, una a inicio, un camino para vender.
6. **Por rol:** la vet ve ≤7 grupos de menú; finanzas/inventario/personal solo admin.

## Estado actual (resumen)

| Área | Completo | Parcial | Falta |
|---|---|---|---|
| POS | cobro con cliente, mostrador, pago mixto, devolución, salida stock automática | ticket (A4, sin folio/IVA/cambio) | crear cliente/paciente desde POS, kits BOM, cambio en efectivo |
| Caja | corte con cálculo esperado/diferencia, movimientos automáticos | reportes (falta por veterinaria, CxC fuera) | apertura/turno, aviso de corte |
| Inventario | alerta → OC → recepción → stock | alertas requieren botón manual; alta de producto 12 campos | exportar OC ("Próximamente") |
| Clínico | todos los módulos tienen pantalla real y empty-states con CTA | historial 9 obligatorios; cita 4 obligatorios | alta encadenada cliente → mascota → atención |
| Navegación | 30 ítems, todos funcionan | dashboard mezcla "hoy" con KPIs de dueño | menú por rol para doctor; permisos reales por URL |
| Onboarding | hints `app-flow-hint` en 6 lugares | — | config de clínica, manual, ayuda contextual |
| Recordatorios al dueño | vacuna → recordatorio automático | — | scheduler FCM sin deploy; Resend sin dominio; la vet no sabe si el dueño lo recibirá |

## Fases

Esfuerzo: **S** ½–1 día · **M** 2–4 días · **L** 1–2 semanas (con agente). Nivel según `sdd-workflow.mdc` (L1/L2/L3).

### Fase 1 — Quitar fricción (1 semana) · todo L1/L2

| # | Ítem | Esf. | Toca |
|---|---|---|---|
| 1.1 | Relajar obligatorios: historial 9→2 (motivo + nota), cita (vet logueada default, estado oculto, duración 30), paciente (raza/sexo opcionales), cliente (género opcional) | S | `historial-dialog`, `cita-dialog`, `paciente-admin-dialog`, `cliente-dialog` |
| 1.2 | Alta rápida de producto: nombre, precio, categoría, stock inicial; proveedor opcional / "Proveedor General" automático; resto con defaults | S | `producto-dialog` |
| 1.3 | Limpiar jerga en UI: "spec 017", "UID del staff", "Firebase Auth", "dual", "override", "Migrar base de datos" (solo super_admin), "Nuevo personal staff", banner emulador solo en local | S | `vacuna-esquema-confirm`, `desparasitacion-esquema-confirm`, `cita-dialog`, `usuarios`, `historiales`, `pension` |
| 1.4 | Apagar catálogo demo en POS real (064 pendiente) y sustituir copy "El inventario está en Administración" por CTA | S | `pos-catalogo-demo.util`, `visita-dialog` |
| 1.5 | Fusionar "Buscar paciente" + "Directorio de pacientes"; quitar "Dashboard métricas" duplicado | S | `admin-main-layout`, routing |
| 1.6 | Alertas de stock automáticas al abrir pantalla y tras recepción; badge en menú | S | `alertas.component`, `inventario.service` |
| 1.7 | Cambio en efectivo en paso Cobrar ("recibí $500 → cambio $120") | S | `pos-pago-mixto.util` (+tests), `visita-dialog` |
| 1.8 | Errores con acción sugerida (`failed-precondition`, `invalid-argument`, `internal`) | S | `error-messages.service` |

### Fase 2 — Flujos guiados (2–3 semanas) · L2

| # | Ítem | Esf. | Toca |
|---|---|---|---|
| 2.0 | **POS en modo venta rápida por defecto:** abre directo en productos sin pedir cliente (mostrador ya existe, spec 046, pero está escondido en el riel petshop); cliente/paciente se piden solo al agregar un servicio clínico; "¿Es cliente?" opcional al final para ligar el ticket | M | `visita-dialog` (orden de pasos), `visitas.component` |
| 2.1 | **POS: crear cliente y mascota inline** cuando sí se necesitan (botón "Cliente nuevo" → `ClienteDialog` reducido → "¿Trae mascota?" → `PacienteAdminDialog` reducido → continuar cobro) | M | `visita-dialog`, `cliente-paciente-picker` (nuevo `Output` crear) |
| 2.2 | **Botón "+"** en `cliente-paciente-picker` para todos los diálogos (cita, vacuna, baño, pensión, consentimiento) + botón "Agregar mascota" en ficha de cliente | M | `cliente-paciente-picker`, `cliente-dialog` |
| 2.3 | **Asistente "Llegó un paciente"** (stepper 3 pasos: Dueño → Mascota → ¿Qué viene a hacer? Consulta / Vacuna / Baño / Pensión / Cita) reutilizando diálogos existentes; al terminar abre expediente | L | nuevo `alta-rapida-dialog`, dashboard, empty-state de Citas |
| 2.4 | **Kits en POS:** vender kit, explotar BOM, validar stock por componentes, N salidas (064 F4) | M | `visita-dialog.pushProducto/asegurarSalidasProducto`, `visitas.service`, util nuevo con tests |
| 2.5 | "Atender" desde Citas de hoy → expediente con la cita en contexto | S | `citas.component`, `dashboard` |
| 2.6 | Unificar venta desde Salida de inventario → redirige a POS con producto precargado | S | `salida-dialog` |

### Fase 3 — Caja y finanzas automáticas (1–2 semanas) · L3 (toca RTDB)

| # | Ítem | Esf. | Toca |
|---|---|---|---|
| 3.1 | **Turno de caja:** apertura implícita en el primer cobro del día (fondo del último corte), nodo aditivo `Katzen/Caja/Turnos/{fecha}`, evitar doble corte | M | `caja.service`, `caja.models`, `database.rules.json` (aditivo) |
| 3.2 | Banner "Hacer corte" en POS/Hoy al final del día; corte con un solo campo obligatorio (efectivo contado) | S | `visitas.component`, `dashboard`, `caja-corte-dialog` |
| 3.3 | **Ticket 80 mm** con folio, líneas, IVA desglosado, método(s), cambio; opción WhatsApp | M | `visita-dialog.html/scss`, `visitas.models` (folio aditivo) |
| 3.4 | Reporte "ventas por veterinaria hoy" + CxC dentro de Finanzas, sin filtros | S | `finanzas.component`, `caja.service` |
| 3.5 | Exportar OC (o quitar botón "Próximamente") | S | `ordenes.component` |

### Fase 4 — Navegación por rol, "Hoy" y onboarding (2 semanas) · L2

| # | Ítem | Esf. | Toca |
|---|---|---|---|
| 4.1 | **Menú 6 grupos** para vet/recepción: Hoy · Pacientes · Agenda (citas + peluquería + pensión) · Cobrar · Recordatorios · Más (admin) | M | `admin-main-layout`, `staff-role.config` (`STAFF_NAV_COMPACT` extendido a doctor) |
| 4.2 | **Dashboard "Hoy"** por rol: Citas de hoy con "Atender", Recordatorios vencidos (llamar / hecho), Por cobrar, En pensión, Stock bajo (admin), botón grande "Llegó un paciente". KPIs de dueño solo admin (cierra decisión #3 de 054) | M | `dashboard.component` |
| 4.3 | **Permisos reales por URL:** hoy `STAFF_MODULE_ACCESS = *` para todos; recepción no debe abrir Finanzas/Personal por URL | S | `staff-role.config`, `StaffRoleGuard` |
| 4.4 | Indicador en ficha de cliente: "Este dueño sí/no recibirá recordatorios — falta: correo / activar portal / permitir avisos" | M | `cliente-dialog`, `recordatorios.service` |
| 4.5 | Módulo **Configuración de clínica** (nombre, logo, horario, IVA default, vet default, impresora) | L | nuevo `configuracion/` + nodo aditivo `Katzen/Config` (L3) |
| 4.6 | Ayuda: `docs/MANUAL-USUARIO.md` de 2 páginas + botón "Ayuda" en menú + hints con "No volver a mostrar" (localStorage) | M | layout, `app-flow-hint` |

### Continuo — infra pendiente de Luis

| Ítem | Estado |
|---|---|
| Deploy `onVacunaPushSchedule` (functions-fcm) | listo, sin deploy (ROADMAP l.78) |
| Dominio Resend + `RESEND_API_KEY` | pendiente (038 Fase B) |
| Rotar keystore Android (repo público, historial) | pendiente |
| Decisiones `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md` | 4 abiertas |
| 064: historial de tickets + freeze/cutover PDV | pendientes |

## Extras que recomiendo (no pedidos)

1. **Sesión de observación real:** 1 hora viendo a una veterinaria usar el sistema con 3 tareas ("llegó cliente nuevo con perro", "cobra vacuna a cliente existente", "haz el corte"). Vale más que cualquier auditoría; hacerla antes de Fase 2 y repetirla después.
2. **Búsqueda por teléfono** como primer campo en todos los pickers de cliente (es lo que la recepcionista tiene a la mano).
3. **POS táctil:** botones ≥44 px, teclado numérico en montos, sin hover-only; muchas clínicas cobran en tablet.
4. **WhatsApp** como canal de ticket y recordatorio (`wa.me/` con texto prellenado): cero infraestructura, funciona hoy; el push FCM/Resend queda como complemento.
5. **Impresora térmica:** validar el ticket 80 mm con la impresora real de la clínica antes de dar por cerrada 3.3.
6. **Respaldo automático:** export semanal de RTDB a Storage (function programada). Hoy no hay respaldo fuera de Firebase.
7. **Métrica de uso mínima:** contar aperturas por módulo (localStorage → RTDB agregado) para saber qué menús nadie usa y borrarlos.

## Orden recomendado y criterio de éxito

Fase 1 → 2 → 3 → 4. Después de Fase 2, el caso "cliente nuevo con perro para consulta" debe bajar de **3 menús / 3 diálogos / ~25 clics** a **1 botón / 1 asistente / ≤10 clics**. Después de Fase 3, ningún cobro requiere pasos manuales de caja y el corte del día toma <2 minutos.

Cada fase se abre como spec numerada (065+) con nivel L2 o L3 según toque RTDB; los ítems S de Fase 1 pueden ir como L1 agrupados.
