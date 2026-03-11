import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { AuthModalComponent } from './features/auth/auth-modal.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [AuthModalComponent, DashboardComponent],
  template: `
    @if (auth.isLoading()) {
      <div class="fixed inset-0 flex items-center justify-center bg-[var(--color-apple-bg)]">
        <span class="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin block"></span>
      </div>
    } @else if (!auth.user()) {
      <app-auth-modal />
    } @else {
      <app-dashboard />
    }
  `
})
export class App {
  constructor(public auth: AuthService) {}
}
