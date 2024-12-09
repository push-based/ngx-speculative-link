import { inject, Injectable } from '@angular/core';
import {
  Params,
  PRIMARY_OUTLET,
  Route,
  Router,
  Routes,
  UrlMatchResult,
  UrlSegment,
  UrlSegmentGroup,
  UrlTree,
} from '@angular/router';
import { RouteWithPreResolver } from './models';
import { SpeculativeLinkRegistry } from '@ngx-speculative-link/ngx-speculative-link';
import {
  extendTreeWithMatcherRoutes,
  findPathDetails,
  PATTERN_ALIAS,
} from './matcher.utils';

type UrlSegmentWithRoute = UrlSegment & { route: Route };
type TreeWithRoutes = UrlTree & { matchers: Routes };

@Injectable({ providedIn: 'root' })
export class PreResolverRegistryService {
  #router = inject(Router);
  #speculativeLinkRegistry = inject(SpeculativeLinkRegistry);
  #routesWithPreResolvers = new Set<RouteWithPreResolver>();

  registerPreResolverRoutes(route: Route) {
    if (this.#routeHasPreResolver(route)) {
      this.#routesWithPreResolvers.add(route);
    }

    const loadedRoutes = (<any>route)['_loadedRoutes'];
    const children: Routes = route.children ?? loadedRoutes;
    if (children?.length) {
      children.forEach((child) => {
        this.registerPreResolverRoutes(child);
      });
    }
  }

  #routeHasPreResolver(route: Route): route is RouteWithPreResolver {
    return (
      route.data?.['preResolve'] &&
      typeof route.data['preResolve'] === 'function'
    );
  }

  getPreResolvers(tree: UrlTree): {
    route: RouteWithPreResolver;
    params: Params;
  }[] {
    // @ts-ignore
    return;
  }

  #getExtendedTree(route: Route) {
    const { url, matcherRoutes } = findPathDetails(this.#router.config, route);
    return extendTreeWithMatcherRoutes(
      this.#router.parseUrl(url),
      matcherRoutes
    );
  }
}

function matchingSegmentGroups(
  container: UrlSegmentGroup,
  containee: UrlSegmentGroup,
  containeePaths: UrlSegment[]
): boolean | UrlMatchResult[] {
  if (container.segments.length > containeePaths.length) {
    const current = container.segments.slice(0, containeePaths.length);
    return (
      !containee.hasChildren() &&
      matchesSegmentGroup(current, container, containeePaths)
    );
  }
  if (container.segments.length !== containeePaths.length) {
    const current = containeePaths.slice(0, container.segments.length);
    const matchResults = matchesSegmentGroup(
      container.segments,
      container,
      current
    );
    if (!matchResults || !container.children[PRIMARY_OUTLET]) return false;
    const next = containeePaths.slice(container.segments.length);
    const matchedChildren = matchingSegmentGroups(
      container.children[PRIMARY_OUTLET],
      containee,
      next
    ); //@TODO needs to concat results
    if (matchedChildren) {
      if (matchResults === true) {
        return matchedChildren;
      }
      if (matchedChildren === true) {
        return matchedChildren;
      }
      return matchResults.concat(matchedChildren);
    }
  }
  const matchResults = matchesSegmentGroup(
    container.segments,
    container,
    containeePaths
  );
  if (!matchResults) return false;
  if (!containee.hasChildren()) return matchResults;

  const results: UrlMatchResult[] =
    typeof matchResults === 'boolean' ? [] : matchResults;
  let result = false;
  for (const c in containee.children) {
    if (!container.children[c]) break;
    const matchedChildren = matchingSegmentGroups(
      container.children[c],
      containee.children[c]!,
      containee.children[c]!.segments
    );
    if (typeof matchedChildren !== 'boolean') {
      results.push(...matchedChildren);
    } else if (matchedChildren) {
      result = matchedChildren;
    }
  }
  if (results.length > 0) {
    return results;
  }
  return result;
}

function matchesSegmentGroup(
  registered: UrlSegment[],
  registeredGroup: UrlSegmentGroup,
  current: (UrlSegment | UrlSegmentWithRoute)[]
): boolean | UrlMatchResult[] {
  if (registered.length !== current.length) return false;

  return registered.reduce<true | UrlMatchResult[] | false>(
    (accumulator, registeredItem, index) => {
      if (accumulator === false) return false; // Early termination

      const currentItem = current[index]!;

      if (registeredItem.path === currentItem.path) return accumulator;

      if (
        currentItem.path.startsWith(':') ||
        registeredItem.path.startsWith(':')
      ) {
        return accumulator;
      }

      if (currentItem.path !== PATTERN_ALIAS) return false;

      const urlMatch: UrlMatchResult | null = (<UrlSegmentWithRoute>(
        currentItem
      ))['route'].matcher!(
        [registeredItem],
        registeredGroup,
        (<UrlSegmentWithRoute>currentItem)['route']
      );

      if (!urlMatch) return false;

      return accumulator === true ? [urlMatch] : [...accumulator, urlMatch];
    },
    true
  );
}
