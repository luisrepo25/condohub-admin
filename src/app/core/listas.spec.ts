import { agruparReservas, buscarPorUnidad, compararDecimales, filtrarRecargos, filtrarReservas, ordenarPagos, soloConAlertas } from './listas';

describe('listas: filtros y orden de la consola', () => {
  describe('buscarPorUnidad', () => {
    const filas = [{ unidad: 'A-132' }, { unidad: 'B-101' }, { unidad: 'a-133' }];

    it('encuentra por parte del código sin importar mayúsculas ni espacios alrededor', () => {
      expect(buscarPorUnidad(filas, '  a-13 ').map((f) => f.unidad)).toEqual(['A-132', 'a-133']);
    });

    it('una búsqueda vacía devuelve todo', () => {
      expect(buscarPorUnidad(filas, '   ')).toHaveLength(3);
    });
  });

  describe('agruparReservas', () => {
    const r = (id: string, estado: string, inicio: string) => ({ id, estado, inicio });
    const todas = [
      r('pasada-cancelada', 'CANCELADA', '2026-11-01T10:00:00Z'),
      r('lejana', 'CONFIRMADA', '2026-12-20T10:00:00Z'),
      r('fallida', 'FALLIDA', '2026-11-30T10:00:00Z'),
      r('cercana', 'CONFIRMADA', '2026-11-12T10:00:00Z'),
      r('finalizada', 'FINALIZADA', '2026-11-05T10:00:00Z'),
      r('solicitada', 'SOLICITADA', '2026-11-15T10:00:00Z'),
    ];

    it('R8_las_vivas_van_en_proximas_de_la_mas_cercana_a_la_mas_lejana', () => {
      expect(agruparReservas(todas).proximas.map((x) => x.id)).toEqual(['cercana', 'solicitada', 'lejana']);
    });

    it('R8_las_terminadas_van_en_anteriores_de_la_mas_reciente_a_la_mas_antigua', () => {
      expect(agruparReservas(todas).anteriores.map((x) => x.id)).toEqual(['fallida', 'finalizada', 'pasada-cancelada']);
    });

    it('una confirmada que ya pasó sigue en próximas: el ADMIN todavía tiene que finalizarla', () => {
      const g = agruparReservas([r('vieja', 'CONFIRMADA', '2026-01-01T10:00:00Z')]);

      expect(g.proximas.map((x) => x.id)).toEqual(['vieja']);
    });

    it('sin reservas ambos grupos están vacíos', () => {
      expect(agruparReservas([])).toEqual({ proximas: [], anteriores: [] });
    });
  });

  describe('compararDecimales y ordenarPagos', () => {
    it('F10_compara_dinero_como_texto_decimal_sin_pasar_por_float', () => {
      expect(compararDecimales('1000.00', '999.99')).toBeGreaterThan(0);
      expect(compararDecimales('50', '50.00')).toBe(0);
      expect(compararDecimales('0.10', '0.2')).toBeLessThan(0);
      expect(compararDecimales('12345678901234.55', '12345678901234.54')).toBeGreaterThan(0);
    });

    const p = (id: string, monto: string, fechaPago: string) => ({ id, monto, fechaPago });
    const pagos = [p('a', '300.00', '2026-11-05'), p('b', '1200.50', '2026-11-01'), p('c', '90.00', '2026-11-07')];

    it('F8_mas_antiguos_primero_para_conciliar_lo_que_lleva_mas_tiempo', () => {
      expect(ordenarPagos(pagos, 'antiguos').map((x) => x.id)).toEqual(['b', 'a', 'c']);
    });

    it('más recientes primero y mayor monto primero', () => {
      expect(ordenarPagos(pagos, 'recientes').map((x) => x.id)).toEqual(['c', 'a', 'b']);
      expect(ordenarPagos(pagos, 'monto').map((x) => x.id)).toEqual(['b', 'a', 'c']);
    });

    it('no modifica la lista original', () => {
      const copia = [...pagos];
      ordenarPagos(pagos, 'monto');

      expect(pagos).toEqual(copia);
    });
  });

  describe('soloConAlertas', () => {
    const informes = [{ id: '1', alertas: [] }, { id: '2', alertas: [{}] }];

    it('G5_deja_solo_los_informes_con_alertas_cuando_se_pide', () => {
      expect(soloConAlertas(informes, true).map((i) => i.id)).toEqual(['2']);
      expect(soloConAlertas(informes, false)).toHaveLength(2);
    });
  });

  describe('filtrarRecargos', () => {
    const rs = [
      { unidad: 'A-132', origen: 'AGENTE' },
      { unidad: 'A-133', origen: 'SISTEMA' },
      { unidad: 'B-101', origen: 'AGENTE' },
    ];

    it('F5_filtra_por_quien_propuso_el_recargo', () => {
      expect(filtrarRecargos(rs, { busqueda: '', origen: 'AGENTE' }).map((r) => r.unidad)).toEqual(['A-132', 'B-101']);
    });

    it('combina unidad y origen, y TODOS no filtra por origen', () => {
      expect(filtrarRecargos(rs, { busqueda: 'a-13', origen: 'AGENTE' }).map((r) => r.unidad)).toEqual(['A-132']);
      expect(filtrarRecargos(rs, { busqueda: 'a-13', origen: 'TODOS' })).toHaveLength(2);
    });
  });

  describe('filtrarReservas', () => {
    const rs = [
      { unidad: 'A-132', estado: 'CONFIRMADA', area: 'Piscina' },
      { unidad: 'A-132', estado: 'CANCELADA', area: 'Salón de eventos' },
      { unidad: 'B-101', estado: 'CONFIRMADA', area: 'Salón de eventos' },
    ];
    const todos = { busqueda: '', estado: 'TODOS', area: 'TODOS' };

    it('R8_filtra_por_estado_area_y_unidad_combinados', () => {
      expect(filtrarReservas(rs, { ...todos, estado: 'CONFIRMADA' })).toHaveLength(2);
      expect(filtrarReservas(rs, { ...todos, area: 'Salón de eventos' })).toHaveLength(2);
      expect(filtrarReservas(rs, { busqueda: 'a-132', estado: 'CONFIRMADA', area: 'Piscina' })).toHaveLength(1);
    });

    it('sin filtros devuelve todo', () => {
      expect(filtrarReservas(rs, todos)).toHaveLength(3);
    });
  });
});
