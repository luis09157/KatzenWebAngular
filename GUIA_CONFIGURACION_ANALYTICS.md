# 📊 GUÍA COMPLETA DE CONFIGURACIÓN DE ANALYTICS

## 🎯 OBJETIVO
Configurar Google Analytics 4, Google Tag Manager y Microsoft Clarity para medir el desempeño de tu landing page y optimizar conversiones.

---

## 📋 TABLA DE CONTENIDO
1. [Google Analytics 4 (GA4)](#1-google-analytics-4-ga4)
2. [Google Tag Manager (GTM)](#2-google-tag-manager-gtm)
3. [Microsoft Clarity](#3-microsoft-clarity)
4. [Verificación de Tracking](#4-verificación-de-tracking)
5. [Eventos Trackeados](#5-eventos-trackeados)
6. [Dashboards Recomendados](#6-dashboards-recomendados)

---

## 1️⃣ GOOGLE ANALYTICS 4 (GA4)

### 📝 Paso 1: Crear Cuenta de GA4

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Haz clic en **"Administrar"** (ícono de engranaje abajo a la izquierda)
3. Haz clic en **"Crear propiedad"**
4. Completa los datos:
   - **Nombre de la propiedad:** KatzenVet Landing Page
   - **Zona horaria:** (GMT-06:00) Ciudad de México
   - **Moneda:** Peso mexicano (MXN)
5. Haz clic en **"Siguiente"**
6. Selecciona tu sector: **Salud y Bienestar**
7. Selecciona el tamaño: **Pequeña (1-10 empleados)**
8. Selecciona objetivos: **Generar leads**, **Medir la interacción de los usuarios**
9. Haz clic en **"Crear"**

### 📝 Paso 2: Crear Flujo de Datos Web

1. En la configuración de la propiedad, haz clic en **"Flujos de datos"**
2. Haz clic en **"Web"**
3. Completa:
   - **URL del sitio web:** https://katzen-a0e3e.web.app/
   - **Nombre del flujo:** KatzenVet Website
4. Haz clic en **"Crear flujo"**
5. **COPIA el ID de medición** (formato: `G-XXXXXXXXXX`)

### 📝 Paso 3: Configurar en tu Proyecto

1. Abre el archivo `/src/index.html`
2. Busca la línea:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```
3. Reemplaza **G-XXXXXXXXXX** con tu ID de medición **EN 2 LUGARES**:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-TU-ID-AQUI"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-TU-ID-AQUI', {
       'cookie_flags': 'SameSite=None;Secure',
       'send_page_view': true
     });
   </script>
   ```

### ✅ Paso 4: Verificar Instalación

1. Compila el proyecto: `ng build`
2. Despliega a Firebase: `firebase deploy --only hosting`
3. Ve a Google Analytics -> **Informes** -> **Tiempo real**
4. Abre tu sitio en otra pestaña
5. Deberías ver **1 usuario activo en tiempo real** ✅

---

## 2️⃣ GOOGLE TAG MANAGER (GTM)

### 📝 Paso 1: Crear Cuenta de GTM

1. Ve a [Google Tag Manager](https://tagmanager.google.com/)
2. Haz clic en **"Crear cuenta"**
3. Completa:
   - **Nombre de la cuenta:** KatzenVet
   - **País:** México
   - **Nombre del contenedor:** katzen-a0e3e.web.app
   - **Plataforma de destino:** Web
4. Acepta los términos
5. **COPIA el ID del contenedor** (formato: `GTM-XXXXXXX`)

### 📝 Paso 2: Configurar en tu Proyecto

1. Abre el archivo `/src/index.html`
2. Busca la línea:
   ```javascript
   })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
   ```
3. Reemplaza **GTM-XXXXXXX** con tu ID del contenedor **EN 2 LUGARES**:
   - En el script del `<head>`
   - En el iframe del `<body>`

   ```html
   <!-- En el HEAD -->
   <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
   new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
   j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
   'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
   })(window,document,'script','dataLayer','GTM-TU-ID-AQUI');</script>
   
   <!-- En el BODY -->
   <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TU-ID-AQUI"
   height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
   ```

### 📝 Paso 3: Configurar Tags Básicos en GTM

1. Ve a Google Tag Manager
2. Haz clic en **"Etiquetas"** (Tags) en el menú izquierdo
3. Haz clic en **"Nueva"**
4. Configura la etiqueta de GA4:
   - **Nombre:** GA4 - Configuration Tag
   - **Tipo de etiqueta:** Google Analytics: Evento de GA4
   - **ID de medición:** Tu ID de GA4 (G-XXXXXXXXXX)
   - **Activador:** All Pages
5. Haz clic en **"Guardar"**

### ✅ Paso 4: Publicar Contenedor

1. Haz clic en **"Enviar"** (arriba a la derecha)
2. Ponle un nombre a la versión: **"Initial Setup - GA4 Integration"**
3. Haz clic en **"Publicar"**

### ✅ Paso 5: Verificar Instalación

1. Haz clic en **"Vista previa"** en GTM
2. Ingresa tu URL: https://katzen-a0e3e.web.app/
3. Haz clic en **"Connect"**
4. Deberías ver la consola de GTM Debug Mode ✅

---

## 3️⃣ MICROSOFT CLARITY

### 📝 Paso 1: Crear Proyecto en Clarity

1. Ve a [Microsoft Clarity](https://clarity.microsoft.com/)
2. Inicia sesión con tu cuenta de Microsoft (o crea una GRATIS)
3. Haz clic en **"Add new project"**
4. Completa:
   - **Name:** KatzenVet Landing Page
   - **Website URL:** https://katzen-a0e3e.web.app/
5. Haz clic en **"Add new project"**
6. **COPIA el Project ID** (será un código alfanumérico)

### 📝 Paso 2: Configurar en tu Proyecto

1. Abre el archivo `/src/index.html`
2. Busca la línea:
   ```javascript
   })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
   ```
3. Reemplaza **CLARITY_PROJECT_ID** con tu Project ID:
   ```javascript
   })(window, document, "clarity", "script", "TU-PROJECT-ID-AQUI");
   ```

### ✅ Paso 3: Verificar Instalación

1. Compila y despliega: `ng build && firebase deploy --only hosting`
2. Ve a Microsoft Clarity Dashboard
3. Abre tu sitio en otra pestaña
4. Navega por la página por 30 segundos
5. Regresa a Clarity, refresca la página
6. En pocos minutos verás las primeras sesiones grabadas ✅

---

## 4️⃣ VERIFICACIÓN DE TRACKING

### ✅ Checklist de Verificación

Después de configurar todo, verifica que los eventos se trackean correctamente:

1. **Google Analytics en Tiempo Real:**
   - [ ] Página vista se registra
   - [ ] Eventos de scroll se registran (scroll_depth)
   - [ ] Clics en WhatsApp se registran (whatsapp_click)
   - [ ] Clics en teléfono se registran (phone_click)
   - [ ] Expansión de FAQ se registra (faq_expansion)

2. **Consola del Navegador:**
   - [ ] Abre DevTools (F12)
   - [ ] Ve a la pestaña **Console**
   - [ ] Deberías ver logs como: `📊 Analytics Event: whatsapp_click {ubicacion: "floating"}`

3. **Microsoft Clarity:**
   - [ ] Sesiones grabadas aparecen
   - [ ] Heatmaps se generan (después de 24-48 horas)
   - [ ] Scroll maps funcionan

---

## 5️⃣ EVENTOS TRACKEADOS

### 📊 Lista Completa de Eventos

| Evento | Descripción | Ubicaciones |
|--------|-------------|-------------|
| `whatsapp_click` | Clic en botón de WhatsApp | hero, floating, faq, ubicacion |
| `phone_click` | Clic en número de teléfono | navbar, ubicacion, contacto |
| `agendar_cita_click` | Clic en "Agendar Cita" | hero, ubicacion |
| `como_llegar_click` | Clic en "Cómo Llegar" | ubicacion |
| `faq_expansion` | Usuario expande pregunta FAQ | faq |
| `scroll_depth` | Usuario scrollea X% de la página | 25%, 50%, 75%, 90% |
| `contact_form_submit` | Envío de formulario | contacto |
| `conversion` | Conversión exitosa (objetivo) | múltiples |
| `service_click` | Clic en servicio específico | servicios |
| `testimonio_click` | Clic en reseñas de Google | testimonios |
| `time_on_page` | Tiempo total en la página | al salir |
| `urgency_banner_closed` | Usuario cierra banner de urgencia | banner |

### 🎯 Objetivos de Conversión en GA4

**Configura estos eventos como conversiones:**

1. Ve a GA4 -> **Administrar** -> **Eventos**
2. Marca como conversión:
   - `conversion` ✅
   - `contact_form_submit` ✅
   - `whatsapp_click` ✅
   - `phone_click` ✅
   - `agendar_cita_click` ✅

---

## 6️⃣ DASHBOARDS RECOMENDADOS

### 📈 Dashboard 1: Conversiones

**Métricas clave a monitorear:**
- Total de conversiones
- Tasa de conversión (%)
- Conversiones por canal (Orgánico, Directo, Redes Sociales)
- Conversiones por dispositivo (Desktop, Mobile, Tablet)

### 📱 Dashboard 2: Engagement

**Métricas clave a monitorear:**
- Tiempo promedio en página
- Scroll depth promedio
- FAQs más expandidas
- Servicios más clickeados

### 🎯 Dashboard 3: Acciones Críticas

**Métricas clave a monitorear:**
- Clics en WhatsApp (por ubicación)
- Clics en teléfono
- Envíos de formulario
- Clics en "Cómo Llegar"

---

## 🚀 PRÓXIMOS PASOS

### Semana 1: Recopilación de Datos
- ✅ Dejar tracking activado por 7 días
- ✅ No hacer cambios mayores
- ✅ Monitorear errores en la consola

### Semana 2: Análisis Inicial
- 📊 Revisar dashboards de GA4
- 🎥 Ver sesiones grabadas en Clarity
- 🔍 Identificar puntos de dolor

### Semana 3: Optimización
- 🎨 A/B testing de CTAs
- 📝 Optimizar FAQs basado en datos
- 🚀 Mejorar secciones con bajo engagement

---

## 🆘 TROUBLESHOOTING

### Problema: No veo eventos en GA4

**Solución:**
1. Verifica que reemplazaste **G-XXXXXXXXXX** con tu ID real
2. Abre DevTools (F12) -> Console
3. Busca errores relacionados con `gtag`
4. Asegúrate de haber desplegado después de los cambios

### Problema: GTM no está funcionando

**Solución:**
1. Verifica que reemplazaste **GTM-XXXXXXX** en ambos lugares (head y body)
2. Ve a GTM -> Vista previa
3. Conecta tu sitio y verifica tags que se disparan

### Problema: Clarity no graba sesiones

**Solución:**
1. Espera 10-15 minutos después del despliegue
2. Verifica que no estés usando bloqueadores de ads
3. Navega en modo incógnito para pruebas

---

## 📞 SOPORTE

Si necesitas ayuda adicional:
- 📧 Documentación GA4: https://support.google.com/analytics/
- 📧 Documentación GTM: https://support.google.com/tagmanager/
- 📧 Documentación Clarity: https://learn.microsoft.com/en-us/clarity/

---

**🎉 ¡Configuración Completa!**

Con estas herramientas tendrás visibilidad total del comportamiento de tus usuarios y podrás tomar decisiones basadas en datos reales. 📊




