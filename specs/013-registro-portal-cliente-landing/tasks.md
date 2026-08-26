# Tasks: Registro portal cliente (admin + landing)

**Spec:** `specs/013-registro-portal-cliente-landing/spec.md`  
**Plan:** `specs/013-registro-portal-cliente-landing/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada
- [x] Plan con Contratos + Mitigación

### Backend

- [ ] Reglas RTDB `PortalRegistroRate`
- [ ] Cloud Function `registerPortalOwner`
- [ ] `npm run functions:build`
- [ ] Function desplegada

### Frontend

- [ ] Auto-provision en `clientes.component` post-alta
- [ ] `FirebaseFunctionsService.registerPortalOwner`
- [ ] ErrorMessagesService contexto
- [ ] Landing form registro + modal
- [ ] UI «Borrar» / loading contextual verificados

### Integración

- [ ] Docs: README, domain-context, ROADMAP, AUDIT
- [ ] Compatibilidad aditiva verificada

---

## Testing

> **Quién ejecuta:** el agente (autónomo).  

- [ ] `npm run build` — exit 0
- [ ] `npm run functions:build`
- [ ] Servidor local :4200 + smoke visual
- [ ] Cypress smoke landing / admin clientes si aplica

**Resultado:** _pendiente_

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [ ] Guía QA completa aplicada
- [ ] `npm run build` OK
- [ ] Live preview :4200 + smoke
- [ ] Tabla de resultados rellenada
- [ ] UI recientes verificadas (loading, Borrar)

### 1. Formularios y validaciones de entrada

- [ ] Campos vacíos bloqueados (admin + landing)
- [ ] Correo inválido rechazado
- [ ] Privacidad obligatoria en landing
- [ ] Chips/badges N/A o OK si aplica

### 2. Interfaz, ventanas y modales

- [ ] Diálogos admin abren/cierran
- [ ] Modal registro landing
- [ ] Loading «Guardando…»
- [ ] Loading no trabado
- [ ] Doble submit bloqueado

### 3. Casos límite

- [ ] Sin Resend → mensaje claro (self)
- [ ] Correo duplicado → already-exists
- [ ] Datos nulos no rompen UI

### 4. Integridad final

- [ ] Build OK
- [ ] :4200 smoke
- [ ] Resultados registrados

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | pendiente | |
| Formularios — tipos erróneos | pendiente | |
| Formularios — límites texto | pendiente | |
| UI — chips estado completos | pendiente | |
| Modales — apertura/cierre | pendiente | |
| UI — diálogos --picker | N/A | |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | pendiente | |
| UI — loading contextual | pendiente | |
| UI — loading no trabado | pendiente | |
| UI — doble submit | pendiente | |
| Edge — red lenta/error | pendiente | |
| Edge — datos nulos RTDB | pendiente | |
| Servidor local :4200 + smoke | pendiente | |
| Build `npm run build` | pendiente | |
| Functions build | pendiente | |

```
# Output builds
```

---

## Criterios spec (SC-xxx)

- [ ] SC-001 … SC-011 (ver spec.md)

---

## Cierre

- [ ] Validación pre-entrega completa
- [ ] `spec.md` → `done`
- [ ] Commit / push / deploy (autorizado overnight)
