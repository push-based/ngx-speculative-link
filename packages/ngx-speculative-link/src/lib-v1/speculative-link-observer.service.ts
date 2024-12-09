import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { RouterPreloader } from '@angular/router';

import { PrefetchRegistry } from './prefetch-registry.service';
import type { SpeculativeLinkDirective } from './speculative-link.directive';
import { isPlatformBrowser } from '@angular/common';
import schedule from './schedule';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkObserver {
  #loader = inject(RouterPreloader);
  #registry = inject(PrefetchRegistry);
  #ngZone = inject(NgZone);
  #platformId = inject(PLATFORM_ID);

  readonly #intersectionObserver: IntersectionObserver | undefined;

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      this.#intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;

              const urlTree = this.#registry.elementLink.get(link)?.urlTree();
              if (!urlTree) {
                return;
              }
              if (this.#registry.has(urlTree)) {
                // TODO move preResolve on enter viewport logic
              } else {
                this.#registry.add(urlTree);
                // Idle callback is here to not block the main thread as recommended in the docs
                // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
                schedule(() => this.#loader.preload().subscribe(() => void 0));
              }
            }
          });
        },
        {
          threshold: 0.1,
        }
      );
    }
  }

  register(el: SpeculativeLinkDirective) {
    this.#registry.elementLink.set(el.element, el);
    this.#ngZone.runOutsideAngular(() => {
      this.#intersectionObserver?.observe(el.element);
    });
  }

  unregister(el: SpeculativeLinkDirective) {
    if (el.registeredTree) {
      this.#registry.remove(el.registeredTree);
    }
    if (this.#registry.elementLink.has(el.element)) {
      this.#intersectionObserver?.unobserve(el.element);
      this.#registry.elementLink.delete(el.element);
    }
  }
}
