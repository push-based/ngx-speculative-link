import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { Router, UrlTree } from '@angular/router';

import { SpeculativeLinkObserver } from './speculative-link-observer.service';
import { DOCUMENT } from '@angular/common';

/**
 *
 * Inspired by the [Speculation Rules API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API}
 *
 * @whatItDoes When the link is observed in the viewport it will preload its route and execute its preResolvers.
 *
 */

@Directive({ selector: '[vnSpeculativeLink]', standalone: true })
export class SpeculativeLinkDirective implements OnDestroy {
  path = input.required<string>({ alias: 'vnSpeculativeLink' });
  #document = inject(DOCUMENT);

  readonly #router = inject(Router);

  readonly #observer = inject(SpeculativeLinkObserver);

  registeredTree: UrlTree | null = null;

  urlTree = computed(() => {
    const path = this.path();

    if (!path) {
      return null;
    }

    return this.parseUrl(path);
  });

  private parseUrl(path: string): UrlTree | null {
    if (!path.includes('http')) {
      return this.#router.parseUrl(path);
    }
    const url = new URL(path);
    if (this.#document.location.hostname !== url.hostname) {
      return null;
    }
    return this.#router.parseUrl(url.pathname);
  }

  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  #register = effect(() => {
    this.#observer.unregister(this);
    if (this.urlTree()) {
      this.#observer.register(this);
    }
    this.registeredTree = this.urlTree();
  });

  ngOnDestroy() {
    this.#observer.unregister(this);
    this.#register.destroy();
  }
}
