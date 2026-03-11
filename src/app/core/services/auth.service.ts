import { Injectable, signal, computed } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSignal = signal<Session | null>(null);
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(true);

  session = this.sessionSignal.asReadonly();
  user = this.userSignal.asReadonly();
  isLoading = this.loadingSignal.asReadonly();
  isAuthenticated = computed(() => !!this.userSignal());

  constructor(private supabase: SupabaseService) {
    this.supabase.supabase.auth.getSession().then(({ data: { session } }) => {
      this.sessionSignal.set(session);
      this.userSignal.set(session?.user ?? null);
      this.loadingSignal.set(false);
    });

    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      this.userSignal.set(session?.user ?? null);
      this.loadingSignal.set(false);
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.supabase.auth.signOut();
  }
}
