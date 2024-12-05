import { Route } from '@angular/router';

export type RouteWithPreResolver = Route & {
  data: {
    preResolve: () => void;
  };
};
