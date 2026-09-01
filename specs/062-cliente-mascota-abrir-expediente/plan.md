# Plan técnico: Abrir expediente desde mascota en ficha de cliente

**Spec:** `specs/062-cliente-mascota-abrir-expediente/spec.md`  
**Estado:** approved  

---

## Resumen

En `ClienteDialogComponent` (modo solo lectura) las cards de mascotas vinculadas reciben `(dblclick)` (con `preventDefault`), teclado (Enter/Espacio) y un botón `folder_shared` (mismo patrón que Directorio). El id se resuelve con `id || idPaciente || key`. Si hay id, se cierra el diálogo y se navega a `/admin/paciente?id=…`. Si no hay id, Swal breve (no no-op silencioso). Sin campos RTDB nuevos.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/clientes/cliente-dialog.component.ts` | modificar | Inyectar `Router`; `abrirExpedientePaciente`; keydown |
| `src/app/clientes/cliente-dialog.component.html` | modificar | `(dblclick)`, `(keydown)`, `role`, `tabindex`, tooltip, hint |
| `src/app/clientes/cliente-dialog.component.scss` | modificar | cursor pointer, hover sutil, hint; gap wrap spec 061 |
| `src/app/clientes/clientes-dialog.module.ts` | modificar | `MatTooltipModule` (el diálogo no hereda el del módulo lista) |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/062-cliente-mascota-abrir-expediente/*` | crear |
| `specs/README.md` | índice 062 |
| `specs/058-ficha-directorio-dblclick/spec.md` | nota corta: salto mascota→expediente en 062 |

### Firebase

Sin cambios.

### Cypress

Sin ruta admin nueva; smoke Cypress no obligatorio. Validación: build + smoke localhost.

---

## Modelo de datos

Sin cambios. Se reutiliza:

```text
Katzen/Mascota/{id}   # id ya hidratado en pacientesRelacionados
```

---

## Flujos

### Flujo principal

1. Staff abre ficha de cliente (doble clic en fila `/admin/clientes`, spec 058 SC-006).
2. Sección **Mascotas vinculadas** lista cards con `paciente.id`.
3. Clic en **Ver expediente**, icono carpeta, doble clic en la card, o Enter/Espacio → resolver `id || idPaciente || key` → `router.navigate(['/admin/paciente'], { queryParams: { id } }).then(() => dialogRef.close())`.
4. `pacientes.component` lee `queryParamMap` `id` y abre el expediente (sidebar + tabs).

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin `id` / `idPaciente` / `key` | Swal breve «No se pudo abrir el expediente (falta id)»; no cierra ni navega |
| Sin permiso al módulo paciente | `StaffRoleGuard` existente (fuera de este diff) |

---

## Servicios

- `Router` — navegación admin (el módulo de clientes ya carga rutas admin).
- `PacientesService.getPacientes()` — ya usado; sin query extra.

---

## UI (admin)

- Diálogo existente: `admin-dialog-shell` + layout spec 059.
- Cards: `.mascota-card` clickeable; tooltip + hint.
- Destino: página `admin-page` de pacientes (spec 061 no se toca en esa página).

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo lectura del `id` ya en memoria.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | sin cambio | no | no-op de datos |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura — N/A (cero campos nuevos)

- **Estrategia de Datos de Prueba:** Smoke staff en http://localhost:4200. Prohibido credenciales en repo. Prohibido deploy.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Navegación expediente | `PacienteFichaDialogComponent.abrirExpedienteCompleto()` |
  | Ficha cliente | `ClienteDialogComponent` modo ver |
  | Tooltip | `matTooltip` |
  | Diálogo padding | spec 059 / `cliente-dialog.component.scss` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no se tocan columnas de tabla)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build o navegación | Revertir los 4 archivos de `src/app/clientes/` listados arriba |
| Navegación incorrecta (ficha 058) | Ajustar destino a `/admin/paciente` (no abrir `PacienteFichaDialog`) |
| Card sin id cierra el diálogo | El Swal no cierra; si se cierra por error, restaurar el `return` antes de `close()` |

---

## Deploy

No aplica. Solo hosting futuro si Luis lo pide. Sin functions ni reglas.

```bash
npm run build
# hosting solo si el usuario lo pide
```

---

## Riesgos

- Overlay del diálogo si se cierra antes de navegar: se navega primero y se cierra en el `then`.
- Doble clic accidental: el enlace visible «Ver expediente», hint y tooltip dejan clara la acción; no hay escritura.
- SW cache de `index.html`: cache `katzen-portal-v3` sin precache de `/` ni `/index.html`; fetch no cachea el shell admin.
