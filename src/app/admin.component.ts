import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { cargarPerfil, type Perfil } from './perfil';

export interface Contexto {
  getToken: () => string;
  user: { sub: string; nombre: string; email: string };
}

/** Pantalla inicial del remoto: confirma que el login y el token llegan hasta Gestión. Aquí crecen las funciones propias. */
@Component({
  selector: 'ch-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './admin.component.css',
  template: `
    <section class="ch-remoto" data-remoto="admin">
      <header class="ch-cabecera">
        <h1>Consola de administración</h1>
        <p class="ch-sesion">Sesión de {{ user.nombre }} ({{ user.email }})</p>
      </header>
      @if (error(); as mensaje) {
        <p class="ch-error" role="alert">{{ mensaje }}</p>
      }
      @if (perfil(); as p) {
        <div class="ch-tarjeta">
          <p class="ch-etiqueta">Roles: {{ p.roles.join(', ') }}</p>
          @if (p.unidades.length > 0) {
            <h2>Mis unidades</h2>
            <ul class="ch-unidades">
              @for (u of p.unidades; track u.unidadId) {
                <li>
                  <strong>{{ u.codigo }}</strong>
                  <span>Bloque {{ u.bloque }}</span>
                  <span [class]="u.titular ? 'ch-insignia ch-insignia--titular' : 'ch-insignia'">
                    {{ u.titular ? 'Titular' : 'Residente' }}
                  </span>
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
})
export class AdminComponent implements OnInit, Contexto {
  @Input({ required: true }) getToken!: () => string;
  @Input({ required: true }) user!: Contexto['user'];

  readonly perfil = signal<Perfil | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    cargarPerfil(this.getToken)
      .then((p) => this.perfil.set(p))
      .catch((e: unknown) => this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el perfil'));
  }
}
