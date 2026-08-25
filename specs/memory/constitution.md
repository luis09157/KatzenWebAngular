# Constitución del proyecto KatzenVet

Principios no negociables. Toda spec, plan e implementación debe respetarlos.

---

## Reglas No Negociables de Seguridad, Datos y UI (Katzen)

1. **Aislamiento Absoluto de Producción:**
   - El agente tiene estrictamente prohibido acceder, conectar, consultar o modificar credenciales, bases de datos o servicios del entorno de producción (`katzen-a0e3e.web.app`).
   - Todo desarrollo, prueba o simulación debe realizarse exclusivamente utilizando Firebase Local Emulators o datos Mock locales.

2. **Compatibilidad Estricta con la App Móvil y RTDB:**
   - Queda prohibido eliminar, renombrar o modificar la estructura de nodos existentes en Firebase Realtime Database que ya consume la aplicación móvil.
   - Cualquier cambio en la base de datos debe ser estrictamente aditivo (crear nuevos nodos o campos opcionales) para garantizar la compatibilidad retroactiva total.

3. **Consistencia Visual y del Sistema de Diseño (UI/UX):**
   - Todos los componentes nuevos (vistas, tablas, formularios, modales, alertas, toasts y diálogos) deben reutilizar estrictamente los patrones de Angular 17 y la arquitectura visual definida en `docs/ADMIN-UI-ARCHITECTURE.md`.
   - Está prohibido introducir librerías de estilos externas o componentes con identidades visuales ajenas al resto del sistema de la veterinaria.

4. **Prohibición de Comandos Destructivos y Deploy:**
   - El agente no tiene permitido ejecutar comandos de despliegue a producción (`firebase deploy`), ni modificar configuraciones globales de infraestructura sin una autorización explícita y manual de **Luis Alfonso Niño Martínez**.

---

## 1. Convivencia con lo existente

- No romper datos ni flujos en producción.
- Campos RTDB nuevos: opcionales; defaults seguros en lectura.
- No migrar masivamente nodos legacy en la misma entrega que una feature UI.
- Clientes portal **no** van en `Katzen/Usuarios`; staff **no** se mezcla con listas de portal.
- Ver también: **Compatibilidad con app móvil** (reglas Katzen arriba).
- Contexto de dominio (entidades, RTDB, reglas implícitas): `specs/memory/domain-context.md`.

## 2. Seguridad y permisos

- Lógica sensible en **Cloud Functions** o reglas RTDB, no solo en Angular.
- Validar rol admin en callables (`isCallerAdmin`).
- Contraseñas temporales: generadas en servidor, nunca retornadas al admin ni guardadas en RTDB.
- Portal: cliente solo lee sus mascotas/datos (`clienteId` en claims).
- Desarrollo y pruebas del agente: **emuladores o mocks** — no producción (reglas Katzen arriba).

## 3. UI Admin unificada

- Seguir `docs/ADMIN-UI-ARCHITECTURE.md` (obligatorio; ver reglas Katzen arriba).
- KPIs + banner + panel + tabla + paginador.
- Acciones: `mat-icon-button` + `matTooltip` dentro de `.row-actions`.
- Celdas `<td>`: **display table-cell**; flex solo en contenedores internos.
- Errores: `ErrorMessagesService.getUserMessage(error, contexto)`.
- Sin librerías UI externas ni estilos fuera del design system.

## 4. Calidad y testing

Toda feature lista para merge debe cumplir:

| Verificación | Cuándo |
|--------------|--------|
| `npm run build` | Siempre |
| `npm run functions:build` | Si toca `functions/` |
| Cypress smoke del módulo | Rutas admin nuevas o cambiadas |
| Probar en localhost / emuladores | Flujo feliz + un error esperado |

Registrar en `tasks.md` de la spec qué tests se ejecutaron.

## 5. Deploy checklist (solo con autorización explícita de Luis)

El agente **no ejecuta** `firebase deploy` por iniciativa propia. Solo documenta los pasos; Luis autoriza y ejecuta (o pide explícitamente al agente que lo haga).

Cuando corresponda deploy a producción:

- [ ] Functions compiladas (`npm run functions:build`)
- [ ] Reglas RTDB revisadas si hay nodos nuevos (`database.rules.json`)
- [ ] Secrets documentados en spec (ej. `RESEND_API_KEY`)
- [ ] Autorización explícita de Luis Alfonso Niño Martínez
- [ ] Verificación post-deploy (`firebase functions:list`, smoke manual)

## 6. Alcance de cambios

- Diff mínimo: solo lo que pide la spec activa.
- Reutilizar servicios y componentes shared antes de crear duplicados.
- Comentarios solo para lógica de negocio no obvia.

## 7. Documentación viva

- Spec en `specs/NNN-feature/` es la fuente de verdad de esa entrega.
- Si el alcance cambia mid-flight: actualizar `spec.md` antes de seguir codeando.
- Handoff UI externo: mantener alineado con `ADMIN-UI-ARCHITECTURE.md`.
