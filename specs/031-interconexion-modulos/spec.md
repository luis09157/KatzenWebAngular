# Spec: Interconexión de módulos (grafo clínico + ops)

**ID:** 031-interconexion-modulos  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  
**Extiende:** 022 (costos), 028 (portal baños / ingresos), 029 (picker), 023 (FCM), 025 (dashboard)

---

## Problema

KatzenVet ya tiene módulos (clientes, pacientes, citas, historiales, vacunas, baños, pensión, recordatorios, caja, inventario, portal), pero **el dueño opera saltando entre pantallas** y varios flujos quedan sueltos:

1. Defaults baño P/M/G no rellenan costo/precio (salen 0) aunque hay plantillas en Finanzas.
2. El expediente del paciente no ofrece atajos a cita / pensión con picker prefilled.
3. Cita completada no tiene atajo a caja (`cajaMovimientoId` existe en modelo caja, no en flujo citas).
4. Stock bajo no lleva a crear OC con el producto.
5. KPIs del dashboard dueño no navegan al módulo.
6. Portal muestra baños (028) pero **no pensión ni recordatorios** aunque hay datos y reglas de lectura.

Sin un grafo de IDs consistente (`cliente_id` / `idCliente`, `paciente_id` / `idPaciente`) la clínica no puede cobrar, reportar ni mostrar el expediente al dueño de forma fiable.

---

## User stories

### US-1 — Defaults baño enlazados a Finanzas

Como **recepcionista / peluquería**  
Quiero que al elegir tamaño P/M/G se prellene costo y precio  
Para no cobrar a $0 ni adivinar el margen

**Criterios:**

- [x] SC-001: Al cambiar `tamano_perro`, costo y precio salen de `DefaultsBanioPorTamano` **o** de la plantilla `tipoServicio=banio` ligada (nunca aplicar 0 como si fuera tarifa)
- [x] SC-002: Si defaults aún no cargaron, el prefill se reintenta al resolver RTDB (sin carrera)
- [x] SC-003: Finanzas → Costos permite asignar plantilla por tamaño
- [x] SC-004: Hint visible si no hay defaults ni plantilla configurados

### US-2 — Atajos desde expediente

Como **staff en `/admin/pacientes`**  
Quiero acciones rápidas (cita, historial, vacuna, baño, pensión) con cliente+paciente ya enlazados  
Para no rebuscar al dueño

**Criterios:**

- [x] SC-005: Banner del expediente: Nueva cita, historial, vacuna, baño, pensión
- [x] SC-006: Diálogos reciben `cliente_id` + `paciente_id` reales (picker 029 restaura selección)
- [x] SC-007: Baño desde expediente escribe `cliente_id` (no solo nombre)

### US-3 — Cobro y reposición cruzados

Como **dueña / caja / inventario**  
Quiero ir de servicio → cobro y de stock bajo → OC  
Para cerrar el ciclo operativo del día

**Criterios:**

- [x] SC-008: Cita `completada` sin `cajaMovimientoId` → «Registrar en caja» (categoría consulta)
- [x] SC-009: Alerta / producto stock bajo → crear OC con ese producto (y proveedor si existe)
- [x] SC-010: KPIs dashboard: citas hoy, stock bajo, baños, clientes, ingresos → rutas admin

### US-4 — Portal simétrico (pensión + recordatorios)

Como **dueño portal**  
Quiero ver pensión y recordatorios de mi mascota (solo lectura)  
Para no depender de WhatsApp

**Criterios:**

- [x] SC-011: `/portal/mascotas/:id/pension` lista estancias propias; sin costos internos ni caja
- [x] SC-012: `/portal/mascotas/:id/recordatorios` lista recordatorios activos de la mascota
- [x] SC-013: Cards + contadores en detalle mascota
- [x] SC-014: Rules RTDB aditivas (client lee por `paciente_id` / `cliente_id` propio)

### US-5 — FCM token en perfil

Como **dueño en `/portal/perfil`**  
Quiero que «Activar avisos push» registre el token  
Para recibir recordatorios

**Criterios:**

- [x] SC-015: `getToken` usa el Service Worker ya registrado; si el permiso ya está granted no se vuelve a pedir de forma bloqueante
- [x] SC-016: Documentar smoke (sin redeploy FCM functions salvo bug real)

---

## Qué el dueño no había tomado en cuenta

Priorizado por ROI para una clínica veterinaria típica (no pedido aún; **backlog**, no este sprint salvo lo marcado hecho):

