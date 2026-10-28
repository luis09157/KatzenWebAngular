# Spec 113 — Etapa C: Hoy como lista de trabajo y pantallas más claras

**Estado:** implementado · **Nivel:** L2 (solo UI; sin datos) · **Pidió:** Luis (2026-10-27, «continua ahorita» con la Etapa C del documento de análisis)

## Hoy
- Arriba (después de las franjas de caja / cierre / avisar): panel **«Hoy en la clínica»** con la agenda de hoy partida en **Atendiéndose** (baños en proceso) y **Por llegar** (citas pendientes/confirmadas, baños programados), con Atender (cita) o Ir a Peluquería / Terminar y cobrar (baño). «Ver los N ya terminados hoy». Pensión sigue en su panel. Util puro `hoy-trabajo.util.ts` (+spec).
- Se quitaron las 3 tarjetas de módulos (Clínica / Punto de venta / Inventario): repetían el menú.
- «Agenda del mes» (calendario) pasa abajo, después de Por cobrar / Pensión / Stock.
- Métricas del negocio (solo admin): cerradas por defecto con «Ir a Finanzas» (la cifra oficial, igual que la caja) o «Ver métricas aquí»; ya no se cargan al abrir Hoy.

## Textos
- Citas: «Atendido por» → «Veterinario» (salía en citas que aún no se atienden).
- Se quitó el aviso de ayuda que repetía el subtítulo en Citas, Historiales y Peluquería.
- Vacunas: el aviso decía que al dueño le llega solo; ahora explica «Para avisar hoy».

## Fuera de esta entrega
Mover todo el tablero de negocio a Finanzas (Meta de inversión, tops) queda para cuando Luis lo pida; hoy queda cerrado en Hoy con enlace a Finanzas.
