# Plan técnico: Perfiles duales y dueñas operativas

**Spec:** `specs/012-perfiles-dual-y-duenas/spec.md`  
**Estado:** approved  

---

## Resumen

Documentar matriz de perfiles; añadir selector `/auth/contexto` post-login para dual; atajos cruzados admin↔portal; callable `linkStaffPortalCliente` + UI de vínculo; completar mapeo mínimo `super_admin`/`dueno` en config. Sin cambios de reglas RTDB.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/auth/contexto-selector.component.*` | crear | UI selector |
| `src/app/auth/auth-routing.module.ts` | modificar | ruta `contexto` |
| `src/app/auth/auth.module.ts` | modificar | declarar componente |
| `src/app/app-routing.module.ts` | modificar | load `auth` |
| `src/app/auth/auth.component.ts` | modificar | dual → contexto |
| `src/app/portal/services/portal-auth.service.ts` | modificar | dual → contexto |
| `src/app/portal/login/portal-login.component.ts` | modificar | manejar dual |
| `src/app/auth/auth.guard.ts` | modificar | no romper dual |
| `src/app/portal/guards/portal-auth.guard.ts` | modificar | no bucles |
| `src/app/layouts/admin-main-layout.*` | modificar | atajo portal |
| `src/app/portal/layout/portal-layout.*` | modificar | atajo admin |
| `src/app/core/config/staff-role.config.ts` | modificar | super_admin |
| `src/app/usuarios/*` | modificar | naming + vincular |
| `src/app/core/services/firebase-functions.service.ts` | modificar | callable |

### Firebase

| Archivo | Acción |
|---------|--------|
| `functions/src/index.ts` | `linkStaffPortalCliente` + map super_admin |
| `database.rules.json` | **sin cambio** |

### Docs

| Archivo | Acción |
|---------|--------|
| `specs/memory/domain-context.md` | matriz perfiles |
| `specs/README.md` | índice 012 |
| `specs/008-…` / `011-…` | notas enlace 012 |

---

## Modelo de datos

```text
Katzen/AuthPerfiles/{uid}
  role: 'staff' | 'client' | 'dual'
  roles?: ['staff','client']
  staffRole?: string
  clienteId?: string          # requerido para dual / client
  activo?: boolean

Katzen/Cliente/{clienteId}
  authUid?: string            # = uid staff si dual
  portalActivo?: boolean

Claims:
  role: staff | client | none
  dualAccess: boolean
  clienteId?: string
  staffRole?: string
```

---

## Flujos

### Post-login dual

1. Login admin o portal → `syncMyClaims`
2. Si staff && client → `/auth/contexto`
3. Elegir Admin → `/admin/inicio` · Portal → `/portal/mascotas`
4. Atajos posteriores navegan directo (sin selector)

### Vincular dual

1. Admin elige staff → “Vincular portal”
2. Selecciona Cliente activo
3. Callable valida y escribe AuthPerfiles + Cliente
4. `syncClaimsForUid` → `dualAccess: true`

### Errores esperados

| Caso | Código / mensaje |
|------|------------------|
| No admin | permission-denied |
| Cliente ya con otro authUid | already-exists |
| Staff sin AuthPerfiles | not-found |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `AuthPerfiles.role` / `roles` / `clienteId` | update aditivo | no — claims dual ya existen | |
  | `Cliente.authUid` / `portalActivo` | update | no | mismo contrato portal |
  | `PortalProvisionLog` | push log | no | solo Functions |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** Cypress admin existente; mocks para dual UI; no RTDB prod exploratoria.
- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Auth cards | `auth.component` / portal-login |
  | Diálogo admin | `admin-dialog-shell` |
  | Loading | `LoadingService` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos.
- [ ] Compilación local (`npm run build`).
- [x] Rollback documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Callable falla mid-update | no crear Auth nuevo; solo updates — revertir campos dual manualmente |
| UI rompe build | revertir commit feature |
| Deploy functions incorrecto | redeploy versión anterior (solo con Luis) |

---

## Deploy

```bash
npm run build
npm run functions:build
firebase deploy --only functions:linkStaffPortalCliente
# sin database si no hay cambio rules
```

---

## Riesgos

- Bucles redirect si guards no distinguen dual → mitigado con `/auth/contexto` fuera de AuthGuard/PortalAuthGuard.
- Cliente con portal propio vinculado a otro uid → callable rechaza.
