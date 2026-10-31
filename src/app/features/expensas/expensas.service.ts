import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';

export interface Emision {
  periodo: string;
  presupuesto: string;
  fechaVencimiento: string;
  unidades: number;
  total: string;
}

const EMITIR =
  'mutation($periodo: String!, $presupuesto: Decimal!) { emitirExpensas(periodo: $periodo, presupuesto: $presupuesto) { periodo presupuesto fechaVencimiento unidades total } }';

/** Solo la forma: un decimal positivo con hasta 2 decimales (F10). Quién puede emitir y cuándo lo decide Gestión (F2, F3). */
export function presupuestoValido(texto: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(texto.trim()) && /[1-9]/.test(texto);
}

export function periodoValido(texto: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(texto);
}

/** F3: emite las expensas del mes (presupuesto × alícuota por unidad). Cada periodo se emite una sola vez y no puede ser pasado. */
export class ExpensasService extends ConEstado {
  readonly emision = signal<Emision | null>(null);

  constructor(private readonly api: Api) {
    super();
  }

  emitir(periodo: string, presupuesto: string): Promise<void> {
    return this.ejecutar(async () => {
      this.emision.set(null);
      if (!periodoValido(periodo)) throw new Error('Elige el mes que vas a emitir');
      if (!presupuestoValido(presupuesto)) throw new Error('Escribe un presupuesto mayor a cero, con hasta 2 decimales');
      const { emitirExpensas } = await this.api.graphql<{ emitirExpensas: Emision }>(EMITIR, {
        periodo,
        presupuesto: presupuesto.trim(),
      });
      this.emision.set(emitirExpensas);
      this.aviso.set(`Expensas de ${emitirExpensas.periodo} emitidas`);
    });
  }
}
