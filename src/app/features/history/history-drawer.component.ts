import { Component, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanApiService } from '../../core/services/scan-api.service';
import type { HistoryScan, ScoreData } from '../../shared/models/score-data.model';

@Component({
  selector: 'app-history-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" (click)="onClose.emit()"></div>
      <div class="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col drawer-slide">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-gray-900">Scan History</h2>
            <p class="text-xs text-gray-500 mt-1">Your past smile analyses</p>
          </div>
          <button type="button" (click)="onClose.emit()" class="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Close">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          @if (loading()) {
            <div class="flex justify-center p-8">
              <span class="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin block"></span>
            </div>
          }
          @if (!loading() && error()) {
            <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error() }}</div>
          }
          @if (!loading() && !error() && history().length === 0) {
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-gray-500 text-sm font-medium">No previous scans found</p>
            </div>
          }
          @for (scan of history(); track scan.id) {
            <div
              class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors"
              (click)="selectScan(scan)"
            >
              <div>
                <p class="text-sm font-bold text-gray-900">
                  {{ scan.createdAt | date:'mediumDate' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ scan.createdAt | date:'shortTime' }}
                </p>
              </div>
              <div
                class="px-3 py-1.5 rounded-xl font-bold"
                [ngClass]="getScoreColor(scan.smileScore)"
              >
                {{ scan.smileScore }}
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class HistoryDrawerComponent {
  isOpen = input<boolean>(false);
  patientId = input.required<string>();
  accessToken = input<string | undefined>(undefined);
  onClose = output<void>();
  onSelectScan = output<ScoreData & { imageUrl?: string }>();

  history = signal<HistoryScan[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private scanApi: ScanApiService) {
    effect(() => {
      const open = this.isOpen();
      const pid = this.patientId();
      if (open && pid) this.loadHistory();
    });
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.scanApi.getHistory(this.patientId(), this.accessToken()).subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load history');
        this.loading.set(false);
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  }

  selectScan(scan: HistoryScan): void {
    this.onSelectScan.emit({ ...scan, imageUrl: scan.imageUrl });
    this.onClose.emit();
  }
}
