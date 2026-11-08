import type { Confirmacion } from './agente.service';
import { uuidsDe } from './texto-resumen';

export interface AccionDescrita { titulo: string; lineas: [string, string][]; nota: string }

const TITULOS: Record<string, string> = {
  proponer_recargo: 'Proponer recargo',
  enviar_recordatorio: 'Enviar recordatorio',
};
const ETIQUETAS: Record<string, string> = { unidadId: 'Unidad', monto: 'Monto', motivo: 'Motivo', mensaje: 'Mensaje' };
const NOTAS: Record<string, string> = {
  proponer_recargo:
    'Se registra como propuesta (PROPUESTO): no se cobra nada hasta que la confirmes en la pestaña Recargos.',
  enviar_recordatorio: 'Se envía este mensaje al titular de la unidad por correo. No crea cargos.',
};

/** Unidades que nombra la acción, para pedir sus códigos antes de mostrarla. */
export function unidadesDe(c: Confirmacion): string[] {
  return uuidsDe(JSON.stringify(c.argumentos ?? {}));
}

/** G2: lo que el ADMIN decide, en palabras: qué herramienta, sobre qué unidad, con qué datos y qué efecto tendría. */
export function describirAccion(c: Confirmacion, codigos: ReadonlyMap<string, string>): AccionDescrita {
  const lineas = Object.entries(c.argumentos ?? {}).map(([clave, valor]): [string, string] => {
    const texto = String(valor);
    const nombre = ETIQUETAS[clave] ?? clave;
    return [nombre, clave === 'unidadId' ? (codigos.get(texto.toLowerCase()) ?? `${texto.slice(0, 8)}…`) : texto];
  });
  return { titulo: TITULOS[c.herramienta] ?? c.herramienta, lineas, nota: NOTAS[c.herramienta] ?? '' };
}
