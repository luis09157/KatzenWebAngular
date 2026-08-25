# Plan técnico: [Nombre de la feature]

**Spec:** `specs/NNN-nombre-feature/spec.md`  
**Estado:** draft | approved  

---

## Resumen

Un párrafo: enfoque técnico elegido.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/modulo/` | crear | lazy module |
| `src/app/app-routing.module.ts` | modificar | ruta + StaffRoleGuard |
| `src/app/core/config/staff-role.config.ts` | modificar | StaffModule |

### Firebase

| Archivo | Acción |
|---------|--------|
| `functions/src/index.ts` | callable `...` |
| `database.rules.json` | nodo `Katzen/...` |

### Cypress

| Archivo | Acción |
|---------|--------|
| `cypress/e2e/admin-modules-authenticated.cy.ts` | añadir ruta smoke |

---

## Modelo de datos

```text
Katzen/NodoEjemplo/{id}
  campoLegacy: ...        # no tocar
  campoNuevo?: string     # opcional
```

---

## Flujos

### Flujo principal

1. ...
2. ...

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin permiso | permission-denied |

---

## Servicios

- `ModuloService` — lectura RTDB vía `AngularFireDatabase`
- `FirebaseFunctionsService.nuevaCallable()` — si aplica

---

## UI (admin)

- Contenedor: `.modulo-contenedor` en root del componente
- Componentes shared: `app-admin-kpi-grid`, `app-admin-data-panel`, ...
- Diálogo: `ADMIN_DIALOG_FORM` / `ADMIN_DIALOG_DETAIL`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** [Describir qué nodos se leerán/escribirán de forma aditiva. Confirmar que la app móvil no se verá afectada.]

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/...` | añadir campo opcional / nuevo nodo | no / sí — justificar | solo aditivo |

  - [ ] Sin eliminar ni renombrar nodos existentes
  - [ ] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** [Especificar el uso de mocks locales (`src/app/core/testing/mock-data.ts`) para desarrollo. Emuladores Firebase si aplica. Prohibido RTDB producción.]

- **Patrones UI Reutilizados:** [Indicar qué modales, alertas, toasts o componentes de Angular 17 del sistema existente se emplearán.]

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD | `src/app/clientes/` |
  | Diálogo detalle/edición | `admin-dialog-shell`, `ADMIN_DIALOG_*` |
  | Alertas / errores | `ErrorMessagesService`, SweetAlert2 (patrón existente) |
  | Tabla acciones | `.row-actions` + `mat-icon-button` + `matTooltip` |

  - [ ] Sin librerías UI externas
  - [ ] `docs/ADMIN-UI-ARCHITECTURE.md` consultado

---

## Plan de Mitigación y Rollback

- [ ] Verificado que no hay cambios destructivos en contratos de datos.
- [ ] Compilación local exitosa (`npm run build`).
- [ ] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Falla Cloud Function tras crear Auth user | `deleteUser` + limpiar RTDB escrito |
| Reglas RTDB incorrectas | Revertir `database.rules.json`; redeploy solo con autorización de Luis |
| UI rompe build | Revertir commit / archivos de la feature |

---

## Deploy

```bash
npm run build
npm run functions:build
firebase deploy --only functions:nombreFunction
firebase deploy --only database   # si hay reglas nuevas
# hosting solo si el usuario lo pide
```

---

## Riesgos

- ...
