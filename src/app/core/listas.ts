/** Filtros y orden de las listas de la consola. Lógica pura: las pantallas solo pintan lo que devuelven. */

const normalizar = (texto: string): string => texto.trim().toLowerCase();

/** Búsqueda por código de unidad: parte del texto, sin importar mayúsculas. Vacía = todo. */
export function buscarPorUnidad<T extends { unidad: string }>(filas: readonly T[], busqueda: string): T[] {
  const q = normalizar(busqueda);
  return q === '' ? [...filas] : filas.filter((f) => normalizar(f.unidad).includes(q));
}

/** R8: una reserva viva (SOLICITADA o CONFIRMADA) todavía requiere atención; el resto ya terminó. */
const VIVAS = new Set(['SOLICITADA', 'CONFIRMADA']);

/**
 * Próximas arriba (la más cercana primero) y anteriores debajo (la más reciente primero). Una confirmada que ya pasó sigue
 * en «próximas» porque el ADMIN aún tiene que finalizarla (R6).
 */
export function agruparReservas<T extends { estado: string; inicio: string }>(reservas: readonly T[]): { proximas: T[]; anteriores: T[] } {
  const proximas = reservas.filter((r) => VIVAS.has(r.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const anteriores = reservas.filter((r) => !VIVAS.has(r.estado)).sort((a, b) => b.inicio.localeCompare(a.inicio));
  return { proximas, anteriores };
}

/** F10: el dinero llega como texto decimal; se compara en centavos enteros, nunca como `number`. */
export function compararDecimales(a: string, b: string): number {
  const centavos = (texto: string): bigint => {
    const [entero, decimales = ''] = texto.trim().split('.');
    return BigInt(entero + decimales.padEnd(2, '0').slice(0, 2));
  };
  const diferencia = centavos(a) - centavos(b);
  return diferencia === 0n ? 0 : diferencia > 0n ? 1 : -1;
}

export type OrdenPagos = 'recientes' | 'antiguos' | 'monto';

/** F8: «más antiguos» sirve para conciliar primero lo que lleva más tiempo esperando. */
export function ordenarPagos<T extends { monto: string; fechaPago: string }>(pagos: readonly T[], orden: OrdenPagos): T[] {
  const copia = [...pagos];
  if (orden === 'monto') return copia.sort((a, b) => compararDecimales(b.monto, a.monto));
  return copia.sort((a, b) => (orden === 'antiguos' ? a.fechaPago.localeCompare(b.fechaPago) : b.fechaPago.localeCompare(a.fechaPago)));
}

/** G5: con la opción activa, solo los informes del agente de monitoreo que trajeron alertas. */
export function soloConAlertas<T extends { alertas: readonly unknown[] }>(informes: readonly T[], activo: boolean): T[] {
  return activo ? informes.filter((i) => i.alertas.length > 0) : [...informes];
}

/** Recargos: por unidad y por quién los propuso (AGENTE, SISTEMA, ADMIN). `TODOS` no filtra por origen. */
export function filtrarRecargos<T extends { unidad: string; origen: string }>(
  recargos: readonly T[],
  { busqueda, origen }: { busqueda: string; origen: string },
): T[] {
  return buscarPorUnidad(recargos, busqueda).filter((r) => origen === 'TODOS' || r.origen === origen);
}

export interface FiltroReservas { busqueda: string; estado: string; area: string }

/** Reservas: por unidad, estado y área. `TODOS` en estado o área no filtra. */
export function filtrarReservas<T extends { unidad: string; estado: string; area: string }>(reservas: readonly T[], f: FiltroReservas): T[] {
  return buscarPorUnidad(reservas, f.busqueda).filter((r) => (f.estado === 'TODOS' || r.estado === f.estado) && (f.area === 'TODOS' || r.area === f.area));
}
