# Plan técnico: Permisos RTDB granulares

**Spec:** `specs/008-rtdb-permisos-granulares/spec.md`  
**Estado:** approved  

---

## Resumen

Alinear `.write` de nodos clínicos/inventario/ops con la matriz de `staff-role.config.ts`, usando `auth.token.staffRole` y **fallback** si el claim no existe (compatibilidad móvil).

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | modificar writes + index `cliente_id` en Mascota |
| `specs/AUDIT-CODE.md` | marcar #1 como implementado en repo |
| `specs/ROADMAP.md` | actualizar prioridad |

---

## Contratos de Datos y UI (Obligatorio)

| Nodo / campo | Acción | ¿App móvil afectada? | Notas |
|--------------|--------|----------------------|-------|
| Writes por `staffRole` | restringir | posible si móvil ya envía staffRole incorrecto | fallback sin claim |
| `Mascota.indexOn` + `cliente_id` | aditivo | no | lectura portal legacy |

- [x] Sin eliminar ni renombrar nodos
- [x] Campos nuevos: N/A

**Estrategia de prueba:** validar JSON; plan emulador/rules-unit futuro. Prohibido probar writes destructivos en prod.

**UI:** N/A.

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos de esquema
- [x] Rollback: restaurar `database.rules.json` del commit anterior + `firebase deploy --only database` (solo con auth Luis)
- [x] Deploy database **no automático** — riesgo: staff móvil con `staffRole` raro queda bloqueado en writes

| Escenario | Acción de rollback |
|-----------|-------------------|
| Staff móvil no puede escribir | Revertir rules al commit pre-008 y redeploy database |
| Portal clientes rota lectura | Revertir; lecturas casi sin cambio salvo Mascota `cliente_id` |

---

## Plan de prueba (sin rules-unit en repo)

1. Emulador RTDB o staging: login admin → write historial OK; recepcionista → historial DENIED; peluquero → baño OK / inventario DENIED.
2. Token **sin** `staffRole`: write legacy OK (fallback).
3. Login portal client: lectura propia OK; write clínico DENIED.
4. Tras deploy (cuando Luis autorice): smoke app móvil staff.

---

## Deploy

```bash
# SOLO con confirmación adicional de Luis:
firebase deploy --only database
```

**Estado:** rules en repo; **deploy database pendiente**.

---

## Riesgos

- Alto si móvil usa roles no listados con claim presente.
- Mitigación: fallback + nodos legacy abiertos + deploy diferido.
