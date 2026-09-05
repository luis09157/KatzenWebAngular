# Spec: Número de expediente visible en ficha de paciente

**ID:** 068-numero-expediente-visible  
**Estado:** done  
**Fecha:** 2026-09-04  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  
**Nivel:** L2 (UI + util + persistencia aditiva; sin plan.md)

---

## Problema

En `/admin/paciente?id=…` el header muestra el nombre (p. ej. Pucca) pero no un número de expediente legible. El UUID de 36 caracteres de la URL no sirve para que las doctoras se refieran al caso en voz alta o en notas.

Las doctoras **ya capturan** un número de expediente en el Excel que usan hoy para registrar (1 fila = 1 mascota). El PDV (Eleventa) es un sistema aparte y no es fuente de este folio.

## Dónde vive el número

| Sitio | Campo | Qué es |
|-------|--------|--------|
| `Katzen/Cliente.expediente` | dueño | Existe en RTDB y en el diálogo de cliente. **No** es el folio de la mascota. Un dueño puede tener varias mascotas. |
| `Katzen/Mascota.expediente` | mascota | Campo **aditivo** (spec 068). Folio de la clínica / Excel. |
| Excel de registro | columna expediente (fuera del repo) | 1 fila = 1 mascota → el número es de la mascota. **No hay script de import Excel** de clientes/pacientes en este repo (`scripts/pdv-eleventa` es Firebird/PDV y no crea expediente clínico). |
| Fallback | `KV-` + últimos 6 del id | Solo si la mascota no tiene folio capturado. |

## User stories

### US-1 — Ver folio en header y ficha

Como **doctora / recepción**  
Quiero ver el **número de expediente de la mascota** junto al nombre y en la tarjeta de perfil  
Para identificar al paciente sin copiar el UUID

**Criterios de aceptación:**

- [x] SC-001: Header (`app-admin-page-banner`) muestra chip «Expediente …» junto al nombre (capturado o KV).
- [x] SC-002: Tarjeta izquierda y ficha modal muestran el mismo folio. Chip completo (sin clip).
- [x] SC-003: Prioridad 1 = `Mascota.expediente` / `numeroExpediente` capturado (≤20, no UUID). Prioridad 2 = `KV-` + últimos 6 alfanuméricos del id. **No** usar `Cliente.expediente`.
- [x] SC-004: Nunca se renderiza el UUID completo de 36 caracteres. Sin folio almacenado no queda hueco vacío.
- [x] SC-005: Util con unit tests (UUID, id corto, capturado Excel, dueño ignorado, persistir).

### US-2 — Capturar o generar al alta/edición

Como **recepción / doctora**  
Quiero escribir el número que ya usan en Excel, o dejarlo vacío para que se genere  
Para que Pucca y las mascotas migradas muestren **el número que ellas pusieron**

**Criterios de aceptación:**

- [x] SC-006: Diálogo alta/edición de paciente (`paciente-admin-dialog`) tiene «N° de expediente» opcional, hint «Si lo dejas vacío se genera solo (KV-…)».
- [x] SC-007: En modo rápido (`modo: 'rapido'`) el campo va colapsado en «Más datos (opcional)».
- [x] SC-008: Al crear, si hay folio se persiste; si está vacío se persiste el KV derivado del id (estable y buscable). No pisa un capturado. Sin migración masiva de prod.
- [x] SC-009: Al editar, el capturado se guarda; vacío regenera KV. Campo aditivo; app móvil no afectada.

---

## Fuera de alcance

- Migración masiva de mascotas existentes (siguen viendo KV en lectura hasta que se edite o se importe)
- Búsqueda por folio
- Cambiar el `expediente` del dueño (`Katzen/Cliente`)
- Import Excel contra producción (no hay script; cuando exista, mapear la columna a `Mascota.expediente`)
- Deploy / commit

---

## Contratos de Datos (si aplica)

- **RTDB:** campo opcional aditivo `expediente` en `Katzen/Mascota`. Escritura solo al crear/editar paciente. No se toca `Katzen/Cliente.expediente`.
- **App móvil:** campo opcional; ignorar si no lo lee.
- **Rollback:** quitar el campo del diálogo; la UI sigue derivando KV en lectura.
