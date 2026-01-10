export interface ModerationRequest {
  content: string;
  contentType?: 'post' | 'comment' | 'text';
}

export interface ModerationCategory {
  sexual: boolean;
  hate: boolean;
  harassment: boolean;
  selfHarm: boolean;
  sexualMinors: boolean;
  hateThreatening: boolean;
  violenceGraphic: boolean;
  selfHarmIntent: boolean;
  selfHarmInstructions: boolean;
  harassmentThreatening: boolean;
  violence: boolean;
}

export interface ModerationCategoryScores {
  sexual: number;
  hate: number;
  harassment: number;
  selfHarm: number;
  sexualMinors: number;
  hateThreatening: number;
  violenceGraphic: number;
  selfHarmIntent: number;
  selfHarmInstructions: number;
  harassmentThreatening: number;
  violence: number;
}

export interface ModerationResult {
  id: string;
  model: string;
  flagged: boolean;
  categories: ModerationCategory;
  categoryScores: ModerationCategoryScores;
  approved: boolean;
  flaggedCategories: string[];
}

export interface ModerationResponse {
  approved: boolean;
  flagged: boolean;
  flaggedCategories: string[];
  details: ModerationResult;
}
