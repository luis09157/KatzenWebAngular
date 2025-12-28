# ✅ CHECKLIST DE TESTING - HISTORIALES CLÍNICOS

## 🎯 Tests Manuales Esenciales

Sigue estos pasos para validar que todo funcione correctamente:

---

## 1️⃣ TEST: Crear Historial con Fecha y Hora Personalizadas

### Pasos:
1. Ve a `http://localhost:4200/admin/paciente`
2. Selecciona un paciente (haz clic en cualquier paciente de la lista)
3. Haz clic en el botón **"Nuevo Historial"**
4. En el formulario:
   - **Fecha**: Selecciona una fecha del calendario (ej: 20 de diciembre)
   - **Hora**: Selecciona `13` del dropdown
   - **Minutos**: Selecciona `50` del dropdown
   - Llena todos los campos requeridos (marcados con *)
5. Haz clic en **"Crear"**

### ✅ Resultado Esperado:
- Mensaje de éxito: "Historial clínico creado correctamente"
- El historial aparece en la lista
- **CRÍTICO**: Abre el historial nuevamente (doble clic) y verifica:
  - Hora muestra: **13** (NO debe ser 19)
  - Minutos muestran: **50**

### ❌ Si falla:
- Si la hora muestra 19 en lugar de 13 → Problema de zona horaria

---

## 2️⃣ TEST: Ordenamiento (Más Reciente Primero)

### Pasos:
1. Ve a `http://localhost:4200/admin/paciente`
2. Selecciona un paciente con varios historiales
3. Observa el tab "Historial"

### ✅ Resultado Esperado:
- El historial con fecha MÁS RECIENTE está **ARRIBA**
- Los historiales MÁS ANTIGUOS están **ABAJO**

### Prueba adicional:
1. Crea un nuevo historial con fecha de HOY
2. El nuevo historial debe aparecer **PRIMERO** en la lista

---

## 3️⃣ TEST: Editar Historial sin Perder Hora

### Pasos:
1. Selecciona un paciente
2. Haz **doble clic** en un historial existente
3. Observa los valores de Hora y Minuto
4. **NO CAMBIES NADA**, solo haz clic en "Actualizar"
5. Vuelve a abrir el mismo historial

### ✅ Resultado Esperado:
- Hora y minutos **NO CAMBIAN**
- La fecha se mantiene exactamente igual

---

## 4️⃣ TEST: Validación de Campos Requeridos

### Pasos:
1. Abre el formulario de nuevo historial
2. Intenta hacer clic en "Crear" **SIN LLENAR NADA**

### ✅ Resultado Esperado:
- Botón "Crear" está **DESHABILITADO** (gris, no clickeable)
- Al hacer clic en campos vacíos, muestra errores en rojo

### Campos requeridos que deben validarse:
- [ ] Historia Clínica
- [ ] Diagnóstico Presuntivo
- [ ] Manejo Terapéutico
- [ ] Peso
- [ ] TR
- [ ] Hallazgos
- [ ] Médico que Atendió
- [ ] Fecha
- [ ] Hora
- [ ] Minutos

---

## 5️⃣ TEST: Zona Horaria (El más importante)

### Escenario A: Crear a las 13:50
1. Crea un historial con Hora: **13**, Minutos: **50**
2. Guarda
3. Edita el historial recién creado
4. **VERIFICA**: Debe mostrar Hora: **13**, NO **19**

### Escenario B: Crear a las 23:59
1. Crea un historial con Hora: **23**, Minutos: **59**
2. Guarda
3. Edita
4. **VERIFICA**: Debe mostrar Hora: **23**, NO **05** del día siguiente

### Escenario C: Crear a las 00:00
1. Crea un historial con Hora: **00**, Minutos: **00**
2. Guarda
3. Edita
4. **VERIFICA**: Debe mostrar Hora: **00**, NO **06**

---

## 6️⃣ TEST: Ordenamiento con Múltiples Historiales

### Preparación:
Crea 3 historiales con estas fechas/horas (en este orden):

1. **Historial A**: 27/12/2025 a las 10:00
2. **Historial B**: 28/12/2025 a las 15:30
3. **Historial C**: 27/12/2025 a las 18:00

### ✅ Resultado Esperado (orden en la lista):
```
1º → Historial B (28/12/2025 15:30) ← Más reciente
2º → Historial C (27/12/2025 18:00)
3º → Historial A (27/12/2025 10:00) ← Más antiguo
```

---

## 7️⃣ TEST: Interfaz de Usuario

