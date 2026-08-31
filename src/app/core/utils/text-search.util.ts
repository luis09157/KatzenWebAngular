/** Normaliza texto de búsqueda: minúsculas, sin acentos, espacios colapsados. */
export function normalizarTextoBusqueda(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** ¿El haystack contiene el needle, o todas las palabras del needle? */
export function textoCoincide(haystack: unknown, needle: unknown): boolean {
  const h = normalizarTextoBusqueda(haystack);
  const n = normalizarTextoBusqueda(needle);
  if (!n) {
    return true;
  }
  if (!h) {
    return false;
  }
  if (h.includes(n)) {
    return true;
  }
  const words = n.split(' ').filter(Boolean);
  return words.length > 1 && words.every(w => h.includes(w));
}
