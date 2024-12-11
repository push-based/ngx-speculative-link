import { Routes } from '@angular/router';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class Ser {
  dummy() {
    console.log('Dummy Log');
  }
}

export const ExRoutes: Routes = [
  {
    path: 'ex',
    loadComponent: () => import('./ex.component').then((m) => m.ExComponent),
    data: {
      preResolve: (data: any) => {
        inject(Ser).dummy();
        console.log('preResolve', data);
      },
    },
    providers: [Ser],
  },
];
