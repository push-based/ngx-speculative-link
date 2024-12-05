import { Injectable, NgZone, inject } from '@angular/core';
import { RouterPreloader } from '@angular/router';

import { PrefetchRegistry } from './prefetch-registry.service';
import type { SpeculativeLinkDirective } from './speculative-link.directive';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkObserver {
  #loader = inject(RouterPreloader);
  #registry = inject(PrefetchRegistry);
  #ngZone = inject(NgZone);

  #elementLink = new Map<Element, SpeculativeLinkDirective>();

  #intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;

          const urlTree = this.#elementLink.get(link)?.urlTree();
          if (!urlTree) {
            return;
          }
          if (this.#registry.has(urlTree)) {
            this.#registry.preResolve(urlTree);
          } else {
            this.#registry.add(urlTree);
            // Idle callback is here to not block the main thread as recommended in the docs
            // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
            requestIdleCallback(() => {
              this.#loader.preload().subscribe(() => void 0);
            });
          }
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  register(el: SpeculativeLinkDirective) {
    this.#elementLink.set(el.element, el);
    this.#ngZone.runOutsideAngular(() => {
      this.#intersectionObserver.observe(el.element);
    });
  }

  unregister(el: SpeculativeLinkDirective) {
    if (el.registeredTree) {
      this.#registry.remove(el.registeredTree);
    }
    if (this.#elementLink.has(el.element)) {
      this.#intersectionObserver.unobserve(el.element);
      this.#elementLink.delete(el.element);
    }
  }
}
