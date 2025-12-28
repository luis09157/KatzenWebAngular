# 🧪 Guía de Testing - Sistema de Historiales Clínicos

## 📋 Índice
1. [Tests Unitarios (Jasmine/Karma)](#tests-unitarios)
2. [Tests E2E (Cypress)](#tests-e2e)
3. [Tests de Integración](#tests-de-integración)
4. [Checklist de Validación Manual](#checklist-manual)

---

## 🔬 Tests Unitarios (Jasmine/Karma)

### Ejecutar todos los tests unitarios

```bash
npm test
```

### Ejecutar tests específicos

```bash
# Solo tests del servicio de historiales
npm test -- --include='**/historiales.service.spec.ts'

# Solo tests del componente de diálogo
npm test -- --include='**/historial-dialog.component.spec.ts'
```

### Tests Implementados

#### ✅ HistorialesService
- **Ordenamiento de historiales**
  - Ordena por fecha descendente (más reciente primero)
  - Maneja historiales sin fecha_registro usando created_at
  - Filtra historiales inactivos
  
- **Creación de historiales**
  - Crea historial con fecha_registro proporcionada
  - Usa fecha actual si no se proporciona
  
- **Búsqueda de historiales**
  - Busca en todos los campos relevantes
  - Búsqueda case-insensitive

#### ✅ HistorialDialogComponent
- **Inicialización del formulario**
  - Inicializa con valores por defecto
  - Establece fecha y hora actual
  - Carga información del paciente
  - Carga lista de doctores
  
- **Validación del formulario**
  - Requiere campos obligatorios
  - Valida formulario completo
  
- **Manejo de fecha y hora**
  - Genera arrays de horas (0-23) y minutos (0-59)
  - Formatea fecha correctamente al guardar (YYYY-MM-DD HH:MM:SS)
  - Elimina campos temporales (hora, minuto)
  
- **Carga de historial existente**
  - Parsea fecha y hora correctamente sin conversión UTC
  - Carga todos los campos del historial
  
- **Guardado de historiales**
  - Previene múltiples guardados simultáneos
  - No guarda si el formulario es inválido

### Cobertura Esperada

```
Statements   : 85% ( 150/176 )
Branches     : 75% ( 45/60 )
Functions    : 80% ( 32/40 )
Lines        : 85% ( 145/170 )
```

---

## 🌐 Tests E2E (Cypress)

### Ejecutar tests E2E

```bash
# Abrir Cypress en modo interactivo
npx cypress open

# Ejecutar en modo headless
npx cypress run

# Ejecutar test específico
npx cypress run --spec "cypress/e2e/historial-fecha-hora.cy.ts"
```

### Tests E2E Implementados

#### ✅ Crear Historial Clínico
- Crea historial con fecha y hora personalizadas
- Valida campos requeridos
- Verifica mensaje de éxito

#### ✅ Ordenamiento de Historiales
- Verifica orden descendente (más reciente primero)
- Compara fechas entre historiales consecutivos

#### ✅ Editar Historial
- Carga correctamente fecha y hora al editar
- Mantiene hora sin conversión de zona horaria

#### ✅ Validación de Hora sin Conversión UTC
- Guarda exactamente 13:50 (no 19:50)
- Verifica en consola los logs
- Valida que no hay conversión UTC

---

## 🔗 Tests de Integración

### Escenarios de Prueba

#### 1. Flujo Completo: Crear → Listar → Editar → Eliminar

```typescript
// Test manual o automatizado
describe('Flujo completo de historial', () => {
  it('debe completar el ciclo de vida del historial', () => {
    // 1. Crear historial con fecha 2025-12-28 13:50:00
    // 2. Verificar que aparece en lista
    // 3. Verificar que está primero (más reciente)
    // 4. Editar y cambiar fecha a 2025-12-20 10:00:00
    // 5. Verificar que ya no está primero
    // 6. Eliminar historial
    // 7. Verificar que no aparece en lista
  });
});
```

#### 2. Zona Horaria

```typescript
describe('Manejo de zona horaria', () => {
  it('debe mantener la hora local sin conversión UTC', () => {
    // 1. Crear historial a las 13:50
    // 2. Guardar en Firebase
    // 3. Recargar desde Firebase
    // 4. Verificar que sigue siendo 13:50 (no 19:50)
  });
});
```

#### 3. Ordenamiento con Múltiples Historiales

```typescript
describe('Ordenamiento correcto', () => {
  it('debe ordenar múltiples historiales correctamente', () => {
    // Crear historiales con fechas:
    // - 2025-12-28 15:30:00
    // - 2025-12-27 10:00:00
    // - 2025-12-28 08:00:00
    // - 2025-12-26 20:00:00
    
    // Orden esperado:
    // 1. 2025-12-28 15:30:00
    // 2. 2025-12-28 08:00:00
    // 3. 2025-12-27 10:00:00
    // 4. 2025-12-26 20:00:00
  });
});
```

---

## ✅ Checklist de Validación Manual

### Fecha y Hora

- [ ] Al abrir diálogo de nuevo historial, fecha es hoy
- [ ] Al abrir diálogo, hora es la hora actual
- [ ] Al abrir diálogo, minuto es el minuto actual
- [ ] Selector de hora muestra 00 a 23
- [ ] Selector de minuto muestra 00 a 59
- [ ] Se puede seleccionar cualquier fecha del calendario
- [ ] Se puede seleccionar cualquier hora
- [ ] Se puede seleccionar cualquier minuto

### Guardado de Historial

- [ ] Guarda con la fecha seleccionada
- [ ] Guarda con la hora seleccionada (sin conversión UTC)
- [ ] Al crear historial a las 13:50, se guarda 13:50 (no 19:50)
- [ ] Al crear historial a las 00:00, se guarda 00:00
- [ ] Al crear historial a las 23:59, se guarda 23:59

### Edición de Historial

- [ ] Al abrir historial existente, muestra fecha correcta
- [ ] Al abrir historial existente, muestra hora correcta
- [ ] Al abrir historial existente, muestra minuto correcto
- [ ] Al editar y guardar, mantiene la fecha/hora si no se cambia
- [ ] Al editar y cambiar fecha/hora, guarda correctamente

### Ordenamiento

- [ ] Historiales se muestran con el más reciente primero
- [ ] Al crear nuevo historial, aparece primero en la lista
- [ ] Al editar fecha de historial antiguo a fecha reciente, se reordena
- [ ] Historiales del mismo día se ordenan por hora
- [ ] Historiales de diferentes días se ordenan por fecha

### Validaciones

- [ ] No permite guardar sin fecha
- [ ] No permite guardar sin hora
- [ ] No permite guardar sin minuto
- [ ] Muestra errores en campos requeridos vacíos
- [ ] Botón "Crear" está deshabilitado si falta algo
- [ ] Botón "Actualizar" está deshabilitado si falta algo

### Interfaz de Usuario

- [ ] Campo de fecha muestra calendario al hacer clic
- [ ] Selector de hora tiene scroll y busca opciones
- [ ] Selector de minuto tiene scroll y busca opciones
- [ ] Formato de hora usa padding (08:00 no 8:0)
- [ ] Íconos están correctamente alineados
- [ ] Diseño responsive funciona en móvil

### Integración con Firebase

- [ ] Fecha se guarda en formato YYYY-MM-DD HH:MM:SS
- [ ] Al recargar página, fecha/hora se mantienen
- [ ] Log de actividades muestra fecha correcta
- [ ] Búsqueda encuentra por fecha

---

## 🐛 Bugs Conocidos Corregidos

### ✅ Bug #1: Conversión de Zona Horaria
**Problema:** Al seleccionar 13:50, se guardaba 19:50 (diferencia de 6 horas).  
**Causa:** `toISOString()` convertía a UTC.  
**Solución:** Construir string de fecha manualmente sin conversión UTC.

### ✅ Bug #2: Ordenamiento Incorrecto
**Problema:** Historiales no se ordenaban correctamente.  
**Causa:** `new Date()` con string causaba conversión de zona horaria.  
**Solución:** Comparar fechas como strings directamente (formato ISO).

### ✅ Bug #3: Hora al Editar
**Problema:** Al editar historial, hora se cargaba incorrectamente.  
**Causa:** Parseo automático de fecha aplicaba zona horaria.  
**Solución:** Parsear manualmente año, mes, día, hora, minuto sin Date.

---

## 📊 Resultados Esperados

### Tests Unitarios
```
✓ HistorialesService
  ✓ Ordenamiento de historiales
    ✓ debe ordenar historiales por fecha descendente (3 specs)
  ✓ Creación de historiales (2 specs)
  ✓ Búsqueda de historiales (2 specs)

✓ HistorialDialogComponent
  ✓ Inicialización del formulario (4 specs)
  ✓ Validación del formulario (2 specs)
  ✓ Manejo de fecha y hora (2 specs)
  ✓ Carga de historial existente (1 spec)
  ✓ Guardado de historiales (2 specs)

Total: 18 specs, 0 failures
```

### Tests E2E
```
✓ Gestión de Historiales Clínicos
  ✓ Crear Historial Clínico
    ✓ debe crear un historial con fecha y hora personalizadas
    ✓ debe validar campos requeridos
  ✓ Ordenamiento de Historiales
    ✓ debe mostrar historiales ordenados por fecha
  ✓ Editar Historial
    ✓ debe cargar correctamente fecha y hora al editar
    ✓ debe mantener la hora seleccionada sin cambios de zona horaria
  ✓ Validación de hora sin conversión UTC
    ✓ debe guardar exactamente 13:50 sin convertir a 19:50

Total: 6 specs, 0 failures
```

---

## 🚀 Comandos Rápidos

```bash
# Ejecutar todo
npm test && npx cypress run

# Solo tests unitarios
npm test

# Solo tests E2E (interactivo)
npx cypress open

# Ver cobertura
npm test -- --code-coverage

# Tests en modo watch
npm test -- --watch
```

---

## 📝 Notas Adicionales

- Los tests asumen que tienes datos de prueba en Firebase
- Para tests E2E, asegúrate de que la app esté corriendo en `localhost:4200`
- Los tests unitarios usan mocks y no necesitan Firebase
- Ajusta las credenciales de login en los tests E2E según tu configuración

---

## ✨ Mejoras Futuras para Testing

- [ ] Agregar tests de performance
- [ ] Implementar tests de accesibilidad
- [ ] Agregar tests de seguridad
- [ ] Crear tests de carga (múltiples historiales)
- [ ] Implementar visual regression testing
- [ ] Agregar mutation testing

---

**Última actualización:** 28 de Diciembre de 2025  
**Versión:** 1.0.0

