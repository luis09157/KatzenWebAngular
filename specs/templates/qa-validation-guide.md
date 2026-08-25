# Guía de Pruebas y Validación Exhaustiva — KatzenVet

**Uso:** Cursor y agentes IA deben aplicar esta guía **antes de marcar como completada** cualquier tarea, componente o vista de una feature SDD.

**Referencia en specs:** copiar la sección **Testing y validación exhaustiva** de `module-tasks.template.md` al `tasks.md` de cada feature y registrar ahí los resultados.

**Entorno:** localhost, emuladores Firebase o mocks locales — **nunca** producción (`katzen-a0e3e`). Ver `specs/memory/constitution.md`.

---

## Rol del agente

Actúa como un **Ingeniero de QA Senior** y desarrollador riguroso. Antes de dar por completada cualquier tarea, componente o vista de la feature activa, debes **diseñar, simular y verificar** un set exhaustivo de pruebas que cubra los escenarios obligatorios descritos abajo.

No marques `[x]` en `tasks.md` hasta haber ejecutado (o simulado con evidencia) cada ítem aplicable y **registrado el resultado** en la sección correspondiente de `tasks.md`.

---

## 1. Pruebas de formularios y validaciones de entrada

### 1.1 Campos vacíos

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Envío con campos obligatorios vacíos | El sistema **bloquea** el envío |
| Retroalimentación visual | Bordes rojos, `mat-error` o mensajes claros en campos requeridos |
| Ejemplos típicos | Nombre de mascota, propietario, datos clínicos, fechas, selects obligatorios |

**Cómo probar:** intentar guardar/enviar el formulario sin completar cada campo obligatorio, uno por uno y todos a la vez.

### 1.2 Datos incorrectos / tipos erróneos

| Escenario | Qué observar |
|-----------|--------------|
| Letras en campos numéricos | Edad, peso, dosis, cantidades — debe rechazar o sanitizar |
| Símbolos extraños | `<script>`, emojis masivos, caracteres de control |
| Correo inválido | `usuario@`, `@dominio`, espacios |
| Teléfono inválido | Letras, longitud incorrecta, prefijos mal formados |

**Cómo probar:** ingresar valores inválidos en cada tipo de campo y confirmar que la validación impide persistir datos corruptos.

### 1.3 Límites y desbordamientos

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Textos extremadamente largos | Notas, diagnósticos, observaciones (500+ caracteres) |
| Diseño responsivo | No rompe layout, tablas ni modales; scroll interno si aplica |
| Truncamiento | Si hay límite de caracteres, se muestra contador o error antes de guardar |

---

## 2. Pruebas de interfaz, ventanas y modales

### 2.1 Apertura y cierre de diálogos

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Abrir modal / diálogo | Se muestra correctamente (`admin-dialog-shell` en admin) |
| Cerrar con X, Cancelar, backdrop (si aplica) | Cierra limpiamente |
| Tras cerrar | **No** queda scroll lock ni backdrop colgado |
| Múltiples aperturas consecutivas | Sin acumulación de overlays |

**Componentes típicos:** formularios flotantes, confirmaciones de borrado, alertas Material.

### 2.2 Retroalimentación visual

| Tipo | Criterio de éxito |
|------|-------------------|
| Éxito | Toast/snackbar verde o mensaje según arquitectura UI (`ErrorMessagesService`, Material snackbar) |
| Error | Mensaje en tiempo y lugar correctos; contexto claro para el usuario |
| Timing | Aparece tras la acción, no antes ni duplicado |

### 2.3 Prevención de doble submit

| Qué verificar | Criterio de éxito |
|---------------|-------------------|
| Primer clic en acción principal | Botón se **deshabilita** o muestra estado de carga (`mat-spinner`, `[disabled]`) |
| Clics rápidos repetidos | **Un solo** registro/actualización en Firebase (mock o emulador) |
| Botones afectados | "Guardar", "Registrar", "Confirmar cita", etc. |

