import { Routes } from '@angular/router';

export const ExRoutes: Routes = [
  {
    path: 'ex',
    loadComponent: () => import('./ex.component').then((m) => m.ExComponent),
    data: {
      preResolve: (data: any) => {
        console.log('preResolve', data);
      },
    },
  },
];
