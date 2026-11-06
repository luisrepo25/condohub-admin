import { fechaCorta } from './formato';

describe('fechaCorta', () => {
  it('ordena día, mes y año sin cambiar de día', () => {
    expect(fechaCorta('2026-10-13')).toBe('13/10/2026');
  });

  it('deja tal cual lo que no es una fecha ISO', () => {
    expect(fechaCorta('sin fecha')).toBe('sin fecha');
  });
});
