import * as crypto from 'crypto';

const PORTAL_LOGIN_URL =
  process.env.PORTAL_LOGIN_URL || 'https://katzen-a0e3e.web.app/portal/login';

/** Contraseña aleatoria segura (nunca loguear ni persistir). */
export function generateSecurePassword(length = 16): string {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, 'x')
    .slice(0, length);
}

export interface PortalWelcomeMailInput {
  to: string;
  nombre: string;
  password: string;
}

export interface PortalWelcomeMailResult {
  sent: boolean;
  reason?: string;
}

/** Envía correo vía Resend si RESEND_API_KEY está configurada. */
export async function sendPortalWelcomeEmail(
  input: PortalWelcomeMailInput
): Promise<PortalWelcomeMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_FROM_EMAIL || 'Katzen Vet <onboarding@resend.dev>';

  if (!apiKey) {
    return {
      sent: false,
      reason: 'RESEND_API_KEY no configurada; la cuenta se creó pero el correo no se envió automáticamente.'
    };
  }

  const subject = 'Tu acceso al portal Katzen Vet';
  const html = `
    <p>Hola ${escapeHtml(input.nombre)},</p>
    <p>La clínica activó tu acceso al portal de dueños. Usa estos datos para iniciar sesión:</p>
    <ul>
      <li><strong>Portal:</strong> <a href="${PORTAL_LOGIN_URL}">${PORTAL_LOGIN_URL}</a></li>
      <li><strong>Correo:</strong> ${escapeHtml(input.to)}</li>
      <li><strong>Contraseña temporal:</strong> ${escapeHtml(input.password)}</li>
    </ul>
    <p>Por seguridad, te recomendamos cambiar tu contraseña al entrar en <strong>Mi perfil → Seguridad</strong>.</p>
    <p>Si no solicitaste este acceso, contacta a la clínica.</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        html
      })
    });

    if (!response.ok) {
      const body = await response.text();
      return { sent: false, reason: `Resend error ${response.status}: ${body.slice(0, 200)}` };
    }

    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al enviar correo';
    return { sent: false, reason: message };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
