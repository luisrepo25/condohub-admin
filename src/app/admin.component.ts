import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { ConsolaComponent } from './consola/consola.component';
import { cargarPerfil, type Perfil } from './perfil';

export interface Contexto {
  getToken: () => string;
  user: { sub: string; nombre: string; email: string };
}

/** Pantalla inicial del remoto: confirma que el login y el token llegan hasta Gestión. Aquí crecen las funciones propias. */
@Component({
  selector: 'ch-admin',
  standalone: true,
  imports: [ConsolaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './admin.component.css',
  template: `
    <section class="ch-remoto" data-remoto="admin">
      <ch-consola [getToken]="getToken">
        <header class="ch-cabecera">
          <h1>Consola de administración</h1>
          <p class="ch-sesion">Sesión de {{ user.nombre }} ({{ user.email }})@if (perfil(); as p) { · Roles: {{ p.roles.join(', ') }} }</p>
          @if (error(); as mensaje) {
            <p class="ch-error" role="alert">{{ mensaje }}</p>
          }
          @if (perfil()?.unidades?.length) {
            <ul class="ch-unidades" aria-label="Mis unidades">
              @for (u of perfil()?.unidades; track u.unidadId) {
                <li>
                  <strong>{{ u.codigo }}</strong>
                  <span>Bloque {{ u.bloque }}</span>
                  <span [class]="u.titular ? 'ch-insignia-unidad ch-insignia-unidad--titular' : 'ch-insignia-unidad'">
                    {{ u.titular ? 'Titular' : 'Residente' }}
                  </span>
                </li>
              }
            </ul>
          }
        </header>
      </ch-consola>
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
