import { inject, Injectable } from '@angular/core';
import {
  PreloadingStrategy,
  Route,
  RouteConfigLoadEnd,
  Router,
  Routes,
  withPreloading,
} from '@angular/router';
import { SpeculativeLinkRegistry } from '@ngx-speculative-link/ngx-speculative-link';
import { EMPTY, filter, map, Observable, tap } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { PreResolverRegistryService } from './pre-resolver-registry.service';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkPreloadingStrategy implements PreloadingStrategy {
  #loadingRoutes = new Set<Route>();
  #linkRegistry = inject(SpeculativeLinkRegistry);
  #document = inject(DOCUMENT);
  router = inject(Router);
  #preResolverRegistry = inject(PreResolverRegistryService);

  constructor(router: Router) {
    router.events
      .pipe(
        filter(
          (event): event is RouteConfigLoadEnd =>
            event instanceof RouteConfigLoadEnd
        ),
        tap((event) => {
          /**
           * The idleCallback is necessary because routes have loaded but not yet processed, the fields we
           * access to load the preResolvers and the required data like _loadRoutes are only present after
           * it's done processing.
           */
          requestIdleCallback(() => {
            this.#preResolverRegistry.registerPreResolverRoutes(event.route);
          });
        })
      )
      .subscribe();
  }

  preload(route: Route, load: () => Observable<void>) {
    console.log(this.router.config);
    // Prevent if route is already being downloaded
    if (this.#loadingRoutes.has(route)) {
      return EMPTY;
    }

    // Prevent if user has show internet connection
    if (this.lowBandwidth()) {
      return EMPTY;
    }

    // Prevent if route is marked as excluded
    if (route.data && route.data['preload'] === false) {
      return EMPTY;
    }

    if (this.#linkRegistry.intersectingElements.size === 0) {
      return EMPTY;
    }

    // TODO implement logic to see if route matches registered routes

    this.#loadingRoutes.add(route);

    return load();
  }

  lowBandwidth() {
    const window = this.#document.defaultView;
    if (window && 'connection' in window) {
      // TODO implement proper type https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection
      // @ts-ignore
      const { effectiveType, saveData } = window.navigator.connection as {
        effectiveType: string;
        saveData: boolean;
      };
      return (effectiveType || '').includes('2g') || saveData;
    }
    return false;
  }
}

export const withSpeculativeLinkPreloading = () =>
  withPreloading(SpeculativeLinkPreloadingStrategy);
