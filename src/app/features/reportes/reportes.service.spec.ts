import type { Api } from '../../core/api';
import { ReportesService } from './reportes.service';

describe('ReportesService (G4)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('G4_envia_el_audio_al_servicio_IA_y_espera_el_archivo_listo', async () => {
    const rest = jest
      .fn()
      .mockResolvedValueOnce({ id: 'rep1', estado: 'PROCESANDO' })
      .mockResolvedValueOnce({ id: 'rep1', estado: 'LISTO', archivoUrl: 'http://s3/reporte.xlsx', transcripcion: 'morosos' });
    const servicio = new ReportesService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.crear(new Blob(['audio']), 'EXCEL');

    const [metodo, ruta, cuerpo] = rest.mock.calls[0] as [string, string, FormData];
    expect([metodo, ruta]).toEqual(['POST', '/ia/reportes/voz']);
    expect(cuerpo.get('formato')).toBe('EXCEL');
    expect(cuerpo.get('audio')).toBeInstanceOf(Blob);

    await jest.advanceTimersByTimeAsync(2000);
    expect(rest).toHaveBeenLastCalledWith('GET', '/ia/reportes/rep1');
    expect(servicio.reporte()?.archivoUrl).toBe('http://s3/reporte.xlsx');

    await jest.advanceTimersByTimeAsync(10000);
    expect(rest).toHaveBeenCalledTimes(2);
  });

  it('G4_una_consulta_que_no_es_de_solo_lectura_se_muestra_con_su_codigo', async () => {
    const rest = jest.fn().mockRejectedValue(new Error('La consulta no es de solo lectura (G4)'));
    const servicio = new ReportesService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.crear(new Blob(['audio']), 'PDF');

    expect(servicio.error()).toContain('G4');
    expect(servicio.reporte()).toBeNull();
  });
});
