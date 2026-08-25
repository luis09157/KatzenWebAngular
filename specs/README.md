# Spec-Driven Development — KatzenVet

Este directorio es la **fuente de verdad** para features y módulos nuevos.

## Estructura

```
specs/
├── memory/
│   ├── constitution.md        # Principios del proyecto
│   └── domain-context.md      # Entidades, reglas de negocio, RTDB (dominio Katzen)
├── AUDIT-CODE.md              # Auditoría técnica viva (hallazgos, gaps, prioridades)
├── ROADMAP.md                 # Plan maestro SDD
├── templates/                 # Plantillas para copiar
│   ├── module-spec.template.md
│   ├── module-plan.template.md
│   ├── module-tasks.template.md
│   └── qa-validation-guide.md # Guía QA exhaustiva (obligatoria al cerrar)
├── 001-baseline/              # Snapshot del producto
└── NNN-nombre-feature/        # Una carpeta por entrega
    ├── spec.md                # QUÉ y POR QUÉ (sin código)
    ├── plan.md                # CÓMO (archivos, RTDB, functions)
    └── tasks.md               # Checklist verificable + testing
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

### 4. Verificar

1. Aplicar **`specs/templates/qa-validation-guide.md`** (formularios, modales, edge cases, build).
2. Registrar resultados en la sección **Testing y validación exhaustiva** de `tasks.md`.
3. Ejecutar la sección **Testing** de `tasks.md` y marcar `[x]` solo con evidencia registrada.

### 5. Cerrar

En `spec.md` cambiar `Estado: draft` → `Estado: done` y fecha.

## Convención de nombres

| Prefijo | Uso |
|---------|-----|
| `001-`, `002-` | Orden cronológico, no semver |
| `kebab-case` | `portal-clientes-usuarios`, `inventario-alertas-email` |

## Specs existentes

| ID | Feature | Estado |
|----|---------|--------|
| 001 | Baseline producto | done |
| 002 | Portal clientes en Usuarios | done |

## Reglas Cursor relacionadas

- `.cursor/rules/sdd-workflow.mdc` — flujo SDD (always apply)
- `.cursor/rules/new-admin-module.mdc` — crear módulos admin
- `.cursor/rules/admin-ui-architecture.mdc` — diseño UI
- `.cursor/rules/angular-firebase.mdc` — Angular + servicios
- `.cursor/rules/cloud-functions.mdc` — Functions
- `.cursor/rules/rtdb-rules.mdc` — Reglas RTDB
