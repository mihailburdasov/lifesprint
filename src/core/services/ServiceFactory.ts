/**
 * Service factory for creating service instances
 */

import { 
  IProgressService, 
  IContentService, 
  IAudioService, 
  IAuthService, 
  IThemeService 
} from './interfaces';
import { progressService } from '../../features/day/services/ProgressService';
import { contentService } from '../../features/day/services/ContentService';
import { audioService } from '../../features/day/services/AudioService';

/**
 * Service factory class
 */
export class ServiceFactory {
  /**
   * Get progress service instance
   */
  static getProgressService(): IProgressService {
    return progressService;
  }

  /**
   * Get content service instance
   */
  static getContentService(): IContentService {
    return contentService;
  }

  /**
   * Get audio service instance
   */
  static getAudioService(): IAudioService {
    return audioService;
  }

  /**
   * Get auth service instance
   */
  static getAuthService(): IAuthService {
    // TODO: Implement auth service
    throw new Error('Auth service not implemented');
  }

  /**
   * Get theme service instance
   */
  static getThemeService(): IThemeService {
    // TODO: Implement theme service
    throw new Error('Theme service not implemented');
  }
}
