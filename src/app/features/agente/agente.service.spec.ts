import type { Api } from '../../core/api';
import { AgenteService, resumirDato, type Mision } from './agente.service';

const base: Mision = { id: 'm1', objetivo: 'Gestiona la morosidad del mes', estado: 'EN_CURSO', confirmacionesPendientes: [], pasos: [] };
const pendiente = { id: 'c1', herramienta: 'proponer_recargo', riesgo: 'DINERO', estado: 'PENDIENTE' };

describe('AgenteService (G1-G3)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('G1_lanza_la_mision_de_morosidad_y_sigue_su_avance_hasta_que_espera_al_ADMIN', async () => {
    const rest = jest
      .fn()
      .mockResolvedValueOnce(base)
      .mockResolvedValueOnce({ ...base, estado: 'ESPERANDO_CONFIRMACION', confirmacionesPendientes: [pendiente] });
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.lanzar(base.objetivo);
    expect(rest).toHaveBeenCalledWith('POST', '/agentes/misiones', { tipo: 'GESTIONAR_MOROSIDAD', objetivo: base.objetivo });

    await jest.advanceTimersByTimeAsync(3000);
    expect(servicio.mision()?.estado).toBe('ESPERANDO_CONFIRMACION');
    expect(servicio.mision()?.confirmacionesPendientes).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(10000);
    expect(rest).toHaveBeenCalledTimes(2);
  });

  it('G2_aprobar_una_accion_llama_al_endpoint_y_refresca_la_mision', async () => {
    const rest = jest
      .fn()
      .mockResolvedValueOnce({ ...base, estado: 'ESPERANDO_CONFIRMACION', confirmacionesPendientes: [pendiente] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ ...base, estado: 'COMPLETADA' });
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);
    await servicio.lanzar(base.objetivo);

    await servicio.aprobar('c1');

    expect(rest).toHaveBeenCalledWith('POST', '/agentes/confirmaciones/c1/aprobar');
    expect(servicio.mision()?.estado).toBe('COMPLETADA');
    servicio.detener();
  });

  it('G2_si_la_mision_vuelve_a_EN_CURSO_tras_aprobar_se_reanuda_el_seguimiento', async () => {
    const rest = jest
      .fn()
      .mockResolvedValueOnce({ ...base, estado: 'ESPERANDO_CONFIRMACION', confirmacionesPendientes: [pendiente] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(base)
      .mockResolvedValueOnce({ ...base, estado: 'COMPLETADA' });
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);
    await servicio.lanzar(base.objetivo);
    await servicio.aprobar('c1');

    await jest.advanceTimersByTimeAsync(3000);

    expect(servicio.mision()?.estado).toBe('COMPLETADA');
  });

  it('G5_ejecutar_el_monitoreo_muestra_el_informe', async () => {
    const informe = { id: 'i1', generadoEn: '2026-10-30T12:00:00Z', resumen: 'Sin alertas', alertas: [] };
    const rest = jest.fn().mockResolvedValue(informe);
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.ejecutarMonitoreo();

    expect(rest).toHaveBeenCalledWith('POST', '/agentes/monitoreo/ejecutar');
    expect(servicio.informe()).toEqual(informe);
  });

  it('detener_libera_el_temporizador_al_desmontar', async () => {
    const rest = jest.fn().mockResolvedValue(base);
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);
    await servicio.lanzar(base.objetivo);

    servicio.detener();
    await jest.advanceTimersByTimeAsync(20000);

    expect(rest).toHaveBeenCalledTimes(1);
  });
});

describe('bitácora del agente (G3): entrada y salida de cada paso', () => {
  it('G3_resume_un_objeto_en_una_linea_y_recorta_lo_muy_largo', () => {
    expect(resumirDato(undefined)).toBe('');
    expect(resumirDato(null)).toBe('');
    expect(resumirDato({ unidadId: 'u1' })).toBe('{"unidadId":"u1"}');
    expect(resumirDato({ x: 'a'.repeat(300) })).toHaveLength(120);
    expect(resumirDato({ x: 'a'.repeat(300) }).endsWith('…')).toBe(true);
  });
});
