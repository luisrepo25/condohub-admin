import type { Api } from '../../core/api';
import { ReportesService } from './reportes.service';

describe('ReportesService: la orden escrita (G4)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('G4_envia_la_instruccion_escrita_sin_audio_y_sigue_el_reporte_hasta_que_esta_listo', async () => {
    const rest = jest
      .fn()
      .mockResolvedValueOnce({ id: 'rep1', estado: 'PROCESANDO' })
      .mockResolvedValueOnce({ id: 'rep1', estado: 'LISTO', vistaPrevia: { columnas: ['codigo'], filas: [['B-101']], total: 1 } });
    const servicio = new ReportesService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.crearPorTexto('  morosidad por bloque  ', 'PDF');

    const [metodo, ruta, cuerpo] = rest.mock.calls[0] as [string, string, FormData];
    expect([metodo, ruta]).toEqual(['POST', '/ia/reportes/voz']);
    expect(cuerpo.get('instruccion')).toBe('morosidad por bloque');
    expect(cuerpo.get('formato')).toBe('PDF');
    expect(cuerpo.has('audio')).toBe(false);

    await jest.advanceTimersByTimeAsync(2000);
    expect(servicio.reporte()?.vistaPrevia?.total).toBe(1);
    servicio.detener();
  });

  it('G4_una_instruccion_vacia_no_llega_al_servicio', async () => {
    const rest = jest.fn();
    const servicio = new ReportesService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.crearPorTexto('   ', 'EXCEL');

    expect(servicio.error()).toContain('instrucción');
    expect(rest).not.toHaveBeenCalled();
  });

  it('G4_si_el_servicio_rechaza_una_orden_de_escritura_se_muestra_el_codigo_G4', async () => {
    const rest = jest.fn().mockRejectedValue(new Error('La consulta no es de solo lectura (G4)'));
    const servicio = new ReportesService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.crearPorTexto('borra todas las unidades', 'EXCEL');

    expect(servicio.error()).toContain('G4');
    expect(servicio.reporte()).toBeNull();
  });
});
