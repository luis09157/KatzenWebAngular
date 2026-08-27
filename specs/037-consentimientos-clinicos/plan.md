# Plan: Consentimientos clínicos (037)

## Enfoque

CRUD admin ligero + portal read-only, calcado de visitas (lista/dialog) sin cobros.

## Pasos

1. Modelos + service `Katzen/Consentimientos`
2. Lista + diálogo (picker, tipos, staff, firmado_por)
3. StaffModule + ruta + menú
4. Rules RTDB (paridad Visitas)
5. Portal card + list section + mapper
6. Mocks, Cypress smoke, QA, build, deploy

## Contratos (resumen)

Ver `spec.md`. Nodo aditivo; sin Resend.

## Mitigación / Rollback

Ocultar módulo; datos no destructivos.
