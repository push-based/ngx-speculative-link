import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'examples',
    loadChildren: () => import('./features/ex.routes').then((r) => r.ExRoutes),
  },
];
