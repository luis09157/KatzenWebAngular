/** Texto del manual (misma fuente que `docs/MANUAL-USUARIO.md`). Spec 072. */

export interface ManualFlujo {
  id: string;
  titulo: string;
  icono: string;
  pasos: string[];
}

export const MANUAL_USUARIO_FLUJOS: ManualFlujo[] = [
  {
    id: 'llegada',
    titulo: 'Llegó un paciente',
    icono: 'pets',
    pasos: [
      'En Hoy, toca el botón grande «Llegó un paciente».',
      'Busca al dueño por teléfono o nombre. Si no está, regístralo ahí mismo (nombre y teléfono bastan).',
      'Elige la mascota o da de alta una nueva.',
      'Indica qué viene a hacer: consulta, vacuna, baño, pensión o solo cita. Se abre esa pantalla con los datos ya puestos.',
      'Al terminar, el expediente de la mascota queda a un toque.',
    ],
  },
  {
    id: 'cobro',
    titulo: 'Cobrar',
    icono: 'point_of_sale',
    pasos: [
      'Entra a Cobrar (o «Punto de venta»). No hace falta elegir cliente para vender croquetas o farmacia.',
      'Si es consulta o un servicio de la mascota, el sistema te pide dueño y mascota en ese momento.',
      'Agrega productos o servicios. El primer cobro del día abre la caja solo.',
      'En Cobrar puedes ver el cambio si te pagaron con un billete más grande.',
      'Al cobrar se imprime o se manda el ticket por WhatsApp. El stock baja solo.',
    ],
  },
  {
    id: 'corte',
    titulo: 'Hacer el corte de caja',
    icono: 'account_balance_wallet',
    pasos: [
      'Al final del día aparece el aviso «Hacer corte» en Hoy o en Cobrar.',
      'Cuenta el efectivo del cajón y escríbelo. El sistema calcula lo esperado y la diferencia.',
      'Confirma. No hace falta un menú aparte de «apertura».',
      'Caja y reportes los ve administración; si no te aparecen, pide a la dueña el corte o el número del día.',
    ],
  },
  {
    id: 'expediente',
    titulo: 'Abrir el expediente',
    icono: 'folder_shared',
    pasos: [
      'Desde Hoy, en Citas de hoy, toca «Atender» para abrir la mascota de esa cita.',
      'También puedes ir a Pacientes y buscar por nombre o por el número de expediente de la clínica.',
      'En el expediente están historial, vacunas, baños y recordatorios de esa mascota.',
      'En la ficha del dueño verás si recibirá avisos: hace falta correo, portal activo y que haya permitido avisos en su celular.',
    ],
  },
];
