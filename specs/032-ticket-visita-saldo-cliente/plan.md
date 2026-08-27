# Plan técnico: Ticket visita + saldo cliente

**Spec:** `specs/032-ticket-visita-saldo-cliente/spec.md`  
**Estado:** approved  

---

## Resumen

Nuevo nodo aditivo `Katzen/Visitas` con líneas de cobro y pagos parciales vía `Caja/Movimientos.visitaId`. Saldo del cliente se agrega desde visitas con `saldo > 0` y se denormaliza opcionalmente en `Cliente.saldoPendiente`. UI admin lazy `/admin/visitas` + cuenta corriente en Clientes + atajos desde citas/baños/expediente. Portal read-only si rules lo permiten.

---

## Archivos a crear / modificar

### Angular (crear)

| Archivo | Notas |
|---------|-------|
| `src/app/visitas/visitas.models.ts` | tipos Visita, línea, estado |
| `src/app/visitas/visitas.util.ts` | recalc totales, estado, agregación saldo |
| `src/app/visitas/visitas.service.ts` | CRUD + cobro + sync saldo cliente |
| `src/app/visitas/visitas.module.ts` + routing | lazy |
| `src/app/visitas/visitas.component.*` | lista + KPIs + deudas |
| `src/app/visitas/visita-dialog.component.*` + module | ticket líneas + cobrar |
| `src/app/visitas/cliente-cuenta-dialog.component.*` | cuenta corriente |
| `src/app/visitas/visitas-dialog.module.ts` | export diálogos |

### Angular (modificar)

| Archivo | Acción |
|---------|--------|
| `app-routing.module.ts` | ruta `visitas` |
| `staff-role.config.ts` | StaffModule `visitas` |
| `admin-main-layout.component.html` | menú |
| `caja.models.ts` / `caja.service.ts` / dialog | `visitaId?` |
| `clientes.component.*` + module | saldo + cuenta corriente |
| `citas.component.*` / `banios` | «Agregar a visita» |
| `pacientes.component.*` | atajo nueva visita |
| `dashboard` / owner KPIs (si aplica) | visits hoy / saldo |
| `portal-*` | listado visitas + mapper |
| `mock-data.ts` | mocks visita |
| `database.rules.json` | nodo Visitas |
| `cypress/...authenticated.cy.ts` | smoke ruta |
| `specs/ROADMAP.md`, `README.md`, `domain-context.md` | documentar |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | Visitas staff write + client read propia |

### Cypress

| Archivo | Acción |
|---------|--------|
| `admin-modules-authenticated.cy.ts` | `/admin/visitas` |

---

## Modelo de datos

```text
Katzen/Visitas/{visitaId}
  cliente_id: string
  cliente?: string
  paciente_id?: string
  paciente?: string
  fecha: string                 # YYYY-MM-DD
  estado: abierta|parcial|cerrada|cancelada
  lineas: {
    id, descripcion, monto, categoria,
    citaId?, banioId?, vacunaId?, productoId?, pensionId?
  }[]
  total: number
  pagado: number
  saldo: number                 # total - pagado
  cajaMovimientoIds?: string[]
  notas?: string
  activo: boolean
  created_at, updated_at?, created_by?, sucursalId?

Katzen/Cliente/{id}
  saldoPendiente?: number       # opcional denormalizado

Katzen/Caja/Movimientos/{id}
  visitaId?: string             # aditivo

Katzen/Citas|Banios/{id}
  visitaId?: string             # opcional enlace
```

---

## Flujos

### Crear visita + líneas + cobro parcial

1. Staff abre `/admin/visitas` → Nueva visita (picker cliente/paciente).
2. Agrega líneas → `recalcularTotales`.
3. Cobrar $X ≤ saldo → `crearMovimiento` caja + actualizar visita + `syncSaldoCliente`.
4. Si saldo=0 → `cerrada`; si no → `parcial`.

### Agregar cita/baño a visita

1. Si entidad ya tiene `cajaMovimientoId` → bloquear.
2. Buscar visita `abierta|parcial` mismo `cliente_id` + `fecha` hoy; si no, crear.
3. Push línea + set `visitaId` en entidad origen.

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Sin cliente | validación form |
| Monto cobro > saldo | rechazo |
| Ya cobrado en caja | anti doble cobro |
| Permiso | permission-denied RTDB |

---

## Servicios

- `VisitasService` — RTDB `Katzen/Visitas` + sync `Cliente.saldoPendiente`
- `CajaService.crearMovimiento` — acepta `visitaId`
- Reutiliza `ClientesService.actualizarCliente`

---

## UI (admin)

- Contenedor: `.visitas-contenedor`
- Diálogo ticket: `ADMIN_DIALOG_FORM` + shell
- Cuenta corriente: `ADMIN_DIALOG_DETAIL`
- Loading contextual en guardar/cobrar/borrar

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Visitas` | nuevo nodo | no | opcional |
  | `Cliente.saldoPendiente` | campo opcional | no | default 0/ausente |
  | `Caja/...visitaId` | campo opcional | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** mocks locales; emuladores si se prueba rules; nunca prod en agent QA.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Página CRUD | `pension/`, `clientes/` |
  | Diálogo | `admin-dialog-shell` |
  | Caja | `CajaMovimientoDialog` |
  | Picker | `app-cliente-paciente-picker` |
  | Loading | `LoadingService` |
  | Badges | `.estado-badge` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips completos

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos de datos.
- [ ] Compilación local exitosa (`npm run build`) — registrar en tasks.
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | revertir commit feature / quitar ruta menú |
| Rules RTDB incorrectas | revertir `database.rules.json`; redeploy database solo con Luis |
| Saldo denormalizado inconsistente | recalcular desde visitas (fuente de verdad); limpiar campo opcional |
| Doble cobro | baja lógica movimiento + ajustar visita; no borrar histórico |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only database   # rules Visitas
# NO Resend / NO secrets correo
```

Autorización: Luis pidió commit + push + deploy hosting (+ database si cambian).

---

## Riesgos

- Staff olvida usar ticket y cobra 1:1 → documentar convivencia.
- Portal sin índice → `.indexOn` cliente_id/paciente_id/fecha/estado.
- Vacuna→recordatorio deferred si el sprint se alarga.
