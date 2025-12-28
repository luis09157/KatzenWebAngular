# 🔐 GUÍA COMPLETA: Implementar App Check con reCAPTCHA

## 📋 PASO 1: Obtener Claves de reCAPTCHA

### 1. Ve a Google reCAPTCHA:
```
https://www.google.com/recaptcha/admin/create
```

### 2. Llena el formulario:

- **Etiqueta:** `KatzenVet App Check`
- **Tipo:** Selecciona `reCAPTCHA v3`
- **Dominios (uno por línea):**
  ```
  katzen-a0e3e.web.app
  katzen-a0e3e.firebaseapp.com
  localhost
  ```
- Acepta términos y haz clic en **"Enviar"**

### 3. Copia tus claves:

Verás dos claves:
- **Clave del sitio (Site Key):** `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Clave secreta (Secret Key):** `6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`

---

## 📋 PASO 2: Configurar en Firebase Console

### 1. Ve a Firebase App Check:
```
https://console.firebase.google.com/project/katzen-a0e3e/appcheck
```

### 2. Registra tu app:
- Busca **"katzenvet"** (App web)
- Haz clic en **"Registrar"**

### 3. Selecciona reCAPTCHA:
- Proveedor: **reCAPTCHA**
- **Clave secreta:** Pega la `Clave secreta` (la que empieza con 6LcYYY...)
- **Tiempo de token:** `1 día`
- Haz clic en **"Guardar"**

### 4. Activa App Check para tus servicios:
- Ve a la pestaña **"APIs"**
- Activa para:
  - ✅ Realtime Database
  - ✅ Cloud Storage
  - ✅ Authentication

---

## 📋 PASO 3: Actualizar tu Código

### 1. Ya actualicé los archivos:
- ✅ `app.module.ts` - Importado App Check
- ✅ `environment.ts` - Agregado campo para reCAPTCHA
- ✅ `environment.prod.ts` - Agregado campo para reCAPTCHA
- ✅ `app-check.service.ts` - Creado servicio

### 2. SOLO TE FALTA ESTO:

Abre estos archivos y reemplaza `'TU_CLAVE_DEL_SITIO_AQUI'`:

**Archivo: `src/environments/environment.ts`**
```typescript
recaptchaSiteKey: '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'  // ← Pega tu CLAVE DEL SITIO aquí
```

**Archivo: `src/environments/environment.prod.ts`**
```typescript
recaptchaSiteKey: '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'  // ← Pega tu CLAVE DEL SITIO aquí
```

⚠️ **IMPORTANTE:** Usa la **Clave del sitio** (Site Key), NO la clave secreta

---

## 📋 PASO 4: Desplegar

### 1. Construir el proyecto:
```bash
cd /Users/luismartinez/Documents/Katzen/WEB/Angular
npm run build
```

### 2. Desplegar a Firebase:
```bash
firebase deploy
```

---

## ✅ PASO 5: Verificar que Funciona

### 1. Abre tu app:
```
https://katzen-a0e3e.web.app
```

### 2. Abre la consola del navegador (F12)

### 3. Busca el mensaje:
```
✅ App Check inicializado correctamente
```

### 4. Verifica en Firebase Console:
- Ve a: https://console.firebase.google.com/project/katzen-a0e3e/appcheck
- Deberías ver métricas de uso

---

## 🔍 RESUMEN VISUAL

```
1. Google reCAPTCHA
   ↓
   Obtener 2 claves:
   - Site Key (pública) → Va en environment.ts
   - Secret Key (privada) → Va en Firebase Console
   
2. Firebase Console
   ↓
   App Check → Registrar app
   ↓
   Pegar Secret Key
   ↓
   Guardar

3. Tu Código
   ↓
   environment.ts → Pegar Site Key
   ↓
   npm run build
   ↓
   firebase deploy
   
4. ✅ Done!
```

---

## ❓ ¿Qué Clave va Dónde?

| Clave | Dónde | Archivo | ¿Es Pública? |
|-------|-------|---------|--------------|
| **Site Key** (6LcXXX...) | Tu código | `environment.ts` | ✅ Sí |
| **Secret Key** (6LcYYY...) | Firebase Console | - | ❌ No |

---

## 🐛 Solución de Problemas

### Error: "App Check token is invalid"
**Solución:** Verifica que:
- Usaste la clave correcta en cada lugar
- Los dominios en reCAPTCHA coinciden con tu app
- Esperaste 1-2 minutos después de desplegar

### Error: "reCAPTCHA not loaded"
**Solución:**
- Verifica que pegaste la Site Key en environment.ts
- Hiciste build y deploy después de actualizar

### No veo el mensaje de éxito en consola
**Solución:**
- Solo se ve en producción (katzen-a0e3e.web.app)
- No se ve en localhost

---

## 📊 Estado Actual

- ✅ Archivos de código actualizados
- ⚠️ Necesitas: Obtener claves de reCAPTCHA
- ⚠️ Necesitas: Pegar Site Key en environment.ts
- ⚠️ Necesitas: Pegar Secret Key en Firebase Console
- ⚠️ Necesitas: Build y deploy

---

## 🎯 NEXT STEPS (En orden):

1. [ ] Ir a https://www.google.com/recaptcha/admin/create
2. [ ] Crear reCAPTCHA v3 con los dominios
3. [ ] Copiar ambas claves
4. [ ] Pegar Secret Key en Firebase Console
5. [ ] Pegar Site Key en `environment.ts` y `environment.prod.ts`
6. [ ] Ejecutar `npm run build`
7. [ ] Ejecutar `firebase deploy`
8. [ ] Verificar en https://katzen-a0e3e.web.app

---

**Tiempo estimado total: 10-15 minutos**

**Costo: $0 (gratis hasta 1M verificaciones/mes)**

---

¿Tienes alguna duda en algún paso? ¡Pregúntame!

