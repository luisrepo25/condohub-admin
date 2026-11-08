/** Parte de una línea: el texto y si va en negrita. */
export interface Parte { texto: string; negrita: boolean }
export type TipoLinea = 'titulo' | 'item' | 'subitem' | 'parrafo';
export interface Linea { tipo: TipoLinea; partes: Parte[] }

/** Los guiones del LLM a veces son Unicode (‑, –): se aceptan todos al buscar un identificador. */
const GUION = '[-‐‑‒–]';
const UUID = new RegExp(`[0-9a-f]{8}${GUION}[0-9a-f]{4}${GUION}[0-9a-f]{4}${GUION}[0-9a-f]{4}${GUION}[0-9a-f]{12}`, 'gi');
const VINETA = /^(\s*)(?:[*\-•]|\d+\.)\s+(.*)$/;
const NEGRITA = /\*\*(.+?)\*\*/g;

const normalizar = (id: string): string => id.replace(new RegExp(GUION, 'g'), '-').toLowerCase();

/** Identificadores que aparecen en el texto, normalizados y sin repetir, para resolver sus códigos de una sola vez. */
export function uuidsDe(texto: string): string[] {
  return [...new Set((texto.match(UUID) ?? []).map(normalizar))];
}

/** «03e3ea31-…» pasa a «A-132»; si no se conoce la unidad se acorta, nunca se muestra entero. */
function conCodigos(texto: string, codigos: ReadonlyMap<string, string>): string {
  return texto.replace(UUID, (id) => {
    const limpio = normalizar(id);
    return codigos.get(limpio) ?? `${limpio.slice(0, 8)}…`;
  });
}

function partesDe(texto: string): Parte[] {
  const partes: Parte[] = [];
  let desde = 0;
  for (const m of texto.matchAll(NEGRITA)) {
    if (m.index > desde) partes.push({ texto: texto.slice(desde, m.index), negrita: false });
    partes.push({ texto: m[1], negrita: true });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) partes.push({ texto: texto.slice(desde), negrita: false });
  return partes;
}

/**
 * El resumen que escribe el LLM trae Markdown (`**negrita**`, listas, UUID de unidades). Se convierte en líneas con tipo y
 * partes, sin HTML: la pantalla las pinta con plantillas, así que nada del texto se interpreta como marcado.
 */
export function formatearResumen(texto: string, codigos: ReadonlyMap<string, string>): Linea[] {
  const lineas: Linea[] = [];
  for (const cruda of texto.split('\n')) {
    const linea = conCodigos(cruda.trimEnd(), codigos);
    if (!linea.trim()) continue;
    const vineta = VINETA.exec(linea);
    const contenido = vineta ? vineta[2] : linea.trim();
    const tipo: TipoLinea = vineta
      ? ((vineta[1]?.length ?? 0) >= 2 ? 'subitem' : 'item')
      : /^\*\*[^*]+\*\*$/.test(contenido) ? 'titulo' : 'parrafo';
    lineas.push({ tipo, partes: partesDe(contenido) });
  }
  return lineas;
}
