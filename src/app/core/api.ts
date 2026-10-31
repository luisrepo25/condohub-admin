import { GATEWAY_URL } from '../../entorno';

/** Puerto hacia los servicios: todo pasa por el gateway con el token del shell (nunca hay login propio). */
export interface Api {
  graphql<T>(consulta: string, variables?: Record<string, unknown>): Promise<T>;
  rest<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown): Promise<T>;
}

interface Problema { title?: string; detail?: string; code?: string }
interface ErrorGraphql { message: string; extensions?: { code?: string } }

/** El `code` de la regla violada (F8, F5...) se muestra tal cual lo manda el backend. */
function mensajeDe(texto: string, codigo: string | undefined): string {
  return codigo ? `${texto} (${codigo})` : texto;
}

export function crearApi(getToken: () => string): Api {
  const autorizacion = () => ({ authorization: `Bearer ${getToken()}` });

  async function graphql<T>(consulta: string, variables?: Record<string, unknown>): Promise<T> {
    const r = await fetch(`${GATEWAY_URL}/gestion/graphql`, {
      method: 'POST',
      headers: { ...autorizacion(), 'content-type': 'application/json' },
      body: JSON.stringify({ query: consulta, variables }),
    });
    if (!r.ok) throw new Error(`Gestión respondió ${r.status}`);
    const cuerpo = (await r.json()) as { data?: T; errors?: ErrorGraphql[] };
    const fallo = cuerpo.errors?.[0];
    if (fallo) throw new Error(mensajeDe(fallo.message, fallo.extensions?.code));
    if (!cuerpo.data) throw new Error('Respuesta vacía de Gestión');
    return cuerpo.data;
  }

  async function rest<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown): Promise<T> {
    const esForm = cuerpo instanceof FormData;
    const r = await fetch(`${GATEWAY_URL}${ruta}`, {
      method: metodo,
      headers: { ...autorizacion(), ...(cuerpo && !esForm ? { 'content-type': 'application/json' } : {}) },
      body: cuerpo === undefined ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    });
    if (!r.ok) {
      const p = (await r.json().catch(() => ({}))) as Problema;
      throw new Error(mensajeDe(p.detail ?? p.title ?? `El servicio respondió ${r.status}`, p.code));
    }
    return (await r.json()) as T;
  }

  return { graphql, rest };
}
