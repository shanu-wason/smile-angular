import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ScoreData, CarePlanAction } from '../../shared/models/score-data.model';

@Component({
  selector: 'app-care-plan-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen() && result()) {
      <div class="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/30 backdrop-blur-md" (click)="onClose.emit()">
        <div class="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-6 flex-shrink-0">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-blue-50 rounded-2xl">
                <svg class="w-7 h-7 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 tracking-tight">Your Action Plan</h3>
                <p class="text-sm text-gray-500 font-medium mt-0.5">Customized for your {{ result()?.smileScore }} rating</p>
              </div>
            </div>
            <button type="button" (click)="onClose.emit()" class="text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 p-2.5 rounded-full">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="overflow-y-auto flex-1 pr-2 space-y-4">
            @for (action of result()?.carePlanActions; track $index) {
              <div class="bg-[#F2F2F7] rounded-2xl p-5 flex gap-4 transition-all hover:shadow-sm">
                <div class="w-12 h-12 rounded-full bg-white text-[#007AFF] shadow-sm flex items-center justify-center font-bold text-lg flex-shrink-0">
                  @if (action.category.toLowerCase().includes('gum')) {
                    <svg class="w-6 h-6 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  } @else if (action.category.toLowerCase().includes('align')) {
                    <svg class="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>
                  } @else {
                    <svg class="w-6 h-6 text-[#FF9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  }
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold uppercase tracking-wider text-gray-400">{{ action.category }}</span>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      [ngClass]="{
                        'bg-red-100 text-red-600': action.impact?.toLowerCase() === 'high',
                        'bg-orange-100 text-orange-600': action.impact?.toLowerCase() === 'medium',
                        'bg-blue-100 text-blue-600': action.impact?.toLowerCase() !== 'high' && action.impact?.toLowerCase() !== 'medium'
                      }"
                    >
                      {{ action.impact }} Impact
                    </span>
                  </div>
                  <h4 class="text-gray-900 font-bold text-lg mb-1.5">{{ action.title }}</h4>
                  <p class="text-gray-600 leading-relaxed text-sm font-medium">{{ action.description }}</p>
                </div>
              </div>
            }
          </div>
          <div class="mt-8 pt-6 border-t border-gray-100 flex justify-end flex-shrink-0">
            <button type="button" (click)="onClose.emit()" class="px-8 py-3.5 bg-[#007AFF] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md">Done</button>
          </div>
        </div>
      </div>
    }
  `
})
export class CarePlanModalComponent {
  isOpen = input<boolean>(false);
  result = input<ScoreData | null>(null);
  onClose = output<void>();
}
