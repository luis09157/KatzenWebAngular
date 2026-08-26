# Spec: Meta de inversión en dashboard dueño

**ID:** 030-meta-inversion-dashboard  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (Luis Alfonso Niño Martínez)  
**Extiende:** 025-metricas-servicios-dashboard  

---

## Problema

El panel `/admin/inicio` muestra un placeholder «Próximamente» en la tarjeta «Meta de inversión». La dueña necesita configurar un monto objetivo y ver el progreso real contra la ganancia acumulada del negocio.

---

## User stories

### US-1 — Meta configurable

Como **dueña / administradora**  
Quiero definir el monto meta de recuperación de inversión  
Para tener una referencia fija en el dashboard.

**Criterios:**

- [x] SC-001: Nodo aditivo `Katzen/Config/inversionMeta` con `montoMeta?`, `updatedAt?`, `updatedBy?`
- [x] SC-002: Diálogo admin para editar meta (solo staff no-client)
- [x] SC-003: Rules RTDB: lectura staff; escritura admin/dueña

### US-2 — Barra de progreso

Como **dueña**  
Quiero ver % de avance vs ganancia neta acumulada  
Para saber cuánto falta para la meta.

**Criterios:**

- [x] SC-004: Progreso = ganancia neta acumulada (caja + refuerzo baños) / meta × 100, cap 100%
- [x] SC-005: UI barra progreso estilo KatzenVet (teal), sin librerías nuevas
- [x] SC-006: Empty/hint si meta no configurada
- [x] SC-007: Mock `MOCK_INVERSION_META` en `mock-data.ts`

---

## Fuera de alcance

- Resend / correo portal
- FCM
- Escritura masiva RTDB legacy

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Config/inversionMeta` | staff | admin staff | aditivo, opcional |
| `Katzen/Caja/Movimientos` | staff | — | ganancia acumulada |
| `Katzen/Banios` | staff | — | refuerzo ingresos |

- **App móvil:** no afectada (nodo Config ignorado).
- **Pruebas:** mocks locales; nunca prod writes.
- **UI:** `app-admin-data-panel`, barra `.owner-meta__*` existente.

---

## UI

| Ruta | Cambio |
|------|--------|
| `/admin/inicio` | Panel meta de inversión funcional + botón configurar |
