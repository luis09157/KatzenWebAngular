# Plan técnico: Interconexión de módulos

**Spec:** `specs/031-interconexion-modulos/spec.md`  
**Estado:** approved  

---

## Resumen

Cerrar 6 enlaces de alto ROI sin mega-refactor: (1) prefill baño desde defaults+plantillas, (2) atajos expediente con IDs, (3) cita→caja, (4) stock→OC + KPIs clickables, (5) portal pensión/recordatorios, (6) FCM token registration robusto. Reglas RTDB solo aditivas en `Pension/Estancias` para lectura client.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/finanzas/banio-prefill.util.ts` | crear | resolver costo/precio |
| `src/app/banios/banio-dialog.component.ts` | modificar | await defaults + plantillas |
| `src/app/finanzas/finanzas.component.*` | modificar | select plantilla por tamaño; hint margen |
| `src/app/pacientes/pacientes.component.*` | modificar | acciones rápidas |
| `src/app/pacientes/banios-paciente.component.*` | modificar | pasar `cliente_id` |
| `src/app/citas/citas.component.*` + service | modificar | registrar en caja |
| `src/app/citas/citas.module.ts` | modificar | CajaDialogModule |
| `src/app/shared/admin/admin-stat-card.*` | modificar | `link` + RouterModule |
| `src/app/dashboard/dashboard.component.html` | modificar | links KPIs |
| `src/app/inventario/ordenes/*` | modificar | prefill producto |
| `src/app/inventario/alertas/*` | modificar | atajo OC |
| `src/app/inventario/productos/*` | modificar | atajo OC stock bajo |
| `src/app/inventario/movimientos/*` | modificar | link producto |
| `src/app/portal/*` | modificar | pensión + recordatorios |
| `src/app/core/services/portal-fcm.service.ts` | modificar | SW ready + getToken |
| `src/app/finanzas/caja.service.ts` | modificar | refuerzo ingresos pensión |
| `database.rules.json` | modificar | Pension client read |
| `src/app/core/testing/mock-data.ts` | modificar | mocks portal |
| `cypress/e2e/portal-pension-smoke.cy.ts` | crear | smoke |

### Firebase

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | lectura client Pension/Estancias |

### Cypress

| Archivo | Acción |
|---------|--------|
| `portal-pension-smoke.cy.ts` | guest + auth skip |

---

## Modelo de datos

```text
Katzen/Citas/{id}
  cajaMovimientoId?: string   # aditivo

Katzen/Finanzas/DefaultsBanioPorTamano
  pequeno|mediano|grande:
    costoDefault, precioSugerido?, plantillaCostoId?

Katzen/Pension/Estancias/{id}
  # sin campos nuevos; rules read client
```

---

## Flujos

### Prefill baño

1. Cargar defaults + plantillas en paralelo
2. Al elegir tamaño → `resolverPrefillBanioPorTamano`
3. Si plantilla ligada o fallback `tipoServicio=banio` → costo/precio > 0
4. Si nada → hint, dejar vacíos (no 0)

### Expediente → cita

1. Abrir `CitaDialog` con `cita: { cliente_id, paciente_id, paciente, nombreCliente }`
2. Guardar vía `CitasService.guardarCita`

### Cita → caja

1. Menú si `completada` && !`cajaMovimientoId`
2. `CajaMovimientoDialog` categoría `consulta` + `citaId`
3. `update` RTDB `cajaMovimientoId`

### Errores esperados

| Caso | Mensaje |
|------|---------|
| Sin defaults baño | Hint en form; no bloquear alta |
| Push sin VAPID / permiso | Mensajes existentes PortalFcmStatus |
| Portal pensión sin datos | Empty state |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Citas.cajaMovimientoId` | opcional | no | aditivo |
  | `Pension/Estancias` rules | lectura client | no | mirror Banios |
  | DefaultsBanio `plantillaCostoId` | UI + persist | no | ya en modelo |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales

- **Estrategia de Datos de Prueba:** mocks locales; localhost / emuladores.

- **Patrones UI Reutilizados:** ADMIN-UI, picker, empty states, panel-search, portal list section.

  - [x] Sin librerías UI externas
  - [x] Chips completos

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos
- [ ] Compilación local `npm run build`
- [x] Rollback: revert commit + redeploy hosting/rules solo con Luis

| Escenario | Rollback |
|-----------|----------|
| Rules Pension mal | Revertir `database.rules.json` |
| UI rompe build | Revertir archivos feature |
| FCM token falla | Solo Angular; functions FCM intactas |

---

## Deploy

```bash
npm run build
# hosting (autorizado Luis)
firebase deploy --only hosting
# database solo si rules Pension
firebase deploy --only database
# FCM functions: NO salvo fix real
```

---

## Riesgos

- Dual `idCliente`/`cliente_id` en query Pension portal (usar mismo patrón Banios).
- `guardarCita` usa `.set` completo: vincular caja solo con `.update`.
