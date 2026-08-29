/**
 * Inbox portal al registrar vacuna — reemplaza function huérfana onVacunaCreated.
 * Spec 023/047: escribe Katzen/Notificaciones/{clienteId} si portalActivo.
 */
import * as admin from 'firebase-admin';
import { onValueCreated } from 'firebase-functions/v2/database';
import { logger } from 'firebase-functions';

function rtdb(): admin.database.Database {
  return admin.database();
}

interface VacunaSnap {
  idPaciente?: string;
  vacuna?: string;
}

interface MascotaSnap {
  idCliente?: string;
  cliente_id?: string;
  nombre?: string;
}

export const onVacunaCreatedInbox = onValueCreated(
  {
    ref: '/Katzen/Vacunas/{vacunaId}',
    region: 'us-central1'
  },
  async (event) => {
    const vacuna = event.data.val() as VacunaSnap | null;
    const vacunaId = event.params.vacunaId as string;

    if (!vacuna?.idPaciente) {
      return;
    }

    try {
      const mascotaSnap = await rtdb().ref(`Katzen/Mascota/${vacuna.idPaciente}`).once('value');
      if (!mascotaSnap.exists()) {
        return;
      }

      const mascota = mascotaSnap.val() as MascotaSnap;
      const clienteId = mascota.idCliente || mascota.cliente_id;
      if (!clienteId) {
        return;
      }

      const clienteSnap = await rtdb().ref(`Katzen/Cliente/${clienteId}`).once('value');
      if (!clienteSnap.exists()) {
        return;
      }

      const cliente = clienteSnap.val() as { portalActivo?: boolean };
      if (cliente.portalActivo !== true) {
        return;
      }

      const notifRef = rtdb().ref(`Katzen/Notificaciones/${clienteId}`).push();
      const nombreMascota = String(mascota.nombre || 'Tu mascota').trim() || 'Tu mascota';
      const nombreVacuna = String(vacuna.vacuna || 'vacuna').trim() || 'vacuna';

      await notifRef.set({
        id: notifRef.key,
        tipo: 'vacuna',
        mascotaId: vacuna.idPaciente,
        titulo: 'Nueva vacuna registrada',
        mensaje: `${nombreMascota} recibió: ${nombreVacuna}`,
        leida: false,
        fecha: new Date().toISOString(),
        referenciaId: vacunaId
      });
    } catch (err) {
      logger.error('onVacunaCreatedInbox failed', { vacunaId, err });
    }
  }
);
