import {
  Component,
  signal,
  computed,
  effect,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy,
  OnInit,
  type Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { ImageProcessorService } from '../../core/services/image-processor.service';
import { ScanApiService } from '../../core/services/scan-api.service';
import { SignalrService } from '../../core/services/signalr.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { HistoryDrawerComponent } from '../history/history-drawer.component';
import { SettingsDrawerComponent } from '../settings/settings-drawer.component';
import { PdfReportComponent } from '../pdf/pdf-report.component';
import { CarePlanModalComponent } from '../care-plan/care-plan-modal.component';
import type { ScoreData } from '../../shared/models/score-data.model';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function getPatientId(): string {
  let id = localStorage.getItem('smileai_patient_id');
  if (!id) {
    id = 'web-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    localStorage.setItem('smileai_patient_id', id);
  }
  return id;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HistoryDrawerComponent,
    SettingsDrawerComponent,
    PdfReportComponent,
    CarePlanModalComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild(PdfReportComponent) pdfReport!: PdfReportComponent;

  patientId = getPatientId();
  result = signal<ScoreData | null>(null);
  capturedImage = signal<string | null>(null);
  isProcessing = signal(false);
  error = signal<string | null>(null);
  showCarePlan = signal(false);
  isHistoryOpen = signal(false);
  isSettingsOpen = signal(false);
  isExporting = signal(false);
  isCameraActive = signal(false);
  cameraStream: MediaStream | null = null;
  selectedModel = signal(localStorage.getItem('smileai_preferred_model') || 'nvidia');
  userApiKeys = signal<Record<string, string>>({});
  @ViewChild('videoRef') videoRefEl?: { nativeElement: HTMLVideoElement };
  fileInputRef: HTMLInputElement | null = null;

  progressMessage!: Signal<string>;
  progressPercent!: Signal<number>;

  plaqueRisk = computed(() => this.result()?.breakdown?.plaqueRiskLevel ?? '');
  riskIsHigh = computed(() => this.plaqueRisk() === 'High');

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private imageProcessor: ImageProcessorService,
    private scanApi: ScanApiService,
    private signalr: SignalrService,
    private supabase: SupabaseService
  ) {
    effect(() => {
      const user = this.auth.user();
      const settingsOpen = this.isSettingsOpen();
      if (!user) return;
      this.supabase.supabase
        .from('UserSettings')
        .select('OpenRouterApiKey, NvidiaApiKey, OpenAIApiKey, AnthropicApiKey, GoogleAIApiKey')
        .eq('UserId', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            this.userApiKeys.set({
              openrouter: (data as Record<string, string>)['OpenRouterApiKey'] || '',
              nvidia: (data as Record<string, string>)['NvidiaApiKey'] || '',
              openai: (data as Record<string, string>)['OpenAIApiKey'] || '',
              anthropic: (data as Record<string, string>)['AnthropicApiKey'] || '',
              google: (data as Record<string, string>)['GoogleAIApiKey'] || ''
            });
          }
        });
    });
    effect(() => {
      const model = this.selectedModel();
      localStorage.setItem('smileai_preferred_model', model);
    });
    this.progressMessage = this.signalr.progressMessage;
    this.progressPercent = this.signalr.progressPercent;
  }

  ngOnInit(): void {
    this.signalr.start(this.patientId);
  }

  ngAfterViewInit(): void {
    this.fileInputRef = document.querySelector('#file-input') as HTMLInputElement;
  }

  ngAfterViewChecked(): void {
    if (this.isCameraActive() && this.cameraStream && this.videoRefEl?.nativeElement) {
      const video = this.videoRefEl.nativeElement;
      if (video.srcObject !== this.cameraStream) {
        video.srcObject = this.cameraStream;
        video.play().catch(() => {});
      }
    }
  }

  ngOnDestroy(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
    }
  }

  async analyse(base64: string): Promise<void> {
    this.isProcessing.set(true);
    this.error.set(null);
    this.result.set(null);
    this.showCarePlan.set(false);
    this.signalr.setProgress('Initializing secure upload...', 0);
    try {
      const publicUrl = await this.storage.uploadImageToStorage(base64, this.patientId);
      const session = this.auth.session();
      const token = session?.access_token;
      const keys = this.userApiKeys();
      this.scanApi.analyse(
        this.patientId,
        publicUrl,
        this.selectedModel(),
        token,
        keys
      ).subscribe({
        next: (data) => {
          this.result.set(data);
          this.isProcessing.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Analysis failed.');
          this.isProcessing.set(false);
        }
      });
    } catch (e: unknown) {
      this.error.set((e as Error).message ?? 'Analysis failed.');
      this.isProcessing.set(false);
    }
  }

  async downloadPdf(): Promise<void> {
    if (!this.pdfReport?.contentRef?.nativeElement || this.isExporting()) return;
    this.isExporting.set(true);
    try {
      const dataUrl = await toPng(this.pdfReport.contentRef.nativeElement, {
        cacheBust: true,
        backgroundColor: '#f5f5f7',
        pixelRatio: 2
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Smile_Care_Plan.pdf');
    } catch (e: unknown) {
      this.error.set('Failed to generate PDF. ' + ((e as Error).message || ''));
    } finally {
      this.isExporting.set(false);
    }
  }

  handleUpload(): void {
    this.fileInputRef?.click();
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultString = reader.result as string;
      const b64 = resultString.includes(',') ? resultString.split(',')[1]! : resultString;
      try {
        const compressed = await this.imageProcessor.compressAndCropImage(b64);
        this.capturedImage.set(compressed);
      } catch {
        this.capturedImage.set(b64);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  async handleCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      this.cameraStream = stream;
      this.isCameraActive.set(true);
      this.error.set(null);
    } catch {
      this.error.set('Camera unavailable — please check permissions or use Upload instead.');
    }
  }

  cancelCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    this.isCameraActive.set(false);
  }

  async takePhoto(): Promise<void> {
    const video = this.videoRefEl?.nativeElement;
    if (!video || !this.cameraStream) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    this.cameraStream.getTracks().forEach(t => t.stop());
    this.cameraStream = null;
    this.isCameraActive.set(false);
    const resultString = canvas.toDataURL('image/jpeg', 0.9);
    const b64 = resultString.includes(',') ? resultString.split(',')[1]! : resultString;
    try {
      const compressed = await this.imageProcessor.compressAndCropImage(b64);
      this.capturedImage.set(compressed);
    } catch {
      this.capturedImage.set(b64);
    }
  }

  onSelectScan(scan: ScoreData & { imageUrl?: string }): void {
    this.result.set(scan);
    this.isProcessing.set(false);
    this.isCameraActive.set(false);
    this.error.set(null);
    this.showCarePlan.set(false);
    this.capturedImage.set(scan.imageUrl || null);
  }

  resetAnalysis(): void {
    this.result.set(null);
    this.error.set(null);
    this.capturedImage.set(null);
    this.showCarePlan.set(false);
  }

  capturedImageSrc(): string {
    const img = this.capturedImage();
    if (!img) return '';
    return img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`;
  }
}
