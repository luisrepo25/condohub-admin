import type { Api } from './api';

/** Gestión devuelve `unidadId`; para mostrar «A-101» se resuelve el código con `estadoDeCuenta` (una sola consulta). */
export async function codigosDeUnidades(api: Api, ids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return new Map();
  const campos = unicos.map((id, i) => `u${i}: estadoDeCuenta(unidadId: "${id}") { codigo }`).join(' ');
  const datos = await api.graphql<Record<string, { codigo: string }>>(`{ ${campos} }`);
  return new Map(unicos.map((id, i) => [id, datos[`u${i}`]?.codigo ?? id]));
}
