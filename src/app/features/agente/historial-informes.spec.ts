import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Api } from '../../core/api';
import { AgenteService, type Informe } from './agente.service';
import { MonitoreoPanel } from './monitoreo.panel';

const informe = (id: string, resumen: string, alertas = 0): Informe => ({
  id, generadoEn: '2026-10-31T12:00:00Z', resumen, alertas: Array.from({ length: alertas }, () => ({ tipo: 'X', severidad: 'ALTA', mensaje: 'm' })),
});

describe('AgenteService: historial del monitoreo (G5)', () => {
  it('G5_carga_los_ultimos_informes_del_mas_reciente_al_mas_antiguo', async () => {
    const rest = jest.fn().mockResolvedValue([informe('i2', 'segundo'), informe('i1', 'primero')]);
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.cargarInformes();

    expect(rest).toHaveBeenCalledWith('GET', '/agentes/monitoreo/informes?limite=10');
    expect(servicio.historial().map((i) => i.id)).toEqual(['i2', 'i1']);
  });

  it('G5_si_el_servicio_falla_se_muestra_el_error_y_el_historial_queda_vacio', async () => {
    const rest = jest.fn().mockRejectedValue(new Error('Agentes respondió 503'));
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.cargarInformes();

    expect(servicio.error()).toContain('503');
    expect(servicio.historial()).toEqual([]);
  });
});

describe('MonitoreoPanel: se ve el historial', () => {
  async function pintar(rest: jest.Mock): Promise<{ el: HTMLElement; servicio: AgenteService }> {
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);
    const fixture = TestBed.createComponent(MonitoreoPanel);
    fixture.componentRef.setInput('servicio', servicio);
    await fixture.whenStable();
    await servicio.cargarInformes();
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, servicio };
  }

  it('G5_lista_cada_informe_con_su_resumen_y_cuantas_alertas_tuvo', async () => {
    const { el } = await pintar(jest.fn().mockResolvedValue([informe('i2', 'Hay 2 pagos sin conciliar', 1), informe('i1', 'Sin novedades')]));

    const filas = Array.from(el.querySelectorAll('.ch-historial li')).map((f) => f.textContent?.replace(/\s+/g, ' ').trim());

    expect(filas).toHaveLength(2);
    expect(filas[0]).toContain('Hay 2 pagos sin conciliar');
    expect(filas[0]).toContain('1 alerta');
    expect(filas[1]).toContain('Sin alertas');
  });

  it('sin_informes_dice_que_todavia_no_hay', async () => {
    const { el } = await pintar(jest.fn().mockResolvedValue([]));

    expect(el.textContent).toContain('Todavía no hay informes');
  });

  it('G5_ejecutar_ahora_corre_el_agente_y_refresca_el_historial', async () => {
    const nuevo = informe('i9', 'recién ejecutado');
    const rest = jest.fn(async (metodo: string, ruta: string) => (metodo === 'POST' ? nuevo : ruta.includes('informes') ? [nuevo] : {}));
    const { el } = await pintar(rest as unknown as jest.Mock);

    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Ejecutar ahora')) as HTMLButtonElement).click();
    for (let i = 0; i < 50 && !(el.textContent ?? '').includes('recién ejecutado'); i++) await new Promise((r) => setTimeout(r, 10));

    expect(rest).toHaveBeenCalledWith('POST', '/agentes/monitoreo/ejecutar');
    expect(rest.mock.calls.filter(([m, r]) => m === 'GET' && String(r).includes('informes')).length).toBeGreaterThanOrEqual(2);
    expect(el.querySelectorAll('.ch-historial li').length).toBe(1);
  });
});