---

## 3. Casos límite (edge cases) y errores de red

### 3.1 Red lenta o pérdida de conexión

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Guardado con latencia simulada | UI muestra loading; no permite doble envío |
| Timeout / error de red | Mensaje de error comprensible; datos del formulario no se pierden sin aviso |
| Reintento | Usuario puede reintentar sin recargar toda la página |

**Cómo simular:** DevTools → Network → Slow 3G / Offline; o mocks de servicio que rechacen con `Observable` error.

### 3.2 Datos nulos o indefinidos desde Firebase

| Escenario | Criterio de éxito |
|-----------|-------------------|
| Nodo inexistente | Vista muestra estado vacío o mensaje, **no** pantalla en blanco |
| Propiedades opcionales ausentes | Sin `TypeError: Cannot read property 'x' of undefined` |
| Lista vacía | Tabla/lista con empty state, no crash de Angular |

**Cómo probar:** mocks con `{}`, `null`, arrays vacíos y objetos parciales (campos legacy omitidos).

---

## 4. Verificación de integridad final

### 4.1 Compilación TypeScript (obligatorio)

```bash
npm run build
```

| Criterio | Obligatorio |
|----------|-------------|
| Exit code 0 | Sí |
| Sin errores de tipado | Sí |
| Reportar en `tasks.md` | Sí — pegar resumen o confirmar OK |

Si también se modificaron Cloud Functions:

```bash
npm run functions:build
```

### 4.2 Registro en `tasks.md` (obligatorio antes de `[x]`)

Antes de marcar cualquier tarea de implementación o testing como completada:

1. Completar la sección **Testing y validación exhaustiva** en el `tasks.md` de la feature.
2. Anotar por escenario: **OK**, **N/A** (con motivo) o **FALLO** (con descripción).
3. Pegar output relevante de `npm run build` (o enlace a CI).
4. Solo entonces marcar `[x]`.

**Plantilla de registro:**

```markdown
### Resultados QA — [fecha o iteración]

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK / N/A / FALLO | ... |
| Formularios — tipos erróneos | OK / N/A / FALLO | ... |
| Formularios — límites texto | OK / N/A / FALLO | ... |
| Modales — apertura/cierre | OK / N/A / FALLO | ... |
| UI — retroalimentación | OK / N/A / FALLO | ... |
| UI — doble submit | OK / N/A / FALLO | ... |
| Edge — red lenta/error | OK / N/A / FALLO | ... |
| Edge — datos nulos RTDB | OK / N/A / FALLO | ... |
| Build `npm run build` | OK / FALLO | exit code, errores si hay |
```

---

## 5. Cypress y pruebas E2E (cuando aplique)

Además de la validación manual/mockeada:

- [ ] `npm run cy:admin` — si la feature tocó rutas admin
- [ ] Spec E2E específico en `cypress/e2e/` — si se añadió o modificó

Documentar resultado en la sección **Testing** de `tasks.md`.

---

## 6. Checklist rápido para el agente

Antes de responder "tarea completada" al usuario:

- [ ] Leí esta guía (`specs/templates/qa-validation-guide.md`)
- [ ] Probé (o simulé con mocks) formularios, modales y edge cases **aplicables** a la feature
- [ ] Ejecuté `npm run build` y reporté resultado
- [ ] Registré resultados en `tasks.md` de la feature
- [ ] Marqué `[x]` solo en ítems verificados
- [ ] No usé datos ni servicios de producción

---

## Referencias

- `specs/templates/module-tasks.template.md` — checklist ejecutable por feature
- `.cursor/rules/sdd-workflow.mdc` — flujo SDD e integración al cierre
- `docs/ADMIN-UI-ARCHITECTURE.md` — patrones UI admin (modales, tablas, feedback)
- `AGENTS.md` — comandos y restricciones del proyecto
