# 🧪 GUÍA DE VALIDACIÓN - App Check

## ✅ MÉTODO 1: Consola del Navegador (2 minutos)

### Paso 1: Abre tu app
```
https://katzen-a0e3e.web.app
```

### Paso 2: Abre la consola
- **Mac:** `Cmd + Option + J`
- **Windows:** `Ctrl + Shift + J`
- **Chrome:** Clic derecho → Inspeccionar → Console

### Paso 3: Busca estos mensajes

#### ✅ SI FUNCIONA:
```javascript
✅ App Check inicializado correctamente
```

#### ❌ SI NO FUNCIONA:
```javascript
⚠️ App Check no inicializado
// o
❌ Error al inicializar App Check: ...
```

---

## ✅ MÉTODO 2: Firebase Console (1 minuto)

### Paso 1: Ve a App Check
```
https://console.firebase.google.com/project/katzen-a0e3e/appcheck
```

### Paso 2: Verifica tu app

**Pestaña "Apps":**
- ✅ katzenvet → Estado: **Registrada**
- ✅ Proveedor: **reCAPTCHA**

**Pestaña "APIs":**
- ✅ Realtime Database: **Aplicado**
- ✅ Cloud Storage: **Aplicado**

### Paso 3: Ver métricas (después de usar la app)
- Gráfica de "Solicitudes verificadas"
- Si ves números > 0 = ✅ Funciona

---

## ✅ MÉTODO 3: Página de Prueba (5 minutos)

He creado una página de prueba: `test-app-check.html`

### Opción A: Desplegarla

```bash
cd /Users/luismartinez/Documents/Katzen/WEB/Angular
cp test-app-check.html dist/katzenvet/
firebase deploy --only hosting
```

Luego abre:
```
https://katzen-a0e3e.web.app/test-app-check.html
```

### Opción B: Probar localmente

```bash
cd /Users/luismartinez/Documents/Katzen/WEB/Angular
python3 -m http.server 8000
```

Abre: `http://localhost:8000/test-app-check.html`

---

## ✅ MÉTODO 4: Prueba de Login Real (El Definitivo)

### 1. Abre tu app:
```
https://katzen-a0e3e.web.app
```

### 2. Abre DevTools (F12) → Network tab

### 3. Filtra por "appcheck"

### 4. Haz login en tu app

### 5. Busca peticiones con:
```
URL: ...appcheck...
Status: 200 OK
```

### 6. En Headers, busca:
```
X-Firebase-AppCheck: [token]
```

Si ves ese header = ✅ App Check funcionando

---

## ✅ MÉTODO 5: Revisar Logs en Firebase

### 1. Ve a Logs
```
https://console.firebase.google.com/project/katzen-a0e3e/logs
```

### 2. Busca eventos de App Check

Si ves logs sin errores de App Check = ✅ Funciona

---

## 🎯 CHECKLIST RÁPIDO

Marca cada uno que pase:

### Configuración:
- [ ] reCAPTCHA creado en Google
- [ ] Clave del sitio en environment.ts
- [ ] Clave secreta en Firebase Console
- [ ] App registrada en Firebase App Check
- [ ] Build y deploy completados

### Verificación:
- [ ] Mensaje en consola: "App Check inicializado"
- [ ] Firebase Console muestra "Registrada"
- [ ] No hay errores en consola del navegador
- [ ] Login funciona correctamente
- [ ] Puedo ver mis datos sin problemas

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "App Check token is invalid"
**Causa:** Clave incorrecta o dominio no autorizado

**Solución:**
1. Verifica que usaste la clave correcta en cada lugar
2. Revisa dominios en: https://www.google.com/recaptcha/admin
3. Asegúrate de que incluyas:
   - `katzen-a0e3e.web.app`
   - `katzen-a0e3e.firebaseapp.com`

### Error: "ReCaptcha not loaded"
**Causa:** Clave del sitio incorrecta en el código

**Solución:**
1. Verifica `environment.prod.ts`
2. Debe ser: `6LdQ-jgsAAAAAPwzjmTm2U-WyZuL96S3Em4wEACA`
3. Haz build y deploy de nuevo

### No veo el mensaje en consola
**Causa:** Solo se ve en producción

**Solución:**
- Asegúrate de estar en `https://katzen-a0e3e.web.app`
- NO funcionará en `localhost` (es normal)

### App Check no aparece en Firebase Console
**Causa:** No está registrado

**Solución:**
1. Ve a: https://console.firebase.google.com/project/katzen-a0e3e/appcheck
2. Haz clic en "Registrar" junto a katzenvet
3. Pega tu clave secreta: `6LdQ-jgsAAAAACREt99YLp8ZI1ilWQx5aElGn9SX`

---

## 📊 RESULTADOS ESPERADOS

### ✅ Todo Funciona Si:
1. No hay errores en consola
2. Puedes hacer login normalmente
3. Ves tus datos sin problemas
4. Firebase Console muestra métricas
5. No ves mensajes de "token invalid"

### ❌ Hay Problema Si:
1. Ves errores de "App Check" en consola
2. No puedes acceder a tus datos
3. Login falla con error de token
4. Mensaje dice "App Check no inicializado"

---

## 🎯 PRUEBA MÁS SIMPLE (30 segundos)

1. Abre: https://katzen-a0e3e.web.app
2. Presiona F12
3. ¿Ves "✅ App Check inicializado"? 
   - SÍ = ✅ Todo bien
   - NO = ❌ Revisar configuración

---

## 📞 AYUDA ADICIONAL

Si algo no funciona, revisa:
1. `SECURITY_AUDIT.md` - Guía de seguridad completa
2. `APP_CHECK_SETUP.md` - Guía de instalación paso a paso
3. Firebase Console → App Check → Ver errores

---

**Última actualización:** 28/12/2025