### Verificar:
- [ ] El calendario (datepicker) se abre al hacer clic en el campo de fecha
- [ ] El dropdown de hora muestra números del 00 al 23
- [ ] El dropdown de minutos muestra números del 00 al 59
- [ ] Los números tienen formato con ceros: "08" no "8"
- [ ] Los iconos se ven correctamente (📅 🕐 ⏱️)
- [ ] En móvil, los campos se apilan verticalmente
- [ ] En desktop, Hora y Minutos están lado a lado

---

## 8️⃣ TEST: Flujo Completo E2E

### Historia de Usuario:
"Como veterinario, quiero registrar una consulta que hice ayer a las 14:30"

### Pasos:
1. Inicia sesión
2. Ve a Pacientes
3. Selecciona "Firulais"
4. Clic en "Nuevo Historial"
5. Selecciona fecha: **AYER**
6. Selecciona hora: **14**
7. Selecciona minutos: **30**
8. Llena:
   - Historia: "El paciente llegó con vómitos"
   - Diagnóstico: "Posible gastroenteritis"
   - Tratamiento: "Dieta blanda y observación"
   - Peso: "25.5"
   - TR: "Normal"
   - Hallazgos: "Leve deshidratación"
   - Médico: Selecciona tu nombre
9. Clic en "Crear"
10. Espera mensaje de éxito
11. Verifica que aparece en la lista
12. Doble clic para editar
13. Verifica que TODO está como lo ingresaste

### ✅ Resultado Esperado:
- Historial creado exitosamente
- Aparece en la lista (segundo o tercero, no primero porque es de ayer)
- Al editarlo, fecha y hora siguen siendo AYER a las 14:30

---

## 🐛 Problemas Comunes y Soluciones

### Problema: "La hora cambia de 13 a 19"
**Causa:** Conversión de zona horaria UTC  
**Solución:** Ya está corregido en el código. Si persiste, verifica la consola del navegador para logs.

### Problema: "Los historiales no se ordenan correctamente"
**Causa:** Error en el ordenamiento  
**Solución:** Ya está corregido. Refresca la página.

### Problema: "No puedo seleccionar una fecha"
**Causa:** Datepicker no cargado  
**Solución:** Verifica que Angular Material está instalado correctamente.

---

## 📊 Checklist Rápido

Marca cada item que funcione correctamente:

### Funcionalidad Básica
- [ ] Puedo abrir el formulario de nuevo historial
- [ ] Puedo seleccionar una fecha del calendario
- [ ] Puedo seleccionar hora (0-23)
- [ ] Puedo seleccionar minutos (0-59)
- [ ] Puedo guardar un historial completo
- [ ] El historial aparece en la lista

### Zona Horaria (CRÍTICO)
- [ ] Hora 13:50 se guarda como 13:50 (NO 19:50)
- [ ] Hora 00:00 se guarda como 00:00 (NO 06:00)
- [ ] Hora 23:59 se guarda como 23:59 (NO 05:59)

### Ordenamiento
- [ ] Historiales se muestran con el más reciente primero
- [ ] Nuevo historial aparece primero si es el más reciente
- [ ] Historiales antiguos aparecen al final

### Validación
- [ ] No puedo guardar sin llenar campos requeridos
- [ ] Botón "Crear" está deshabilitado si falta algo
- [ ] Se muestran errores en campos vacíos

### Edición
- [ ] Puedo abrir historial existente (doble clic)
- [ ] Fecha y hora se cargan correctamente
- [ ] Puedo modificar y guardar cambios
- [ ] Los cambios se reflejan inmediatamente

---

## 🎯 Test de Aceptación Final

### Si estos 3 tests pasan, TODO está funcionando:

1. **Test de Oro 🥇**
   - Crea historial con fecha AYER, hora 13, minuto 50
   - Edita el historial
   - Si muestra 13:50 (no 19:50) → ✅ PASA

2. **Test de Plata 🥈**
   - Crea 3 historiales en orden aleatorio
   - Si se ordenan correctamente (más reciente primero) → ✅ PASA

3. **Test de Bronce 🥉**
   - Intenta crear historial sin llenar nada
   - Si no te deja guardar → ✅ PASA

---

## 📝 Reporte de Bugs

Si encuentras un bug, anota:
1. ¿Qué hiciste?
2. ¿Qué esperabas que pasara?
3. ¿Qué pasó realmente?
4. Captura de pantalla

---

## ✅ Todo Funciona Si...

- ✅ Puedes crear historiales con cualquier fecha y hora
- ✅ La hora que seleccionas es la hora que se guarda (sin conversión UTC)
- ✅ Los historiales se ordenan con el más reciente primero
- ✅ Al editar un historial, la fecha y hora se cargan correctamente
- ✅ No puedes guardar sin llenar los campos requeridos

---

**🎉 Si todos los checkboxes están marcados, ¡el sistema está listo para producción!**

---

Última actualización: 28/12/2025

