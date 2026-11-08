import type { Api } from '../../core/api';
import { AgenteService } from './agente.service';

describe('G2_confirmacion_ya_resuelta', () => {
  it('G2_si_la_confirmacion_ya_fue_resuelta_se_refresca_la_mision_y_se_muestra_el_error', async () => {
    const mision = { id: 'm1', objetivo: 'x', estado: 'ESPERANDO_CONFIRMACION', confirmacionesPendientes: [], pasos: [] };
    const rest = jest.fn((metodo: string, ruta: string) => {
      if (metodo === 'POST' && ruta.includes('/confirmaciones/')) return Promise.reject(new Error('La confirmación ya fue resuelta (G2)'));
      if (metodo === 'POST') return Promise.resolve(mision);
      return Promise.resolve({ ...mision, estado: 'TERMINADA' });
    });
    const servicio = new AgenteService({ rest, graphql: jest.fn() } as unknown as Api);
    await servicio.lanzar('x');

    await servicio.aprobar('c1');

    expect(rest).toHaveBeenCalledWith('GET', '/agentes/misiones/m1');
    expect(servicio.mision()?.estado).toBe('TERMINADA');
    expect(servicio.error()).toContain('ya fue resuelta');
    servicio.detener();
  });
});