| # | Gap de negocio | Por qué importa | Prioridad | Estado |
|---|----------------|-----------------|-----------|--------|
| 1 | **Ticket unificado por visita** (cita + vacuna + baño + venta en un cobro) | Hoy cada módulo cobra aparte; el dueño no ve «cuenta del día» del cliente | Alta | backlog |
| 2 | **Deuda / saldo cliente** (crédito, pagos parciales) | Sin CxC no hay control de «me debe el baño» | Alta | backlog |
| 3 | **Refuerzo vacuna → recordatorio automático** | El campo `proximaAplicacion` existe; no siempre crea `Recordatorios` | Alta | backlog (vacuna ya puede crear uno si se marca) |
| 4 | **Consentimientos / autorización** (cirugía, eutanasia, internado) | Riesgo legal; no hay nodo ni UI | Media | backlog |
| 5 | **Alergias cruzadas** (mascota ↔ baño ↔ historial ↔ productos) | Baño tiene `alergias_conocidas` local; no pisa expediente ni alerta al agendar | Media | backlog |
| 6 | **Venta de producto ligada a paciente** | Salida inventario `venta_directa` no exige `paciente_id` | Media | backlog |
| 7 | **Staff responsable por acto** (UID, no solo nombre libre `veterinario` / `medico_atendio`) | Auditoría y comisión; hoy es texto | Media | backlog |
| 8 | **Auditoría quién editó** (created_by / updated_by inconsistente) | Disputas de cobro y clínica | Media | backlog |
| 9 | Hospitalización / cirugías como módulo | Fuera de alcance (Luis: no inventar módulos enormes sin spec corta) | Baja | no hacer |
| 10 | Receta impresa / receta controlada SAT | Fiscal + clínico | Baja | backlog 024 |
| 11 | Multi-dueño / tutor secundario | Un `cliente_id` por mascota; familias reales tienen 2 tutores | Media | backlog |
| 12 | WhatsApp / recordatorio canal dueño | Push+inbox no sustituyen el hábito de la clínica | Media | backlog (Resend diferido) |

---

## Fuera de alcance

- Resend / correo portal / `RESEND_API_KEY`
- Mega-módulos hospitalización/cirugías
- Ticket unificado, CxC, consentimientos (documentados como backlog)
- Redeploy functions FCM salvo fix de token en Angular
- Dumps RTDB producción

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Campos opcionales aditivos. App móvil no exige los nuevos. Lectura portal de `Pension/Estancias` y `Recordatorios` alineada a Banios (028).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Finanzas/DefaultsBanioPorTamano` | staff | staff | `plantillaCostoId` por tamaño (ya opcional) |
  | `Katzen/Finanzas/PlantillasCosto` | staff | staff | sin cambio estructural |
  | `Katzen/Banios` | staff + client propia | staff | `cliente_id` al crear desde expediente |
  | `Katzen/Citas` | staff / client | staff | `cajaMovimientoId?` aditivo |
  | `Katzen/Caja/Movimientos` | staff | staff | `citaId?` / `clienteId?` ya en modelo |
  | `Katzen/Pension/Estancias` | staff + **client propia** | staff | rules aditivas portal |
  | `Katzen/Recordatorios` | staff + client (ya) | staff | portal lista read-only |
  | `Katzen/FcmTokens/{uid}` | uid / staff | uid | sin cambio de nodo |

- **Estrategia de Datos de Prueba:** mocks en `src/app/core/testing/mock-data.ts` (`MOCK_DEFAULTS_BANIO_TAMANO`, `MOCK_PORTAL_PENSION`, `MOCK_PORTAL_RECORDATORIO`). Nunca producción `katzen-a0e3e`.

- **Patrones UI Reutilizados:** `admin-page`, `app-admin-stat-card` (link), `admin-dialog-shell`, picker 029, `PortalListSectionComponent`, empty states, `.panel-search`.

---

## Roles

| Rol | Accede mejoras |
|-----|----------------|
| administrador / dueña | dashboard links, finanzas, OC, caja |
| doctor / recepcionista / peluquero | expediente atajos, baños, citas→caja |
| client portal | pensión + recordatorios read-only, FCM perfil |

---

## UI (rutas)

- Admin: `/admin/inicio`, `/admin/pacientes`, `/admin/citas`, `/admin/banios`, `/admin/finanzas`, `/admin/inventario/ordenes`, `/admin/inventario/alertas`
- Portal: `/portal/mascotas/:id`, `/portal/mascotas/:id/pension`, `/portal/mascotas/:id/recordatorios`, `/portal/perfil`

---

## Backend

- [x] Cloud Function FCM: no tocar salvo bug functions (este sprint: Angular token)
- [x] Reglas RTDB: sí — Pension Estancias lectura client
- [x] Email: no (Resend diferido)

---

## Testing mínimo

Ver `tasks.md`.

---

## Notas / decisiones

- Dual IDs mascota: seguir `pacientePerteneceACliente()` / `getPacienteClienteId()`.
- Vacunas legacy: escribir `idPaciente` **y** preferir también `idCliente` desde expediente.
- No forzar precio 0: 0 = «no configurado».
