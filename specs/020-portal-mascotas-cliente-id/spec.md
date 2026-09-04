# Spec: Query portal mascotas por `cliente_id`

**ID:** 020-portal-mascotas-cliente-id  
**Estado:** done (retro, sin QA registrada)  
**Fecha:** 2026-08-26  

---

## Problema

Portal ya consulta `idCliente` y `cliente_id`, pero rules list-level solo permiten `orderByChild == 'idCliente'`. Legacy con solo `cliente_id` falla.

---

## Criterios

- [ ] SC-001: Rule list `Mascota`: permitir también `query.orderByChild == 'cliente_id' && equalTo == auth.token.clienteId`
- [ ] SC-002: `.indexOn` ya incluye `cliente_id`
- [ ] SC-003: Código portal sin cambio (ya hace ambas queries)

## Deploy

`firebase deploy --only database`
