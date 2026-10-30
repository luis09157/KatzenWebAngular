# Spec 117 — Campanita de avisos en la barra superior

**Pidió:** Luis (29 oct 2026): el número junto a «Recordatorios» confundía (eran 2 baños de mañana, no recordatorios; la tabla decía 0). «Ponlo en una campanita como en Facebook, en la barra superior… si le dan clic que se despliegue y puedan ir a esa actividad». L2 (solo UI, solo lectura).

**Ahora:**
- 🔔 en la barra superior (junto al nombre), con globito rojo = avisos de «Para avisar hoy» (spec 111) + alertas de inventario.
- Al tocarla se despliega la lista (máx. 8, del más próximo al más lejano): «Baño mañana · Pulga — Yuliana Soto · Mañana 11:30 a.m.». Tocar un renglón lleva a su pantalla: baños → Peluquería, citas → Citas, recordatorios → Recordatorios, inventario → Inventario › Alertas.
- Abajo: **Avisar por WhatsApp** abre «Para avisar hoy» (mismos botones; nada se manda solo).
- Sin avisos: «Todo al día».
- Se actualiza 5 s después de entrar, cada 30 min y cada vez que se abre.
- «Recordatorios» del menú lateral ya no lleva número. El número de Inventario en el menú se queda.
- Intacto: «Para avisar hoy» (dialogo, botón en Recordatorios y franja en Hoy), reglas, datos.

**Archivos:** `para-avisar/campanita.util.ts` (+spec), `layouts/admin-main-layout.*`, `styles.css` (panel del menú).
