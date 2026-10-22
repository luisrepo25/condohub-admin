import { createApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AdminComponent, type Contexto } from './app/admin.component';

/** Contrato con el shell (frontends/shell/src/remotes/contrato.ts): mount(el, contexto) y unmount(el). */
const ETIQUETA = 'condohub-admin';

// Una sola aplicación Angular y un solo Web Component por página; cada mount agrega un <condohub-admin> al contenedor.
let registro: Promise<void> | undefined;

function registrar(): Promise<void> {
  registro ??= createApplication({ providers: [provideExperimentalZonelessChangeDetection()] }).then((app) => {
    if (!customElements.get(ETIQUETA)) {
      customElements.define(ETIQUETA, createCustomElement(AdminComponent, { injector: app.injector }));
    }
  });
  return registro;
}

export async function mount(el: HTMLElement, contexto: Contexto): Promise<void> {
  await registrar();
  const elemento = Object.assign(document.createElement(ETIQUETA), contexto);
  el.replaceChildren(elemento);
}

export function unmount(el: HTMLElement): void {
  el.replaceChildren();
}
