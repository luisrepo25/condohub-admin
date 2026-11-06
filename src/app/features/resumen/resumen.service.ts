import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { codigosDeUnidades } from '../../core/unidades';

export interface MorosoResumen { codigo: string; bloque: string; deudaVencida: string; expensasVencidas: number }
export interface ReservaResumen { id: string; area: string; unidad: string; inicio: string }
export interface LecturaAgente { resumen: string; generadoEn: string; deudaVencida: string | null; alertas: number }

export interface Resumen {
  pagosPendientes: number | null;
  recargosPropuestos: number | null;
  sagasEnRevision: number | null;
  morosos: MorosoResumen[] | null;
  proximasReservas: ReservaResumen[] | null;
  lectura: LecturaAgente | null;
}

const VACIO: Resumen = { pagosPendientes: null, recargosPropuestos: null, sagasEnRevision: null, morosos: null, proximasReservas: null, lectura: null };
const MAX_LISTA = 3;

interface ReservaCruda { id: string; areaId: string; unidadId: string; inicio: string; estado: string }
interface InformeCrudo { resumen: string; generadoEn: string; alertas?: unknown[]; metricas?: { deudaVencida?: string } }

function lista<T>(cuerpo: unknown): T[] | null {
  const datos = Array.isArray(cuerpo) ? cuerpo : (cuerpo as { data?: unknown } | null)?.data;
  return Array.isArray(datos) ? (datos as T[]) : null;
}

/** Devuelve `null` si el dato no llegó: el resumen nunca rompe la consola ni inventa una cifra. */
async function intentar<T>(leer: () => Promise<T | null | undefined>): Promise<T | null> {
  try {
    return (await leer()) ?? null;
  } catch {
    return null;
  }
}

function aLectura(informe: InformeCrudo | undefined): LecturaAgente | null {
  if (!informe) return null;
  return { resumen: informe.resumen, generadoEn: informe.generadoEn, deudaVencida: informe.metricas?.deudaVencida ?? null, alertas: informe.alertas?.length ?? 0 };
}

/** Reúne lo que espera al ADMIN. Solo cuenta y ordena lo que entregan los servicios; no calcula montos ni morosidad. */
export class ResumenService {
  readonly datos = signal<Resumen>(VACIO);

  constructor(private readonly api: Api) {}

  async cargar(ahora = new Date()): Promise<void> {
    const [pagos, recargos, morosos, sagas, informes, proximas] = await Promise.all([
      intentar(() => this.contar('pagosPendientes')),
      intentar(() => this.contar('recargosPropuestos')),
      intentar(() => this.morosos()),
      intentar(async () => lista(await this.api.rest<unknown>('GET', '/reservas/api/sagas/requieren-revision'))?.length),
      intentar(async () => lista<InformeCrudo>(await this.api.rest<unknown>('GET', '/agentes/monitoreo/informes?limite=1'))),
      intentar(() => this.proximasReservas(ahora)),
    ]);
    this.datos.set({ pagosPendientes: pagos, recargosPropuestos: recargos, sagasEnRevision: sagas, morosos, proximasReservas: proximas, lectura: aLectura(informes?.[0]) });
  }

  private async contar(campo: string): Promise<number | undefined> {
    const datos = await this.api.graphql<Record<string, unknown[] | undefined>>(`{ ${campo} { id } }`);
    return datos[campo]?.length;
  }

  private async morosos(): Promise<MorosoResumen[] | undefined> {
    const datos = await this.api.graphql<{ morosos?: MorosoResumen[] }>('{ morosos { codigo bloque deudaVencida expensasVencidas } }');
    return datos.morosos;
  }

  private async proximasReservas(ahora: Date): Promise<ReservaResumen[] | null> {
    const [crudas, areas] = await Promise.all([
      this.api.rest<unknown>('GET', '/reservas/api/reservas'),
      this.api.rest<unknown>('GET', '/reservas/api/areas'),
    ]);
    const proximas = (lista<ReservaCruda>(crudas) ?? [])
      .filter((r) => r.estado === 'CONFIRMADA' && new Date(r.inicio) > ahora)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .slice(0, MAX_LISTA);
    const nombres = new Map((lista<{ id: string; nombre: string }>(areas) ?? []).map((a) => [a.id, a.nombre]));
    const codigos = await codigosDeUnidades(this.api, proximas.map((r) => r.unidadId));
    return proximas.map((r) => ({ id: r.id, inicio: r.inicio, area: nombres.get(r.areaId) ?? 'Área común', unidad: codigos.get(r.unidadId) ?? r.unidadId }));
  }
}
