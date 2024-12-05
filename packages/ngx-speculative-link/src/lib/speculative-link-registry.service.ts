import { inject, Injectable, NgZone } from '@angular/core';
import type { SpeculativeLink } from './speculative-link.directive';

@Injectable({ providedIn: 'root' })
export class SpeculativeLinkRegistry {
  readonly #ngZone = inject(NgZone);

  readonly registeredElements = new WeakMap<Element, SpeculativeLink>();
  readonly intersectingElements = new Set<SpeculativeLink>();

  readonly observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = this.registeredElements.get(entry.target)!;
        if (entry.isIntersecting) {
          this.intersectingElements.add(target);

          // @TODO this should be scheduled
          target.onEnterViewport();
        } else {
          if (this.intersectingElements.has(target)) {
            this.intersectingElements.delete(target);

            // @TODO this should be scheduled
            target.onExitViewport();
          }
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  register(el: SpeculativeLink): void {
    if (!this.registeredElements.has(el.element)) {
      this.registeredElements.set(el.element, el);

      this.#ngZone.runOutsideAngular(() => {
        this.observer.observe(el.element);
      });
    } else if (this.intersectingElements.has(el)) {
      el.onEnterViewport();
    }
  }

  unregister(el: SpeculativeLink): void {
    this.registeredElements.delete(el.element);

    if (this.intersectingElements.has(el)) {
      this.intersectingElements.delete(el);

      el.onExitViewport();
    }
  }
}
