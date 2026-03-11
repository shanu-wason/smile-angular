export interface CarePlanAction {
  category: string;
  title: string;
  description: string;
  impact: string;
}

export interface ScoreBreakdown {
  alignmentScore: number;
  gumHealthScore: number;
  whitenessScore: number;
  symmetryScore: number;
  plaqueRiskLevel: string;
}

export interface ScoreData {
  smileScore: number;
  breakdown: ScoreBreakdown;
  confidenceScore: number;
  carePlanActions: CarePlanAction[];
}

export interface HistoryScan extends ScoreData {
  id: string;
  createdAt: string;
  imageUrl?: string;
}
