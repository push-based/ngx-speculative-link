import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterPreloader, UrlTree } from '@angular/router';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { SpeculativeLinkObserver } from './speculative-link-observer.service';
import {
  PreResolver,
  PreResolverRegistry,
} from './pre-resolver-registry.service';
import { filter, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

/**
 *
 * Inspired by the [Speculation Rules API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API}
 *
 * @whatItDoes When the link is observed in the viewport it will preload its route and execute its preResolvers.
 *
 */

@Directive({
  standalone: true,
  selector: '[speculativeLink]',
})
export class SpeculativeLink {
  readonly ref = input.required<string>({ alias: 'speculativeLink' });

  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #loader = inject(RouterPreloader);
  public readonly element: HTMLElement = inject(ElementRef).nativeElement;

  readonly #observer = inject(SpeculativeLinkObserver);
  readonly #preResolverRegistry = inject(PreResolverRegistry);

  constructor(destroyRef: DestroyRef) {
    toObservable(this.urlTree)
      .pipe(
        tap(() => this.#preResolvers.clear()),
        filter(Boolean),
        switchMap((urlTree) => {
          return this.#preResolverRegistry.matchingPreResolver(urlTree);
        }),
        tap((preResolver) => this.#addPreResolver(preResolver)),
        takeUntilDestroyed()
      )
      .subscribe();

    destroyRef.onDestroy(() => {
      this.#observer.unregister(this);
    });

    effect(() => {
      const tree = this.urlTree();
      this.#observer.unregister(this);
      if (tree) {
        this.#observer.register(this);
      }
      this.registeredTree = tree;
      this.#preResolvers.clear();
    });
  }

  readonly #preResolvers = new Set<PreResolver>();

  onEnterViewport() {
    console.log('On Enter Viewport');
    this.#loader.preload().subscribe(() => void 0);

    this.#preResolvers.forEach((preResolver) => {
      this.#executePreResolver(preResolver);
    });
  }

  onExitViewport() {
    console.log('On Exit Viewport');
  }

  registeredTree: UrlTree | null = null;

  urlTree = computed(() => {
    if (isPlatformServer(this.#platformId)) {
      return null;
    }
    const href = this.ref();
    if (href === null) {
      return null;
    }
    if (!href.includes('http')) {
      return this.#router.parseUrl(href);
    }
    const url = new URL(href);
    if (this.#document.location.hostname !== url.hostname) {
      return null;
    }
    return this.#router.parseUrl(url.pathname);
  });

  #addPreResolver(preResolver: PreResolver): void {
    this.#preResolvers.add(preResolver);
    this.#executePreResolver(preResolver);
  }

  #executePreResolver(preResolver: PreResolver): void {
    preResolver.route.data.preResolve({
      data: preResolver.route.data,
      params: preResolver.params,
    });
  }
}
