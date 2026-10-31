import type { Api } from '../../core/api';
import { SagasService } from './sagas.service';

describe('SagasService (S3)', () => {
  it('S3_lista_las_sagas_que_requieren_revision_de_Reservas', async () => {
    const saga = { id: 's1', reservaId: 'r1', estado: 'REQUIERE_REVISION', pasoActual: 3, ultimoError: 'Acceso no responde' };
    const rest = jest.fn().mockResolvedValue([saga]);
    const servicio = new SagasService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.cargar();

    expect(rest).toHaveBeenCalledWith('GET', '/reservas/api/sagas/requieren-revision');
    expect(servicio.sagas()).toEqual([saga]);
  });

  it('S3_si_Reservas_no_responde_muestra_el_error', async () => {
    const rest = jest.fn().mockRejectedValue(new Error('Reservas respondió 503'));
    const servicio = new SagasService({ rest, graphql: jest.fn() } as unknown as Api);

    await servicio.cargar();

    expect(servicio.error()).toContain('503');
  });
});
