/**
 * Service for handling real-time updates using Supabase Realtime
 */

import { supabase } from './supabase';
import { logger, LogContext } from './LoggingService';

export class RealtimeService {
  private subscription: any = null;
  private callbacks: Map<string, (payload: any) => void> = new Map();
  
  /**
   * Subscribe to user updates via Supabase Realtime
   * @param userId User ID to subscribe to
   * @param callback Function to call when updates are received
   */
  subscribeToUserUpdates(userId: string, callback: (payload: any) => void) {
    this.unsubscribe(); // Unsubscribe from previous subscriptions
    
    logger.info(`Subscribing to real-time updates for user ${userId}`, LogContext.SYNC);
    
    try {
      this.callbacks.set('update', callback);
      
      this.subscription = supabase
        .channel(`user:${userId}:update`)
        .on('broadcast', { event: 'update' }, (payload) => {
          logger.debug('Received real-time update', LogContext.SYNC, payload);
          const updateCallback = this.callbacks.get('update');
          if (updateCallback) {
            updateCallback(payload);
          }
        })
        .subscribe((status) => {
          logger.info(`Subscription status: ${status}`, LogContext.SYNC);
        });
        
      return true;
    } catch (error) {
      logger.error('Error subscribing to real-time updates', error);
      return false;
    }
  }
  
  /**
   * Unsubscribe from all channels
   */
  unsubscribe() {
    if (this.subscription) {
      logger.debug('Unsubscribing from real-time updates', LogContext.SYNC);
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.callbacks.clear();
    }
  }
  
  /**
   * Broadcast an update to all subscribers
   * @param userId User ID to broadcast to
   * @param data Data to broadcast
   */
  async broadcastUpdate(userId: string, data: any) {
    try {
      logger.debug(`Broadcasting update for user ${userId}`, LogContext.SYNC);
      
      await supabase
        .channel(`user:${userId}:update`)
        .send({
          type: 'broadcast',
          event: 'update',
          payload: data,
        });
      
      return true;
    } catch (error) {
      logger.error('Error broadcasting update', error);
      return false;
    }
  }
  
  /**
   * Check if the subscription is active
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService();
