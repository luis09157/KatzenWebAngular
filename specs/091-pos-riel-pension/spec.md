# Spec: POS — riel Pensión (enlace al cobro)

**ID:** 091-pos-riel-pension  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2  

---

## Problema

En «Nueva venta» solo había chips Petshop / Consulta / Peluquería. La pensión ya se cobra por **ticket unificado** (agregar a visita, «Por cobrar hoy», categoría `pension` + `descripcionCobroPension` — specs **040**, **050→054**, **089**), pero **no aparecía en el grid POS**, así que recepción no tenía el mismo camino táctil que baño/consulta.

---

## Diagnóstico (antes de codear)

| Camino existente | Dónde |
|------------------|--------|
| Agregar a visita / cobro caja | `pension.component` + `pension-cobro.util` |
| Cola dashboard | `por-cobrar-hoy.util` (pensión ingreso = hoy) |
| Persistencia al cobrar | `VisitasService` marca `pensionId` en estancia |
| POS rieles | Solo 3; catálogo = productos, no estancias |

**Decisión (anti-duplicación 050 / molde 085–086):** cuarto riel **Pensión** que lista estancias activas/finalizadas sin cobro del cliente y al tocar agrega línea `categoria: pension` + `pensionId` + texto de paquete. No inventar productos fake en petshop ni segundo flujo de caja.

---

## User stories

### US-1 — Cobrar pensión desde Nueva venta

Como **recepción / caja**  
Quiero **un chip Pensión en el POS** que muestre estancias por cobrar del dueño  
Para **agregarlas al mismo ticket** sin salir a otro módulo

**Criterios de aceptación:**

- [x] SC-001: Chip **Pensión** en rieles POS; exige dueño + mascota (como consulta/peluquería); mostrador bloqueado.
- [x] SC-002: Lista estancias pendientes del cliente (`pendientes-pension.util`); texto vía `descripcionCobroPension`; línea con `categoria: pension` y `pensionId`.
- [x] SC-003: No hay productos de inventario en el riel pensión; empty state apunta a módulo Pensión / Por cobrar hoy.
- [x] SC-004: Unit tests util + rieles; `npm run build` exit 0.

---

## Fuera de alcance

- Nuevo flujo de cobro / caja paralelo
- Cambiar reglas de «Por cobrar hoy» (sigue filtrando ingreso = hoy)
- Crear estancia desde el POS (solo cobrar existentes)
- Deploy sin OK de Luis

---

## Contratos de Datos y UI

- **RTDB:** solo lectura de `Katzen/Pension/Estancias` + escritura existente al cobrar visita (`pensionId`). Sin nodos nuevos.
- **Pruebas:** mocks / localhost; unit tests util.
- **UI:** mismo grid de cards POS (`pos-card--svc`).

---

## Testing mínimo

Ver `tasks.md`.
