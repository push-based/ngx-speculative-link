import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { SpeculativeLinkRegistry } from './speculative-link-registry.service';
import { RouterPreloader } from '@angular/router';
import { RouteWithPreResolver } from './models';

@Directive({
  selector: '[speculativeLink]',
  standalone: true,
})
export class SpeculativeLink implements OnDestroy {
  readonly ref = input(null, {
    alias: 'speculativeLink',
    transform: this.parseRef,
  });

  #loader = inject(RouterPreloader);

  readonly registry = inject(SpeculativeLinkRegistry);

  readonly path = computed(() => {
    // @TODO this should have an external service with is a parser
    return this.parseRef(this.ref());
  });

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  parseRef(ref: string | null): string | null {
    if (ref === undefined) {
      return null;
    }

    return ref;
  }

  constructor() {
    effect(() => {
      const path = this.path();

      if (path === null) {
        return this.registry.unregister(this);
      }

      return this.registry.register(this);
    });
  }

  ngOnDestroy() {
    this.registry.unregister(this);
  }

  preResolverRoutes = new Set<RouteWithPreResolver>();
  onRegisteredPreResolver(route: RouteWithPreResolver) {
    this.preResolverRoutes.add(route);
  }

  onEnterViewport() {
    console.log('onEnterViewport');

    this.#loader.preload();
    this.preResolverRoutes.forEach((route: RouteWithPreResolver) => {});
    // @TODO
    // Should trigger route preloading
  }

  onExitViewport() {
    console.trace('onExitViewport');
    // @TODO
    // Should trigger preResolver onExitViewport
  }
}
