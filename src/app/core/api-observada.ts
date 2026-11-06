import type { Api } from './api';

/** Avisa cuando una escritura termina, para refrescar el resumen sin que cada pantalla tenga que saberlo. */
export function observarEscrituras(api: Api, alEscribir: () => void): Api {
  return {
    graphql: async <T>(consulta: string, variables?: Record<string, unknown>) => {
      const respuesta = await api.graphql<T>(consulta, variables);
      if (/^\s*mutation\b/.test(consulta)) alEscribir();
      return respuesta;
    },
    rest: async <T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown) => {
      const respuesta = await api.rest<T>(metodo, ruta, cuerpo);
      if (metodo === 'POST') alEscribir();
      return respuesta;
    },
  };
}
