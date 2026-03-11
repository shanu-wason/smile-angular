import { Injectable, signal, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;
  private _progressMessage = signal('');
  private _progressPercent = signal(0);

  progressMessage = this._progressMessage.asReadonly();
  progressPercent = this._progressPercent.asReadonly();

  async start(patientId: string): Promise<void> {
    const baseUrl = environment.apiUrl || '';
    const hubUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/hubs/scan` : '/hubs/scan';
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.on('ReceiveProgress', (message: string, percent: number) => {
      this._progressMessage.set(message);
      this._progressPercent.set(percent);
    });

    try {
      await this.connection.start();
      console.log('SignalR Connected.');
      await this.connection.invoke('SubscribeToPatient', patientId);
    } catch (err) {
      console.error('SignalR Connection Error:', err);
      setTimeout(() => this.start(patientId), 5000);
    }
  }

  setProgress(message: string, percent: number): void {
    this._progressMessage.set(message);
    this._progressPercent.set(percent);
  }

  ngOnDestroy(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }
}
