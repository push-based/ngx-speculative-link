import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from "./shell/shell.component";

@Component({
  standalone: true,
  imports: [RouterOutlet, ShellComponent],
  selector: 'demo-root',
  template: `
    <demo-shell>
      <router-outlet />
    </demo-shell>
  `,
  styles: ``,
})
export class AppComponent {
  title = 'demo-app';
}
