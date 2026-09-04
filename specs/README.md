# Spec-Driven Development — KatzenVet

Este directorio es la **fuente de verdad** para features y módulos nuevos.

## Estructura

```
specs/
├── INDEX.md                   # Índice autogenerado (node scripts/specs-index.mjs)
├── README.md                  # Este archivo: flujo SDD
├── ROADMAP.md                 # Plan maestro
├── AUDIT-CODE.md              # Auditoría técnica viva
├── QA-CRUD-MATRIX.md          # Cierre QA 2026-08-26 (histórico)
├── memory/
│   ├── constitution.md        # Principios del proyecto
│   └── domain-context.md      # Entidades, reglas de negocio, RTDB
├── templates/
│   ├── module-spec.template.md
│   ├── module-plan.template.md      # Solo obligatorio en L3
│   ├── module-tasks.template.md
│   └── qa-validation-guide.md       # Fuente única de la checklist QA
└── NNN-nombre-feature/        # Una carpeta por entrega (ver INDEX.md)
    ├── spec.md                # QUÉ y POR QUÉ (sin código)
    ├── plan.md                # CÓMO (L3: Contratos de Datos + Rollback)
    └── tasks.md               # Checklist + registro de validación
```

## Flujo para un módulo o feature nueva

### 1. Crear spec (humano o IA)

```bash
mkdir -p specs/003-mi-modulo
cp specs/templates/module-spec.template.md specs/003-mi-modulo/spec.md
cp specs/templates/module-plan.template.md specs/003-mi-modulo/plan.md
cp specs/templates/module-tasks.template.md specs/003-mi-modulo/tasks.md
# Editar spec.md con user stories y criterios SC-001, SC-002...
```

### 2. Plan técnico

Completar `plan.md`: rutas, nodos RTDB, servicios, componentes, reglas, functions. Consultar `specs/memory/domain-context.md` para entidades y reglas de negocio existentes.

Usar **Plan Mode** en Cursor (Shift+Tab) y guardar el resultado en `plan.md`.

### 3. Implementar en Cursor

Prompt sugerido:

```
Implementa specs/003-mi-modulo/ siguiendo spec.md y plan.md.
Respeta specs/memory/constitution.md, specs/memory/domain-context.md y AGENTS.md.
Marca tasks.md al avanzar.
```

Adjuntar con `@specs/003-mi-modulo/spec.md`.

### 4. Verificar (la hace el agente, proporcional al nivel)

El agente valida de forma autónoma según el **nivel de cambio** (L1 trivial / L2 feature / L3 datos-infra) definido en `.cursor/rules/sdd-workflow.mdc`. La checklist completa vive **solo** en `specs/templates/qa-validation-guide.md`; `npm run build` siempre; registro en `tasks.md` en L2/L3.

### 5. Cerrar

En `spec.md` cambiar `Estado: draft` → `Estado: done` y fecha — **solo** cuando la validación de su nivel esté registrada. Luego regenerar el índice: `node scripts/specs-index.mjs`.

## Convención de nombres

| Prefijo | Uso |
|---------|-----|
| `001-`, `002-` | Orden cronológico, no semver |
| `kebab-case` | `portal-clientes-usuarios`, `inventario-alertas-email` |

## Specs existentes

Índice completo (número, nombre, estado) **autogenerado** en [`specs/INDEX.md`](INDEX.md). No editarlo a mano; regenerar tras cambiar cualquier `Estado:`:

```bash
node scripts/specs-index.mjs
```

Documentos transversales: [`ROADMAP.md`](ROADMAP.md) (plan maestro) · [`AUDIT-CODE.md`](AUDIT-CODE.md) (auditoría técnica) · [`QA-CRUD-MATRIX.md`](QA-CRUD-MATRIX.md) (cierre 2026-08-26, histórico) · [`054-cierre-sistema/CIERRE.md`](054-cierre-sistema/CIERRE.md) (cierre operable).

## Reglas Cursor relacionadas

- `.cursor/rules/sdd-workflow.mdc` — flujo SDD + niveles L1/L2/L3 (always apply)
- `.cursor/rules/new-admin-module.mdc` — crear módulos admin
- `.cursor/rules/admin-ui-architecture.mdc` — diseño UI (se activa al editar `src/app/**`, `src/styles/**`)
- `.cursor/rules/angular-firebase.mdc` — Angular + servicios
- `.cursor/rules/cloud-functions.mdc` — Functions
- `.cursor/rules/rtdb-rules.mdc` — Reglas RTDB
