import { AdminModuleAccent } from '../../shared/admin/admin-module-card.component';

/** Nomenclatura estándar CRUD admin — referencia: vacunas.component.html */
export interface AdminModulePageCopy {
  accent: AdminModuleAccent;
  icon: string;
  entityPlural: string;
  entitySingular: string;
  entityGender: 'm' | 'f';
  bannerTitle: string;
  bannerSubtitle: string;
  listTitle: string;
  listDescription: string;
  searchLabel: string;
  searchPlaceholder: string;
  newButtonLabel: string;
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyActionLabel: string;
}

const agregarPrimero = (singular: string, gender: 'm' | 'f') =>
  gender === 'f' ? `Agregar primera ${singular}` : `Agregar primer ${singular}`;

const nuevo = (singular: string, gender: 'm' | 'f') =>
  gender === 'f' ? `Nueva ${singular}` : `Nuevo ${singular}`;

export const ADMIN_MODULE_PAGES: Record<string, AdminModulePageCopy> = {
  pacientes: {
    accent: 'teal',
    icon: 'pets',
    entityPlural: 'pacientes',
    entitySingular: 'paciente',
    entityGender: 'm',
    bannerTitle: 'Administración de Pacientes',
    bannerSubtitle: 'Consulta, edita y da de baja lógica a las mascotas registradas.',
    listTitle: 'Listado de pacientes',
    listDescription: 'Busca por nombre, especie, raza o dueño.',
    searchLabel: 'Buscar paciente',
    searchPlaceholder: 'Nombre, especie, raza, dueño…',
    newButtonLabel: nuevo('paciente', 'm'),
    loadingMessage: 'Cargando pacientes…',
    emptyTitle: 'No hay pacientes',
    emptyMessage: 'No se han encontrado pacientes registrados.',
    emptyActionLabel: agregarPrimero('paciente', 'm')
  },
  clientes: {
    accent: 'blue',
    icon: 'people',
    entityPlural: 'clientes',
    entitySingular: 'cliente',
    entityGender: 'm',
    bannerTitle: 'Administración de Clientes',
    bannerSubtitle: 'Administra fichas, contacto y expedientes vinculados.',
    listTitle: 'Listado de clientes',
    listDescription: 'Busca por nombre, teléfono, correo o expediente.',
    searchLabel: 'Buscar cliente',
    searchPlaceholder: 'Nombre, teléfono, correo, expediente…',
    newButtonLabel: nuevo('cliente', 'm'),
    loadingMessage: 'Cargando clientes…',
    emptyTitle: 'No hay clientes',
    emptyMessage: 'No se han encontrado clientes registrados.',
    emptyActionLabel: agregarPrimero('cliente', 'm')
  },
  citas: {
    accent: 'purple',
    icon: 'event',
    entityPlural: 'citas',
    entitySingular: 'cita',
    entityGender: 'f',
    bannerTitle: 'Administración de Citas',
    bannerSubtitle: 'Programa, confirma y da seguimiento a las citas de consulta.',
    listTitle: 'Listado de citas',
    listDescription: 'Busca por cliente, paciente, motivo o veterinario.',
    searchLabel: 'Buscar cita',
    searchPlaceholder: 'Cliente, paciente, motivo…',
    newButtonLabel: nuevo('cita', 'f'),
    loadingMessage: 'Cargando citas…',
    emptyTitle: 'No hay citas',
    emptyMessage: 'No se han encontrado citas registradas.',
    emptyActionLabel: agregarPrimero('cita', 'f')
  },
  vacunas: {
    accent: 'green',
    icon: 'vaccines',
    entityPlural: 'vacunas',
    entitySingular: 'vacuna',
    entityGender: 'f',
    bannerTitle: 'Administración de Vacunas',
    bannerSubtitle: 'Gestiona todas las vacunas y calendarios de vacunación.',
    listTitle: 'Listado de vacunas',
    listDescription: 'Busca por paciente, tipo de vacuna o veterinario.',
    searchLabel: 'Buscar vacuna',
    searchPlaceholder: 'Paciente, tipo de vacuna…',
    newButtonLabel: nuevo('vacuna', 'f'),
    loadingMessage: 'Cargando vacunas…',
    emptyTitle: 'No hay vacunas',
    emptyMessage: 'No se han encontrado vacunas registradas.',
    emptyActionLabel: agregarPrimero('vacuna', 'f')
  },
  historiales: {
    accent: 'pink',
    icon: 'medical_services',
    entityPlural: 'historiales',
    entitySingular: 'historial',
    entityGender: 'm',
    bannerTitle: 'Administración de Historiales Clínicos',
    bannerSubtitle: 'Gestiona todos los historiales médicos de los pacientes.',
    listTitle: 'Listado de historiales',
    listDescription: 'Busca por paciente, diagnóstico, tratamiento o médico.',
    searchLabel: 'Buscar historial',
    searchPlaceholder: 'Paciente, diagnóstico, tratamiento…',
    newButtonLabel: nuevo('historial', 'm'),
    loadingMessage: 'Cargando historiales…',
    emptyTitle: 'No hay historiales',
    emptyMessage: 'No se han encontrado historiales registrados.',
    emptyActionLabel: agregarPrimero('historial', 'm')
  },
  banios: {
    accent: 'teal',
    icon: 'spa',
    entityPlural: 'baños',
    entitySingular: 'baño',
    entityGender: 'm',
    bannerTitle: 'Administración de Peluquería',
    bannerSubtitle: 'Gestiona todos los servicios de baño y peluquería.',
    listTitle: 'Listado de baños',
    listDescription: 'Busca por paciente, cliente o tipo de servicio.',
    searchLabel: 'Buscar baño',
    searchPlaceholder: 'Paciente, cliente, tipo de servicio…',
    newButtonLabel: nuevo('baño', 'm'),
    loadingMessage: 'Cargando baños…',
    emptyTitle: 'No hay baños',
    emptyMessage: 'No se han encontrado baños registrados.',
    emptyActionLabel: agregarPrimero('baño', 'm')
  },
  recordatorios: {
    accent: 'blue',
    icon: 'notifications',
    entityPlural: 'recordatorios',
    entitySingular: 'recordatorio',
    entityGender: 'm',
    bannerTitle: 'Administración de Recordatorios',
    bannerSubtitle: 'Gestiona todos los recordatorios y alertas del sistema.',
    listTitle: 'Listado de recordatorios',
    listDescription: 'Busca por título, paciente, tipo o prioridad.',
    searchLabel: 'Buscar recordatorio',
    searchPlaceholder: 'Título, paciente, tipo…',
    newButtonLabel: nuevo('recordatorio', 'm'),
    loadingMessage: 'Cargando recordatorios…',
    emptyTitle: 'No hay recordatorios',
    emptyMessage: 'No se han encontrado recordatorios registrados.',
    emptyActionLabel: agregarPrimero('recordatorio', 'm')
  },
  usuarios: {
    accent: 'purple',
    icon: 'manage_accounts',
    entityPlural: 'usuarios',
    entitySingular: 'usuario',
    entityGender: 'm',
    bannerTitle: 'Administración de Usuarios',
    bannerSubtitle: 'Gestiona cuentas staff, perfiles de acceso y permisos.',
    listTitle: 'Listado de usuarios',
    listDescription: 'Busca por nombre, correo o perfil.',
    searchLabel: 'Buscar usuario',
    searchPlaceholder: 'Nombre, correo, perfil…',
    newButtonLabel: nuevo('usuario', 'm'),
    loadingMessage: 'Cargando usuarios…',
    emptyTitle: 'No hay usuarios',
    emptyMessage: 'No se han encontrado usuarios registrados.',
    emptyActionLabel: agregarPrimero('usuario', 'm')
  },
  contactos: {
    accent: 'pink',
    icon: 'mail',
    entityPlural: 'mensajes',
    entitySingular: 'mensaje',
    entityGender: 'm',
    bannerTitle: 'Administración de Contactos Web',
    bannerSubtitle: 'Mensajes enviados desde la landing page.',
    listTitle: 'Listado de mensajes',
    listDescription: 'Busca por nombre, email, teléfono o mascota.',
    searchLabel: 'Buscar mensaje',
    searchPlaceholder: 'Nombre, email, teléfono, mascota…',
    newButtonLabel: 'Actualizar',
    loadingMessage: 'Cargando mensajes…',
    emptyTitle: 'No hay mensajes',
    emptyMessage: 'No se han encontrado mensajes registrados.',
    emptyActionLabel: 'Actualizar'
  }
};
