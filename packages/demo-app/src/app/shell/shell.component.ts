import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatList, MatListItem, MatNavList } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { SpeculativeLinkDirective } from '@ngx-speculative-link/ngx-speculative-link';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'demo-shell',
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #drawer
        class="sidenav"
        fixedInViewport
        [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) === false"
      >
        <mat-toolbar>Menu</mat-toolbar>
        <mat-nav-list>
          <a
            mat-list-item
            [speculativeLink]="'/examples/ex'"
            routerLink="/examples/ex"
            >Link 1</a
          >
          <a mat-list-item href="#">Link 2</a>
          <a mat-list-item href="#">Link 3</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isHandset$ | async) {
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="drawer.toggle()"
          >
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          }
          <span>demo</span>
        </mat-toolbar>
        <ng-content />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
  .sidenav-container {
    height: 100%;
  }
  .sidenav {
    width: 200px;
  }
  .sidenav .mat-toolbar {
    background: inherit;
  }
  .mat-toolbar.mat-primary {
    position: sticky;
    top: 0;
    z-index: 1;
  }
`,
  standalone: true,
  imports: [
    MatToolbar,
    MatButton,
    MatSidenav,
    MatList,
    MatIcon,
    AsyncPipe,
    MatSidenavContent,
    MatNavList,
    MatSidenavContainer,
    MatListItem,
    MatIconButton,
    RouterLink,
    SpeculativeLinkDirective,
  ],
})
export class ShellComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
}
