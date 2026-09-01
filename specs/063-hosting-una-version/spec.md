# Spec: Hosting sin historial de releases (una versión live)

**ID:** 063-hosting-una-version  
**Estado:** done  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

Firebase Hosting de `katzen-a0e3e` acumulaba **cientos** de releases en el canal `live` (historial de UI vieja). Luis no quiere respaldos de deploy de Hosting: el código vive en **git**; Hosting solo debe servir la versión **live**. El historial de Hosting no es el plan de rollback.

Esta spec es una **regla permanente de operaciones**, no un arreglo one-off.

---

## User stories

### US-1 — Una (o el mínimo) versión en Hosting

Como **dueño del proyecto**  
Quiero **que Hosting no acumule releases viejas**  
Para **no pagar ni conservar UI obsoleta como “backup”**

**Criterios de aceptación:**

- [x] SC-001: El canal `live` del sitio `katzen-a0e3e` tiene `retainedReleaseCount` al **mínimo que Firebase permite**. Mínimo real comprobado: **1** (no exige 2).
- [x] SC-002: Tras cada `firebase deploy --only hosting` autorizado, las releases anteriores a la live se **borran**. No se deja historial de UI.
- [x] SC-003: Nunca se borra la versión **actualmente servida**.
- [x] SC-004: `firebase.json` **no** inventa keys de retención. `retainedReleaseCount` es campo del **canal** (API Hosting), no del JSON local. firebase-tools 15.19.1 no expone `hosting:sites:update` ni `hosting:releases:list`; se usa la API REST.

### US-2 — Rollback sin historial de Hosting

Como **operador**  
Quiero **revertir un deploy malo con git + un deploy nuevo**  
Para **no depender del historial de Hosting**

**Criterios de aceptación:**

- [x] SC-005: El plan de rollback documentado es: checkout/revert del commit en git local y `firebase deploy --only hosting` (solo con autorización de Luis). No se usa “rollback a release anterior” de Hosting.

---

## Fuera de alcance

- Cloud Functions, RTDB, Storage, App Hosting
- `git push`
- Canales de preview (`hosting:channel:deploy`) salvo que Luis lo pida
- Inventar keys en `firebase.json` que rompan el deploy

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo configuración del canal Hosting `live` y borrado de versiones de Hosting (archivos estáticos). App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | no | no | sin cambios de contrato RTDB |

- **Estrategia de Datos de Prueba:** N/A (ops Hosting). No conectar a RTDB de producción para esta spec.

- **Patrones UI Reutilizados:** Ninguno. No hay UI Angular.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | N/A (ops; no hay UI) |
| doctor | N/A |
| recepcionista | N/A |

---

## UI (rutas y layout)

Sin cambios de UI. URL de producción sigue siendo https://katzen-a0e3e.web.app

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [x] Hosting: retención canal `live` + borrado de versiones no servidas (API REST `firebasehosting.googleapis.com`)

---

## Testing mínimo

Ver `tasks.md`. Comprobar: `retainedReleaseCount`, listado de releases, que queda 1 (o el mínimo) y que el sitio live responde.

---

## Notas / decisiones

- **Mínimo Firebase:** `retainedReleaseCount: 1` ya estaba en el canal `live` y la API lo acepta. No hace falta 2.
- **La retención no borra el historial existente** de forma retroactiva: había ~297 releases con count=1. Hay que **borrar versiones viejas** (DELETE version) además de dejar el count bajo.
- **CLI vigente (firebase-tools 15.19.1):** no hay `firebase hosting:releases:list` ni `firebase hosting:sites:update`. Equivalente:
  - Listar: `GET .../sites/katzen-a0e3e/channels/live/releases`
  - Retención: `PATCH .../sites/katzen-a0e3e/channels/live` con `retainedReleaseCount`
  - Borrar: `DELETE .../sites/katzen-a0e3e/versions/{versionId}` (no borrar la versión live)
- Token: `gcloud auth print-access-token` + header `x-goog-user-project: katzen-a0e3e` (ADC exige quota project).
- Rollback: el código sigue en git; Hosting no es backup.
