# Plan técnico: Modal portal instantáneo en landing

**Spec:** `specs/060-modal-portal-instantaneo/spec.md`  
**Estado:** approved  

---

## Resumen

Pintar el overlay de login portal **de forma síncrona** en el click (`showPortalLoginModal = true`) y mover `enterIfRememberedSession()` a un fire-and-forget posterior. Así el usuario no espera `waitForAuthUser` (timeout 4 s) ni `syncMyClaims`. Sin cambios de Auth, RTDB ni copy.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/landing/landing.component.ts` | modificar | `openPortalLogin()` sincrónico; auto-entrada en background |
| `specs/060-modal-portal-instantaneo/*` | crear | spec / plan / tasks |
| `specs/README.md` | modificar | índice 060 |

### Firebase

Sin cambios.

### Cypress

Sin ruta admin nueva; no Cypress obligatorio.

---

## Modelo de datos

Sin cambios RTDB.

---

## Flujos

### Flujo principal (sin sesión)

1. Usuario clic «Portal Clientes».
2. Overlay visible de inmediato.
3. `enterIfRememberedSession()` corre en background, retorna `false`.
4. Formulario usable.

### Flujo sesión recordada

1. Clic → overlay inmediato.
2. Background: Auth asienta → `syncMyClaims` → navega a `/portal/mascotas`.
3. Overlay se cierra al entrar (o al destruir la landing).

### Errores esperados

| Caso | Comportamiento |
|------|----------------|
| Auth lento / timeout | Overlay ya visible; formulario usable |
| `enterIfRememberedSession` lanza | Catch silencioso; formulario sigue |

---

## Servicios

- `PortalAuthService.enterIfRememberedSession()` — se llama **después** de pintar, no se modifica su contrato.
- `AuthService.waitForAuthUser` — **no se toca**.

---

## UI

- Overlay landing existente (`.portal-modal`).
- No MatDialog. No `mat-dialog-title`.
- Staff: `routerLink="/admin/login"` sin cambio.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | ninguna | no | solo orden de pintado UI |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (N/A)

- **Estrategia de Datos de Prueba:** localhost `:4200`, sin RTDB producción. Smoke del overlay sin credenciales.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Overlay portal landing | `landing.component.html` `.portal-modal` |
  | Auto-entrada sesión | `PortalAuthService.enterIfRememberedSession` |
  | Login staff landing | `routerLink="/admin/login"` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado (no aplica admin-dialog; no `mat-dialog-title`)
  - [x] Chips/badges N/A

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build` exit 0, 2026-08-31).
- [x] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Overlay no abre | Revertir `openPortalLogin` en `landing.component.ts` |
| Auto-entrada con remember se pierde | Restaurar `await enterIfRememberedSession()` **después** de pintar (nunca antes) |
| UI rompe build | Revertir el archivo de la feature |

---

## Deploy

Solo hosting cuando Luis lo autorice. Este ticket **no** despliega.

```bash
npm run build
# firebase deploy --only hosting   # solo con autorización explícita
```

---

## Riesgos

- Visitante con sesión portal ve el form un instante y luego redirige (aceptable; mejor que 4 s en blanco).
- No tocar `waitForAuthUser`: el timeout de 4 s sigue existiendo para guards/login, no para pintar el modal.
