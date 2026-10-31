import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';
import { codigosDeUnidades } from '../../core/unidades';

export interface RecargoPropuesto {
  id: string; unidadId: string; unidad: string; periodo: string; porcentaje: string;
  base: string; monto: string; origen: string;
}

const LISTA = '{ recargosPropuestos { id unidadId periodo porcentaje base monto origen } }';
const CONFIRMAR = 'mutation($id: ID!) { confirmarRecargo(propuestaId: $id) { id } }';
const RECHAZAR = 'mutation($id: ID!, $motivo: String) { rechazarRecargo(propuestaId: $id, motivo: $motivo) { id } }';

/** F5/G2: un recargo solo se cobra cuando el ADMIN lo confirma; el cálculo es de Gestión. */
export class RecargosService extends ConEstado {
  readonly recargos = signal<RecargoPropuesto[]>([]);

  constructor(private readonly api: Api) {
    super();
  }

  cargar(): Promise<void> {
    return this.ejecutar(async () => {
      const { recargosPropuestos } = await this.api.graphql<{ recargosPropuestos: Omit<RecargoPropuesto, 'unidad'>[] }>(LISTA);
      const codigos = await codigosDeUnidades(this.api, recargosPropuestos.map((r) => r.unidadId));
      this.recargos.set(recargosPropuestos.map((r) => ({ ...r, unidad: codigos.get(r.unidadId) ?? r.unidadId })));
    });
  }

  confirmar(id: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.api.graphql(CONFIRMAR, { id });
      this.aviso.set('Recargo confirmado: se creó el cargo');
      this.quitar(id);
    });
  }

  rechazar(id: string, motivo: string): Promise<void> {
    return this.ejecutar(async () => {
      await this.api.graphql(RECHAZAR, { id, motivo: motivo || null });
      this.aviso.set('Recargo rechazado: no se cobra');
      this.quitar(id);
    });
  }

  private quitar(id: string): void {
    this.recargos.update((lista) => lista.filter((r) => r.id !== id));
  }
}
