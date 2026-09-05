# Decisiones pendientes de Luis — consolidación 048 / 049 / 050

**Fecha:** 2026-09-04  
**Contexto:** las specs `048-modo-operacion-guiado`, `049-hub-operacion-menu` y `050-unificacion-cobro` (todas del 2026-08-28) quedaron `in_progress` con el código mayormente implementado y sin decisión de cierre. Las tres son piezas del mismo objetivo (operación de recepción/mostrador) que ya cubre esta spec 054, por lo que se marcan **`superseded → 054`** y su cierre se decide aquí. Las carpetas se conservan como referencia (spec / plan / tasks).

## Qué entregó cada una (resumen)

| Spec | Alcance | Estado del código |
|------|---------|-------------------|
| **048** Modo operación guiado | Hints paso a paso (`app-flow-hint`) en CRUD clínico (clientes, pacientes, citas) + aviso en POS de que vender descuenta inventario (`registrarSalida`, categoría `venta_producto`) | Implementado; sin RTDB ni functions |
| **049** Hub operación y menú 3 mundos | Hub en `/admin/inicio` (Clínica · Mostrador · Inventario/Admin + pendientes por cobrar); menú agrupado en `admin-main-layout` | Implementado; sin RTDB ni functions |
| **050** Unificación de cobro | Un solo camino: «Agregar al ticket del día» en módulos clínicos; ocultar cobro directo en caja (`bloquearCobroDirectoEnCaja`) | Implementado (solo UI); tests 039/040/046 |

## Decisiones que solo Luis puede tomar

1. **¿Se aceptan como `done` tal cual?** Los tres bloques funcionan en el código actual; falta que Luis valide en uso real de recepción que los hints (048), el hub/menú (049) y el cobro único (050) no estorban el flujo diario. Si sí → marcar el ítem 3 de `CIERRE.md` como cumplido.
2. **050 — ¿eliminar por completo el cobro directo en caja desde baños/citas/historiales/pensión?** Hoy está *oculto* por flag; borrar el código legacy es un paso irreversible que requiere confirmación.
3. **049 — ¿el hub reemplaza al dashboard dueño (025) como pantalla inicial para todo el staff, o solo para recepción?**  
   **Cerrada 2026-09-04 (spec 072 / Luis, Fase 4):** el hub **Hoy** es la home de vet/recepción/peluquero. Owner-dash (ingresos, meta, tops) **solo admin/dueño**. Conviven en `/admin/inicio` para admin; el resto no ve KPIs de negocio.
4. **048 — ¿los hints se muestran siempre o se pueden ocultar por usuario?**  
   **Cerrada 2026-09-04 (spec 072 / Luis, Fase 4):** se ocultan con «No volver a mostrar» en **localStorage** (`kz-flow-hint:{id}`). L2, sin `Katzen/Usuarios`. No es preferencia compartida entre estaciones.

## Cómo cerrar

- Al recibir respuesta de Luis, anotar aquí la decisión con fecha y actualizar `CIERRE.md` ítem 3.
- Cualquier cambio de código derivado se ejecuta como **L2** (solo UI) o **L3** (si toca RTDB) según `.cursor/rules/sdd-workflow.mdc`, dentro de esta spec 054; no reabrir 048/049/050.
