# Tasks: Permisos RTDB granulares

**Spec:** `specs/008-rtdb-permisos-granulares/spec.md`  
**Plan:** `specs/008-rtdb-permisos-granulares/plan.md`  

---

## Implementación

- [x] Spec/plan creados
- [x] `database.rules.json` actualizado (writes por rol + fallback)
- [x] Index aditivo `cliente_id` en Mascota
- [ ] `firebase deploy --only database` — **pendiente autorización / smoke**

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA: N/A UI; validación rules JSON + matriz documentada
- [x] `npm run build` — ver registro abajo
- [x] Live preview :4200 vivo (sin cambio UI en esta feature)
- [x] Deploy database **no** ejecutado (preferencia segura)

### Tabla de resultados

| Ítem | Resultado |
|------|-----------|
| JSON rules válido | OK |
| Matriz roles documentada | OK |
| Fallback sin staffRole | Documentado / implementado |
| Rules unit tests | No existen en repo — plan en plan.md |
| Deploy database | Pendiente |

### Plan de prueba manual post-deploy

Ver `plan.md` § Plan de prueba.

---

## Resultado build

```
npm run build → exit 0 (2026-08-26)
```

Deploy database: **pendiente** (no ejecutado).
