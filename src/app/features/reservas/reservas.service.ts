import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';
import { codigosDeUnidades } from '../../core/unidades';

interface ReservaCruda {
  id: string; areaId: string; unidadId: string; inicio: string; fin: string; estado: string;
  costoUso: string; garantia: string; cantidadInvitados?: number; motivo?: string | null; version: number;
}
export interface ReservaAdmin extends ReservaCruda { unidad: string; area: string }

/** R8: solo una reserva CONFIRMADA se finaliza. */
export function puedeFinalizar(estado: string): boolean {
  return estado === 'CONFIRMADA';
}

/** Reservas responde con la lista directa o envuelta en `data`, según el endpoint. */
function lista<T>(cuerpo: unknown): T[] {
  const datos = Array.isArray(cuerpo) ? cuerpo : (cuerpo as { data?: unknown } | null)?.data;
  return Array.isArray(datos) ? (datos as T[]) : [];
}

/** R6: el ADMIN ve todas las reservas y marca la finalización; sin daños la garantía se devuelve (nota de crédito en Gestión). */
export class ReservasService extends ConEstado {
  readonly reservas = signal<ReservaAdmin[]>([]);

  constructor(private readonly api: Api) {
    super();
  }

  cargar(): Promise<void> {
    return this.ejecutar(async () => {
      const [cruda, areas] = await Promise.all([
        this.api.rest<unknown>('GET', '/reservas/api/reservas'),
        this.api.rest<unknown>('GET', '/reservas/api/areas'),
      ]);
      const filas = lista<ReservaCruda>(cruda);
      const nombres = new Map(lista<{ id: string; nombre: string }>(areas).map((a) => [a.id, a.nombre]));
      const codigos = await codigosDeUnidades(this.api, filas.map((r) => r.unidadId));
      this.reservas.set(
        filas
          .map((r) => ({ ...r, unidad: codigos.get(r.unidadId) ?? r.unidadId, area: nombres.get(r.areaId) ?? 'Área común' }))
          .sort((a, b) => b.inicio.localeCompare(a.inicio)),
      );
    });
  }

  finalizar(reserva: ReservaAdmin, conDanios: boolean): Promise<void> {
    return this.ejecutar(async () => {
      await this.api.rest('POST', `/reservas/api/reservas/${reserva.id}/finalizar`, { conDanios, version: reserva.version });
      await this.cargar(); // refresca la lista (cargar limpia el aviso, por eso el aviso se pone después)
      if (this.error() !== null) return;
      this.aviso.set(
        conDanios
          ? `Reserva finalizada con daños: la garantía de ${reserva.garantia} se retiene`
          : `Reserva finalizada sin daños: la garantía de ${reserva.garantia} se devuelve`,
      );
    });
  }
}
