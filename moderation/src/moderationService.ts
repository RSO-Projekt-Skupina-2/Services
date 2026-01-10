import OpenAI from 'openai';
import { 
  ModerationRequest, 
  ModerationResponse, 
  ModerationResult, 
  ModerationCategory 
} from './moderationModels';

export class ModerationService {
  private openai: OpenAI;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY = 1000; // 1 second

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Moderate content using OpenAI's moderation API with retry logic
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResponse> {
    let lastError: any;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const moderation = await this.openai.moderations.create({
          input: request.content,
        });

        const result = moderation.results[0];

        // Map OpenAI response to our model
        const categories: ModerationCategory = {
          sexual: result.categories.sexual,
          hate: result.categories.hate,
          harassment: result.categories.harassment,
          selfHarm: result.categories['self-harm'],
          sexualMinors: result.categories['sexual/minors'],
          hateThreatening: result.categories['hate/threatening'],
          violenceGraphic: result.categories['violence/graphic'],
          selfHarmIntent: result.categories['self-harm/intent'],
          selfHarmInstructions: result.categories['self-harm/instructions'],
          harassmentThreatening: result.categories['harassment/threatening'],
          violence: result.categories.violence,
        };

        // Collect flagged categories
        const flaggedCategories: string[] = [];
        Object.entries(categories).forEach(([key, value]) => {
          if (value) {
            flaggedCategories.push(key);
          }
        });

        const moderationResult: ModerationResult = {
          id: moderation.id || 'unknown',
          model: moderation.model || 'text-moderation-latest',
          flagged: result.flagged,
          categories,
          categoryScores: {
            sexual: result.category_scores.sexual,
            hate: result.category_scores.hate,
            harassment: result.category_scores.harassment,
            selfHarm: result.category_scores['self-harm'],
            sexualMinors: result.category_scores['sexual/minors'],
            hateThreatening: result.category_scores['hate/threatening'],
            violenceGraphic: result.category_scores['violence/graphic'],
            selfHarmIntent: result.category_scores['self-harm/intent'],
            selfHarmInstructions: result.category_scores['self-harm/instructions'],
            harassmentThreatening: result.category_scores['harassment/threatening'],
            violence: result.category_scores.violence,
          },
          approved: !result.flagged,
          flaggedCategories,
        };

        return {
          approved: !result.flagged,
          flagged: result.flagged,
          flaggedCategories,
          details: moderationResult,
        };
      } catch (error: any) {
        lastError = error;
        
        // If it's a rate limit error and we have retries left, wait and retry
        if (error.status === 429 && attempt < this.MAX_RETRIES - 1) {
          const delayMs = this.INITIAL_DELAY * Math.pow(2, attempt);
          console.warn(`Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await this.sleep(delayMs);
          continue;
        }
        
        // For other errors or final attempt, throw
        console.error('OpenAI moderation error:', error);
        throw new Error(`Moderation failed: ${error.message}`);
      }
    }
    
    throw lastError;
  }

  /**
   * Moderate multiple content items in a single batch request with retry logic
   */
  async moderateBatch(contents: string[]): Promise<ModerationResponse[]> {
    if (contents.length === 0) {
      return [];
    }

    let lastError: any;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Send all content in one request
        const moderation = await this.openai.moderations.create({
          input: contents,
        });

        // Map results back to individual responses
        return moderation.results.map(result => {
          const categories: ModerationCategory = {
            sexual: result.categories.sexual,
            hate: result.categories.hate,
            harassment: result.categories.harassment,
            selfHarm: result.categories['self-harm'],
            sexualMinors: result.categories['sexual/minors'],
            hateThreatening: result.categories['hate/threatening'],
            violenceGraphic: result.categories['violence/graphic'],
            selfHarmIntent: result.categories['self-harm/intent'],
            selfHarmInstructions: result.categories['self-harm/instructions'],
            harassmentThreatening: result.categories['harassment/threatening'],
            violence: result.categories.violence,
          };

          const flaggedCategories: string[] = [];
          Object.entries(categories).forEach(([key, value]) => {
            if (value) {
              flaggedCategories.push(key);
            }
          });

          return {
            approved: !result.flagged,
            flagged: result.flagged,
            flaggedCategories,
            details: {
              id: moderation.id || 'unknown',
              model: moderation.model || 'text-moderation-latest',
              flagged: result.flagged,
              categories,
              categoryScores: {
                sexual: result.category_scores.sexual,
                hate: result.category_scores.hate,
                harassment: result.category_scores.harassment,
                selfHarm: result.category_scores['self-harm'],
                sexualMinors: result.category_scores['sexual/minors'],
                hateThreatening: result.category_scores['hate/threatening'],
                violenceGraphic: result.category_scores['violence/graphic'],
                selfHarmIntent: result.category_scores['self-harm/intent'],
                selfHarmInstructions: result.category_scores['self-harm/instructions'],
                harassmentThreatening: result.category_scores['harassment/threatening'],
                violence: result.category_scores.violence,
              },
              approved: !result.flagged,
              flaggedCategories,
            },
          };
        });
      } catch (error: any) {
        lastError = error;
        
        // If it's a rate limit error and we have retries left, wait and retry
        if (error.status === 429 && attempt < this.MAX_RETRIES - 1) {
          const delayMs = this.INITIAL_DELAY * Math.pow(2, attempt);
          console.warn(`Batch rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await this.sleep(delayMs);
          continue;
        }
        
        // For other errors or final attempt, throw
        console.error('OpenAI batch moderation error:', error);
        throw new Error(`Batch moderation failed: ${error.message}`);
      }
    }
    
    throw lastError;
  }
}
