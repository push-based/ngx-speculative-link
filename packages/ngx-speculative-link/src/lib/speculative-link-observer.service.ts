import { inject, Injectable, NgZone } from '@angular/core';
import type { SpeculativeLink } from '@ngx-speculative-link/ngx-speculative-link';
import { SpeculativeLinkRegistry } from './speculative-link-registry.service';
import schedule from './schedule';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkObserver {
  readonly #ngZone = inject(NgZone);
  readonly #linkRegistry = inject(SpeculativeLinkRegistry);

  readonly observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = this.#linkRegistry.registeredElements.get(entry.target)!;
        if (entry.isIntersecting) {
          this.#linkRegistry.intersectingElements.add(target);

          schedule(() => target.onEnterViewport());
        } else if (this.#linkRegistry.intersectingElements.has(target)) {
          this.#linkRegistry.intersectingElements.delete(target);

          schedule(() => target.onExitViewport());
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  register(el: SpeculativeLink): void {
    if (!this.#linkRegistry.registeredElements.has(el.element)) {
      this.#linkRegistry.registeredElements.set(el.element, el);

      this.#ngZone.runOutsideAngular(() => {
        this.observer.observe(el.element);
      });
    } else if (this.#linkRegistry.intersectingElements.has(el)) {
      el.onEnterViewport();
    }
  }

  unregister(el: SpeculativeLink): void {
    this.#linkRegistry.registeredElements.delete(el.element);

    if (this.#linkRegistry.intersectingElements.has(el)) {
      this.#linkRegistry.intersectingElements.delete(el);

      el.onExitViewport();
    }
  }
}
