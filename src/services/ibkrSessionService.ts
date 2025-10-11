import { IBKRService } from './ibkrService'
import { supabase } from '../lib/supabase'

export interface SessionStatus {
  authenticated: boolean
  connected: boolean
  competing: boolean
  message: string
  sessionId?: string
  expiresAt?: Date
  lastTickle?: Date
}

export class IBKRSessionService {
  private static tickleIntervals: Map<string, NodeJS.Timeout> = new Map()
  private static readonly TICKLE_INTERVAL = 4 * 60 * 1000
  private static readonly SESSION_WARNING_TIME = 60 * 60 * 1000
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000

  static async initializeSession(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<SessionStatus> {
    try {
      const status = await IBKRService.checkAuthStatus(userId, environment)

      if (!status.authenticated || !status.connected) {
        if (status.connected && !status.authenticated) {
          await IBKRService.reauthenticate(userId, environment)
          const newStatus = await IBKRService.checkAuthStatus(userId, environment)
          return this.updateSessionTracking(userId, environment, newStatus)
        }

        throw new Error('Not authenticated. Please log in through the Client Portal Gateway.')
      }

      const sessionStatus = await this.updateSessionTracking(userId, environment, status)

      this.startTickleInterval(userId, environment)

      return sessionStatus
    } catch (error) {
      console.error('Error initializing session:', error)
      throw error
    }
  }

  static startTickleInterval(userId: string, environment: 'paper' | 'live'): void {
    const key = `${userId}-${environment}`

    if (this.tickleIntervals.has(key)) {
      clearInterval(this.tickleIntervals.get(key))
    }

    const interval = setInterval(async () => {
      try {
        await this.tickle(userId, environment)
      } catch (error) {
        console.error('Tickle failed:', error)
        await this.handleSessionExpiry(userId, environment)
      }
    }, this.TICKLE_INTERVAL)

    this.tickleIntervals.set(key, interval)
  }

  static stopTickleInterval(userId: string, environment: 'paper' | 'live'): void {
    const key = `${userId}-${environment}`

    if (this.tickleIntervals.has(key)) {
      clearInterval(this.tickleIntervals.get(key))
      this.tickleIntervals.delete(key)
    }
  }

  static async tickle(userId: string, environment: 'paper' | 'live'): Promise<void> {
    try {
      await IBKRService.tickle(userId, environment)

      await supabase
        .from('ibkr_session_tracking')
        .update({
          last_tickle_at: new Date().toISOString(),
          gateway_status: 'connected'
        })
        .eq('user_id', userId)
        .eq('environment', environment)
    } catch (error) {
      console.error('Tickle error:', error)
      throw error
    }
  }

  static async checkSessionStatus(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<SessionStatus> {
    try {
      const status = await IBKRService.checkAuthStatus(userId, environment)
      return this.updateSessionTracking(userId, environment, status)
    } catch (error) {
      console.error('Error checking session status:', error)
      throw error
    }
  }

  private static async updateSessionTracking(
    userId: string,
    environment: 'paper' | 'live',
    status: any
  ): Promise<SessionStatus> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION)

    await supabase
      .from('ibkr_session_tracking')
      .upsert({
        user_id: userId,
        environment,
        authenticated: status.authenticated || false,
        connected: status.connected || false,
        competing: status.competing || false,
        message: status.message || '',
        last_auth_check_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        gateway_status: status.authenticated && status.connected ? 'connected' : 'disconnected'
      }, {
        onConflict: 'user_id'
      })

    return {
      authenticated: status.authenticated || false,
      connected: status.connected || false,
      competing: status.competing || false,
      message: status.message || '',
      expiresAt,
      lastTickle: now
    }
  }

  static async reauthenticate(userId: string, environment: 'paper' | 'live'): Promise<void> {
    try {
      await IBKRService.reauthenticate(userId, environment)

      await supabase
        .from('ibkr_session_tracking')
        .update({
          authenticated: true,
          last_auth_check_at: new Date().toISOString(),
          gateway_status: 'connected'
        })
        .eq('user_id', userId)
        .eq('environment', environment)

      this.startTickleInterval(userId, environment)
    } catch (error) {
      console.error('Reauthentication failed:', error)
      throw error
    }
  }

  static async logout(userId: string, environment: 'paper' | 'live'): Promise<void> {
    try {
      this.stopTickleInterval(userId, environment)

      await IBKRService.logout(userId, environment)

      await supabase
        .from('ibkr_session_tracking')
        .update({
          authenticated: false,
          connected: false,
          gateway_status: 'disconnected',
          expires_at: null
        })
        .eq('user_id', userId)
        .eq('environment', environment)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  static async getSessionInfo(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<any> {
    const { data, error } = await supabase
      .from('ibkr_session_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', environment)
      .maybeSingle()

    if (error) {
      console.error('Error fetching session info:', error)
      return null
    }

    return data
  }

  static async checkSessionExpiry(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<{ isExpiring: boolean; timeRemaining: number }> {
    const sessionInfo = await this.getSessionInfo(userId, environment)

    if (!sessionInfo || !sessionInfo.expires_at) {
      return { isExpiring: false, timeRemaining: 0 }
    }

    const expiresAt = new Date(sessionInfo.expires_at)
    const now = new Date()
    const timeRemaining = expiresAt.getTime() - now.getTime()

    const isExpiring = timeRemaining > 0 && timeRemaining < this.SESSION_WARNING_TIME

    return { isExpiring, timeRemaining }
  }

  private static async handleSessionExpiry(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<void> {
    this.stopTickleInterval(userId, environment)

    await supabase
      .from('ibkr_session_tracking')
      .update({
        authenticated: false,
        gateway_status: 'disconnected',
        message: 'Session expired'
      })
      .eq('user_id', userId)
      .eq('environment', environment)

    console.warn('IBKR session expired for user:', userId)
  }

  static async cleanExpiredSessions(): Promise<void> {
    const { data, error } = await supabase
      .from('ibkr_session_tracking')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .eq('authenticated', true)

    if (error) {
      console.error('Error fetching expired sessions:', error)
      return
    }

    for (const session of data || []) {
      await this.handleSessionExpiry(session.user_id, session.environment)
    }
  }

  static async isSessionActive(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<boolean> {
    const sessionInfo = await this.getSessionInfo(userId, environment)

    if (!sessionInfo) {
      return false
    }

    if (!sessionInfo.authenticated || !sessionInfo.connected) {
      return false
    }

    if (sessionInfo.expires_at) {
      const expiresAt = new Date(sessionInfo.expires_at)
      const now = new Date()

      if (now >= expiresAt) {
        return false
      }
    }

    return true
  }

  static async refreshSession(userId: string, environment: 'paper' | 'live'): Promise<boolean> {
    try {
      const isActive = await this.isSessionActive(userId, environment)

      if (!isActive) {
        const status = await IBKRService.checkAuthStatus(userId, environment)

        if (status.connected && !status.authenticated) {
          await this.reauthenticate(userId, environment)
          return true
        }

        return false
      }

      return true
    } catch (error) {
      console.error('Error refreshing session:', error)
      return false
    }
  }

  static getTimeUntilExpiry(expiresAt: Date): string {
    const now = new Date()
    const timeRemaining = expiresAt.getTime() - now.getTime()

    if (timeRemaining <= 0) {
      return 'Expired'
    }

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000))
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${minutes}m`
  }

  static startBackgroundMonitoring(): void {
    setInterval(() => {
      this.cleanExpiredSessions()
    }, 5 * 60 * 1000)
  }
}
