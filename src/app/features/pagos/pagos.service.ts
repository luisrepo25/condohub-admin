import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';
import { codigosDeUnidades } from '../../core/unidades';

export interface PagoPendiente { id: string; unidadId: string; unidad: string; monto: string; fechaPago: string }

const LISTA = '{ pagosPendientes { id unidadId monto fechaPago } }';
const CONFIRMAR = 'mutation($id: ID!) { confirmarPago(pagoId: $id) { reciboNumero } }';
const RECHAZAR = 'mutation($id: ID!, $motivo: String!) { rechazarPago(pagoId: $id, motivo: $motivo) { id } }';

/** Conciliación (F8): el ADMIN confirma (recibo, imputación FIFO F7) o rechaza con motivo. Gestión decide; aquí solo se muestra. */
export class PagosService extends ConEstado {
  readonly pagos = signal<PagoPendiente[]>([]);

  constructor(private readonly api: Api) {
    super();
  }

  cargar(): Promise<void> {
    return this.ejecutar(async () => {
      const { pagosPendientes } = await this.api.graphql<{ pagosPendientes: Omit<PagoPendiente, 'unidad'>[] }>(LISTA);
      const codigos = await codigosDeUnidades(this.api, pagosPendientes.map((p) => p.unidadId));
      this.pagos.set(pagosPendientes.map((p) => ({ ...p, unidad: codigos.get(p.unidadId) ?? p.unidadId })));
    });
  }

  confirmar(id: string): Promise<void> {
    return this.ejecutar(async () => {
      const { confirmarPago } = await this.api.graphql<{ confirmarPago: { reciboNumero: number } }>(CONFIRMAR, { id });
      this.aviso.set(`Pago confirmado. Recibo N.º ${confirmarPago.reciboNumero}`);
      this.quitar(id);
    });
  }

  rechazar(id: string, motivo: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.api.graphql(RECHAZAR, { id, motivo });
      this.aviso.set('Pago rechazado');
      this.quitar(id);
    });
  }

  private quitar(id: string): void {
    this.pagos.update((lista) => lista.filter((p) => p.id !== id));
  }
}
