import { signal } from '@angular/core';
import type { Api } from '../../core/api';
import { ConEstado } from '../../core/operacion';

export interface Confirmacion { id: string; herramienta: string; argumentos?: Record<string, unknown>; riesgo: string; estado: string }
export interface Paso {
  paso: number; tipo: string; fecha?: string; herramienta?: string | null; confirmadoPor?: string | null;
  entrada?: Record<string, unknown> | null; salida?: Record<string, unknown> | null;
}
export interface Mision {
  id: string; objetivo: string; estado: string; resumen?: string | null;
  confirmacionesPendientes: Confirmacion[]; pasos: Paso[];
}
export interface Alerta { tipo: string; severidad: string; mensaje: string }
export interface Metricas { unidadesMorosas: number; deudaVencida: string; pagosPendientes: number; diasPagoMasAntiguo: number }
export interface Informe {
  id: string; generadoEn: string; resumen: string; alertas: Alerta[];
  origen?: string; notificado?: boolean; lineaBase?: boolean; metricas?: Metricas;
}

const INTERVALO_MS = 3000;
const MAX_RESUMEN = 120;

/** G3: entrada o salida de un paso en una sola línea, para leer la bitácora sin abrir cada JSON. */
export function resumirDato(dato: Record<string, unknown> | null | undefined): string {
  if (!dato) return '';
  const texto = JSON.stringify(dato);
  return texto.length > MAX_RESUMEN ? texto.slice(0, MAX_RESUMEN - 1) + '…' : texto;
}
/** Estados en los que el agente sigue trabajando: se consulta hasta que termine o espere al ADMIN (G2). */
const ACTIVA = 'EN_CURSO';

/** G1–G3 y G5: lanza la misión, muestra su bitácora y deja al ADMIN aprobar o rechazar lo que escribe o mueve dinero. */
export class AgenteService extends ConEstado {
  readonly mision = signal<Mision | null>(null);
  readonly informe = signal<Informe | null>(null);
  readonly historial = signal<Informe[]>([]);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly api: Api) {
    super();
  }

  lanzar(objetivo: string): Promise<void> {
    return this.ejecutar(async () => {
      const m = await this.api.rest<Partial<Mision> & Pick<Mision, 'id' | 'objetivo' | 'estado'>>('POST', '/agentes/misiones', { tipo: 'GESTIONAR_MOROSIDAD', objetivo });
      this.mision.set({ ...m, confirmacionesPendientes: m.confirmacionesPendientes ?? [], pasos: m.pasos ?? [] });
      this.vigilar(m.id);
    });
  }

  aprobar(id: string): Promise<void> {
    return this.resolver(id, 'aprobar');
  }

  rechazar(id: string): Promise<void> {
    return this.resolver(id, 'rechazar');
  }

  ejecutarMonitoreo(): Promise<void> {
    return this.ejecutar(async () => {
      this.informe.set(await this.api.rest<Informe>('POST', '/agentes/monitoreo/ejecutar'));
    });
  }

  /** G5: los últimos informes del agente de monitoreo, del más reciente al más antiguo. */
  cargarInformes(): Promise<void> {
    return this.ejecutar(async () => {
      this.historial.set(await this.api.rest<Informe[]>('GET', '/agentes/monitoreo/informes?limite=10'));
    });
  }

  /** Libera el sondeo al desmontar la pantalla (el shell monta y desmonta remotos). */
  detener(): void {
    clearTimeout(this.temporizador);
    this.temporizador = undefined;
  }

  private resolver(id: string, accion: 'aprobar' | 'rechazar'): Promise<void> {
    return this.ejecutar(async () => {
      try {
        await this.api.rest('POST', `/agentes/confirmaciones/${id}/${accion}`);
      } catch (e) {
        // «Ya fue resuelta» (G2): la lista que se ve está vieja; se refresca para no dejar botones que ya no valen.
        const vista = this.mision();
        if (vista) await this.actualizar(vista.id);
        throw e;
      }
      const actual = this.mision();
      if (actual) await this.actualizar(actual.id);
    });
  }

  private vigilar(id: string): void {
    this.detener();
    this.temporizador = setTimeout(() => {
      this.temporizador = undefined;
      void this.actualizar(id);
    }, INTERVALO_MS);
  }

  /** Consulta la misión y, mientras el agente siga trabajando, programa la siguiente consulta. */
  private async actualizar(id: string): Promise<void> {
    try {
      this.mision.set(await this.api.rest<Mision>('GET', `/agentes/misiones/${id}`));
      if (this.mision()?.estado === ACTIVA) this.vigilar(id);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo consultar la misión');
    }
  }
}
