import { mount, unmount } from '../remoteEntry';

const usuario = { sub: 'sub-1', nombre: 'Persona Demo', email: 'demo@condohub.test' };
const perfilAdmin = { data: { miPerfil: { roles: ['ADMIN'], personaId: null, nombre: null, unidades: [] } } };

function respuesta(data: unknown, ok = true) {
  return jest.fn(() => Promise.resolve({ ok, status: ok ? 200 : 502, json: () => Promise.resolve(data) }));
}

async function esperar(condicion: () => boolean) {
  for (let i = 0; i < 100 && !condicion(); i++) await new Promise((r) => setTimeout(r, 10));
  expect(condicion()).toBe(true);
}

describe('remoto admin', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mount pinta la sesión y el perfil de Gestión con el token del shell', async () => {
    const fetchFalso = respuesta(perfilAdmin);
    globalThis.fetch = fetchFalso as unknown as typeof fetch;
    const el = document.body.appendChild(document.createElement('div'));

    await mount(el, { getToken: () => 'token-del-shell', user: usuario });

    await esperar(() => (el.textContent ?? '').includes('Roles: ADMIN'));
    expect(el.textContent).toContain('Sesión de Persona Demo (demo@condohub.test)');
    const [, opciones] = fetchFalso.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(opciones.headers['authorization']).toBe('Bearer token-del-shell');
  });

  it('si Gestión no responde muestra el error sin romper el shell', async () => {
    globalThis.fetch = respuesta({}, false) as unknown as typeof fetch;
    const el = document.body.appendChild(document.createElement('div'));

    await mount(el, { getToken: () => 't', user: usuario });

    await esperar(() => el.querySelector('[role="alert"]') !== null);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('502');
  });

  it('unmount deja vacío el contenedor', async () => {
    globalThis.fetch = respuesta(perfilAdmin) as unknown as typeof fetch;
    const el = document.body.appendChild(document.createElement('div'));
    await mount(el, { getToken: () => 't', user: usuario });
    await esperar(() => (el.textContent ?? '').includes('Roles: ADMIN'));

    unmount(el);

    expect(el.innerHTML).toBe('');
  });
});
