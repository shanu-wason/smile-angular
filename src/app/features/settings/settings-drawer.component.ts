import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { ScanApiService } from '../../core/services/scan-api.service';

interface ProviderKey {
  id: string;
  label: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  icon: string;
  dbColumn: string;
}

const PROVIDERS: ProviderKey[] = [
  { id: 'nvidia', label: 'NVIDIA (Llama 3.2)', placeholder: 'nvapi-...', helpUrl: 'https://build.nvidia.com/settings/api-key', helpLabel: 'build.nvidia.com', icon: '🟢', dbColumn: 'NvidiaApiKey' },
  { id: 'openrouter', label: 'OpenRouter (GPT-4o, Claude, etc.)', placeholder: 'sk-or-v1-...', helpUrl: 'https://openrouter.ai/keys', helpLabel: 'openrouter.ai/keys', icon: '🔀', dbColumn: 'OpenRouterApiKey' },
  { id: 'openai', label: 'OpenAI (Direct)', placeholder: 'sk-...', helpUrl: 'https://platform.openai.com/api-keys', helpLabel: 'platform.openai.com', icon: '🤖', dbColumn: 'OpenAIApiKey' },
  { id: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...', helpUrl: 'https://console.anthropic.com/settings/keys', helpLabel: 'console.anthropic.com', icon: '🧠', dbColumn: 'AnthropicApiKey' },
  { id: 'google', label: 'Google AI (Gemini)', placeholder: 'AIza...', helpUrl: 'https://aistudio.google.com/app/apikey', helpLabel: 'aistudio.google.com', icon: '✨', dbColumn: 'GoogleAIApiKey' }
];

@Component({
  selector: 'app-settings-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" (click)="onClose.emit()"></div>
      <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#F2F2F7] shadow-2xl flex flex-col drawer-slide">
        <div class="bg-white px-6 py-5 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">Settings</h2>
            <button type="button" (click)="onClose.emit()" class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="flex gap-1 mt-4 bg-[#F2F2F7] rounded-xl p-1">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                (click)="activeTab.set(tab.id)"
                class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                [class.bg-white]="activeTab() === tab.id"
                [class.text-gray-900]="activeTab() === tab.id"
                [class.shadow-sm]="activeTab() === tab.id"
                [class.text-gray-500]="activeTab() !== tab.id"
                [class.hover:text-gray-700]="activeTab() !== tab.id"
              >
                <span>{{ tab.icon }}</span>{{ tab.label }}
              </button>
            }
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-20">
              <span class="w-8 h-8 border-2 border-gray-200 border-t-[#007AFF] rounded-full animate-spin block"></span>
            </div>
          } @else {
            @if (activeTab() === 'account') {
              <div class="space-y-4">
                <div class="bg-white rounded-2xl p-5 shadow-sm">
                  <div class="flex items-center gap-4">
                    @if (auth.user()?.user_metadata?.['avatar_url']) {
                      <img [src]="auth.user()?.user_metadata?.['avatar_url']" alt="Profile" class="w-14 h-14 rounded-full border-2 border-gray-100" />
                    } @else {
                      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-xl font-bold">
                        {{ (auth.user()?.email?.[0] || '?').toUpperCase() }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-gray-900 truncate">{{ auth.user()?.user_metadata?.['full_name'] || (auth.user()?.email ?? '').split('@')[0] }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ auth.user()?.email }}</p>
                      <p class="text-[10px] text-gray-300 mt-1">Signed in via {{ auth.user()?.app_metadata?.['provider'] || 'email' }}</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
                  <div class="px-5 py-3.5 flex items-center justify-between">
                    <span class="text-xs font-medium text-gray-500">User ID</span>
                    <span class="text-[10px] text-gray-400 font-mono">{{ (auth.user()?.id || '').slice(0, 8) }}...</span>
                  </div>
                  <div class="px-5 py-3.5 flex items-center justify-between">
                    <span class="text-xs font-medium text-gray-500">Member since</span>
                    <span class="text-xs text-gray-700">{{ auth.user()?.created_at | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
                  <button type="button" (click)="auth.signOut(); onClose.emit()" class="w-full px-5 py-3.5 text-left text-sm font-medium text-[#007AFF] hover:bg-blue-50 transition-colors rounded-t-2xl">Sign Out</button>
                </div>
              </div>
            }
            @if (activeTab() === 'keys') {
              <div class="space-y-3">
                @if (message()) {
                  <div class="p-3 rounded-2xl text-xs font-medium text-center" [class.bg-green-50]="message()?.type === 'success'" [class.text-green-600]="message()?.type === 'success'" [class.bg-red-50]="message()?.type === 'error'" [class.text-red-600]="message()?.type === 'error'">
                    {{ message()?.text }}
                  </div>
                }
                <div class="bg-blue-50 rounded-2xl p-4">
                  <p class="text-[11px] text-blue-700 font-medium leading-relaxed">Add your own API keys to use different AI models. Keys are stored securely. Leave blank to use shared default keys.</p>
                </div>
                @for (provider of PROVIDERS; track provider.id) {
                  <div class="bg-white rounded-2xl p-4 shadow-sm">
                    <div class="flex items-center gap-2 mb-3">
                      <span class="text-base">{{ provider.icon }}</span>
                      <span class="text-xs font-bold text-gray-800">{{ provider.label }}</span>
                      @if (apiKeys()[provider.id]) {
                        <span class="ml-auto px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">Active</span>
                      }
                    </div>
                    <div class="relative">
                      <input
                        [type]="visibleKeys()[provider.id] ? 'text' : 'password'"
                        [placeholder]="provider.placeholder"
                        [ngModel]="apiKeys()[provider.id]"
                        (ngModelChange)="setKey(provider.id, $event)"
                        class="w-full px-3.5 py-3 pr-10 bg-[#F2F2F7] border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-gray-900 text-xs font-mono"
                      />
                      <button type="button" (click)="toggleVisible(provider.id)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        @if (visibleKeys()[provider.id]) {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        } @else {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    <p class="mt-2 text-[10px] text-gray-400">Get one at <a [href]="provider.helpUrl" target="_blank" rel="noopener noreferrer" class="text-[#007AFF] hover:underline">{{ provider.helpLabel }}</a></p>
                  </div>
                }
                @if (hasChanges()) {
                  <button type="button" (click)="saveKeys()" [disabled]="isSaving()" class="w-full py-3.5 bg-[#007AFF] text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50">
                    {{ isSaving() ? 'Saving...' : 'Save API Keys' }}
                  </button>
                }
              </div>
            }
            @if (activeTab() === 'usage') {
              @if (usageStats()) {
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <p class="text-2xl font-bold text-gray-900">{{ usageStats()?.totalScans }}</p>
                    <p class="text-[10px] text-gray-400 font-medium mt-1">Total Scans</p>
                  </div>
                  <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <p class="text-2xl font-bold text-[#007AFF]">{{ ((usageStats()?.totalTokensUsed || 0) / 1000).toFixed(1) }}K</p>
                    <p class="text-[10px] text-gray-400 font-medium mt-1">Tokens Used</p>
                  </div>
                  <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <p class="text-2xl font-bold text-[#34C759]">\${{ (usageStats()?.totalCost || 0).toFixed(4) }}</p>
                    <p class="text-[10px] text-gray-400 font-medium mt-1">Total Cost</p>
                  </div>
                  <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
                    <p class="text-2xl font-bold text-[#AF52DE]">{{ ((usageStats()?.averageProcessingTimeMs || 0) / 1000).toFixed(1) }}s</p>
                    <p class="text-[10px] text-gray-400 font-medium mt-1">Avg. Time</p>
                  </div>
                </div>
              } @else {
                <div class="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <p class="text-3xl mb-3">📊</p>
                  <p class="text-sm font-medium text-gray-500">No usage data yet</p>
                </div>
              }
            }
          }
        </div>
        <div class="bg-white px-6 py-3 border-t border-gray-100 text-center">
          <p class="text-[10px] text-gray-300">SmileAI v1.0 • Joenish Tech Pvt Ltd</p>
        </div>
      </div>
    }
  `
})
export class SettingsDrawerComponent {
  isOpen = input<boolean>(false);
  onClose = output<void>();

  activeTab = signal<'account' | 'keys' | 'usage'>('account');
  apiKeys = signal<Record<string, string>>({});
  originalKeys = signal<Record<string, string>>({});
  isSaving = signal(false);
  isLoading = signal(true);
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  usageStats = signal<{ totalScans: number; totalTokensUsed: number; totalCost: number; averageProcessingTimeMs: number } | null>(null);
  visibleKeys = signal<Record<string, boolean>>({});
  tabs = [
    { id: 'account' as const, label: 'Account', icon: '👤' },
    { id: 'keys' as const, label: 'API Keys', icon: '🔑' },
    { id: 'usage' as const, label: 'Usage', icon: '📊' }
  ];
  protected readonly PROVIDERS = PROVIDERS;

  constructor(
    public auth: AuthService,
    private supabase: SupabaseService,
    private scanApi: ScanApiService
  ) {
    effect(() => {
      const open = this.isOpen();
      const user = this.auth.user();
      if (!open || !user) return;
      this.isLoading.set(true);
      this.message.set(null);
      this.supabase.supabase.from('UserSettings').select('*').eq('UserId', user.id).maybeSingle().then(({ data: settings }) => {
        if (settings) {
          const keys: Record<string, string> = {};
          PROVIDERS.forEach(p => { keys[p.id] = (settings as Record<string, string>)[p.dbColumn] || ''; });
          this.apiKeys.set(keys);
          this.originalKeys.set({ ...keys });
        }
        const token = this.auth.session()?.access_token;
        this.scanApi.getUsageStats(token).subscribe({
          next: (stats) => this.usageStats.set(stats),
          error: () => {}
        });
        this.isLoading.set(false);
      });
    });
  }

  hasChanges(): boolean {
    return JSON.stringify(this.apiKeys()) !== JSON.stringify(this.originalKeys());
  }

  setKey(id: string, value: string): void {
    this.apiKeys.update(k => ({ ...k, [id]: value }));
  }

  toggleVisible(id: string): void {
    this.visibleKeys.update(v => ({ ...v, [id]: !v[id] }));
  }

  async saveKeys(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    this.isSaving.set(true);
    this.message.set(null);
    try {
      const upsertData: Record<string, unknown> = {
        UserId: user.id,
        UpdatedAt: new Date().toISOString()
      };
      PROVIDERS.forEach(p => {
        (upsertData as Record<string, string>)[p.dbColumn] = this.apiKeys()[p.id]?.trim() || '';
      });
      const { error } = await this.supabase.supabase.from('UserSettings').upsert(upsertData, { onConflict: 'UserId' });
      if (error) throw error;
      this.originalKeys.set({ ...this.apiKeys() });
      this.message.set({ type: 'success', text: 'API keys saved!' });
      setTimeout(() => this.message.set(null), 2000);
    } catch (err: unknown) {
      this.message.set({ type: 'error', text: (err as { message?: string })?.message || 'Failed to save.' });
    } finally {
      this.isSaving.set(false);
    }
  }
}
