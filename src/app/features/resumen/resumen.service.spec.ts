import type { Api } from '../../core/api';
import { ResumenService } from './resumen.service';

const AHORA = new Date('2026-11-05T12:00:00Z');

function apiCon(rutas: Record<string, unknown>, datos: Record<string, unknown>): Api {
  return {
    graphql: jest.fn((consulta: string) => {
      const campo = Object.keys(datos).find((c) => consulta.includes(c));
      return campo ? Promise.resolve({ [campo]: datos[campo] }) : Promise.reject(new Error('Gestión respondió 502'));
    }),
    rest: jest.fn((_: string, ruta: string) => (ruta in rutas ? Promise.resolve(rutas[ruta]) : Promise.reject(new Error('503')))),
  } as unknown as Api;
}

describe('ResumenService', () => {
  it('F8_S3_cuenta_lo_que_espera_al_ADMIN_con_lo_que_entregan_los_servicios', async () => {
    const api = apiCon(
      { '/reservas/api/sagas/requieren-revision': [{ id: 's1' }], '/reservas/api/reservas': [], '/reservas/api/areas': [], '/agentes/monitoreo/informes?limite=1': [] },
      { pagosPendientes: [{ id: 'p1' }, { id: 'p2' }], recargosPropuestos: [], morosos: [{ codigo: 'A-103', bloque: 'A', deudaVencida: '810.00', expensasVencidas: 3 }] },
    );
    const s = new ResumenService(api);

    await s.cargar(AHORA);

    expect(s.datos().pagosPendientes).toBe(2);
    expect(s.datos().recargosPropuestos).toBe(0);
    expect(s.datos().sagasEnRevision).toBe(1);
    expect(s.datos().morosos?.[0].deudaVencida).toBe('810.00');
  });

  it('G5_la_deuda_vencida_es_la_de_la_ultima_lectura_sin_calcular_nada_en_el_front', async () => {
    const informe = { resumen: 'Hay 2 pagos', generadoEn: '2026-11-05T08:00:00Z', alertas: [{}], metricas: { deudaVencida: '27000.00' } };
    const s = new ResumenService(apiCon({ '/agentes/monitoreo/informes?limite=1': [informe] }, {}));

    await s.cargar(AHORA);

    expect(s.datos().lectura).toEqual({ resumen: 'Hay 2 pagos', generadoEn: informe.generadoEn, deudaVencida: '27000.00', alertas: 1 });
  });

  it('R8_solo_lista_reservas_confirmadas_futuras_de_la_mas_cercana_a_la_mas_lejana', async () => {
    const reserva = (id: string, inicio: string, estado = 'CONFIRMADA') => ({ id, inicio, estado, areaId: 'a1', unidadId: 'u1' });
    const api = apiCon(
      { '/reservas/api/areas': [{ id: 'a1', nombre: 'Piscina' }], '/reservas/api/reservas': { data: [reserva('r2', '2026-12-01T10:00:00Z'), reserva('r1', '2026-11-20T10:00:00Z'), reserva('r3', '2026-11-21T10:00:00Z', 'CANCELADA'), reserva('r4', '2026-11-01T10:00:00Z')] } },
      {},
    );
    (api.graphql as jest.Mock).mockResolvedValue({ u0: { codigo: 'C-122' } });
    const s = new ResumenService(api);

    await s.cargar(AHORA);

    expect(s.datos().proximasReservas?.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(s.datos().proximasReservas?.[0]).toMatchObject({ area: 'Piscina', unidad: 'C-122' });
  });

  it('si_un_servicio_falla_ese_dato_queda_sin_cifra_y_los_demas_siguen', async () => {
    const s = new ResumenService(apiCon({}, { pagosPendientes: [{ id: 'p1' }] }));

    await s.cargar(AHORA);

    expect(s.datos().pagosPendientes).toBe(1);
    expect(s.datos().morosos).toBeNull();
    expect(s.datos().sagasEnRevision).toBeNull();
    expect(s.datos().lectura).toBeNull();
  });
});
