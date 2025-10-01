import { BlackScholesService, OptionPricingResult } from './blackScholesService'
import { MarketEventsService, MarketEvent } from './marketEventsService'
import { SentimentAnalysisService, SentimentScore } from './sentimentAnalysisService'

export interface EventAdjustedPricing {
  basePrice: number
  eventAdjustedPrice: number
  sentimentAdjustedPrice: number
  recommendedEntryPrice: number
  adjustedVolatility: number
  baseVolatility: number
  eventPremium: number
  sentimentImpact: number
  daysToEvent: number
  confidence: 'high' | 'medium' | 'low'
  recommendation: string
  priceRange: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
}

export interface VolatilityAdjustment {
  baseIV: number
  eventAdjustedIV: number
  preEarningsMultiplier: number
  sentimentMultiplier: number
  finalIV: number
}

export class EventAdjustedPricingService {
  private static readonly PRE_EARNINGS_IV_MULTIPLIERS: Record<number, number> = {
    1: 1.5,
    2: 1.4,
    3: 1.35,
    4: 1.3,
    5: 1.25,
    6: 1.2,
    7: 1.15,
    14: 1.1,
    21: 1.05,
    30: 1.02
  }

  private static readonly POST_EARNINGS_IV_CRUSH = 0.4

  private static readonly EVENT_IMPACT_MULTIPLIERS = {
    earnings: 1.0,
    fda_approval: 1.3,
    merger: 1.2,
    product_launch: 0.8,
    regulatory: 1.1,
    economic_data: 0.7,
    other: 0.5
  }

  static async calculateEventAdjustedPrice(
    ticker: string,
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    baseVolatility: number,
    isCall: boolean
  ): Promise<EventAdjustedPricing> {
    const upcomingEvents = await MarketEventsService.getUpcomingEvents(ticker, 30)
    const sentimentScore = await SentimentAnalysisService.getSentimentScore(ticker)

    const basePricing = BlackScholesService.calculateOptionPrice(
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      baseVolatility,
      isCall
    )

    const nearestEvent = this.findNearestEvent(upcomingEvents, timeToExpiry)
    const daysToEvent = nearestEvent ? MarketEventsService.getDaysUntilEvent(nearestEvent.event_date) : 999

    const volatilityAdjustment = this.calculateVolatilityAdjustment(
      baseVolatility,
      nearestEvent,
      daysToEvent,
      sentimentScore
    )

    const eventAdjustedPricing = BlackScholesService.calculateOptionPrice(
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatilityAdjustment.eventAdjustedIV,
      isCall
    )

    const sentimentAdjustedPricing = BlackScholesService.calculateOptionPrice(
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatilityAdjustment.finalIV,
      isCall
    )

    const eventPremium = eventAdjustedPricing.price - basePricing.price
    const sentimentImpact = sentimentAdjustedPricing.price - eventAdjustedPricing.price

    const priceRange = this.calculatePriceRange(
      sentimentAdjustedPricing.price,
      nearestEvent,
      sentimentScore
    )

    const recommendedEntryPrice = this.calculateRecommendedEntry(
      basePricing.price,
      sentimentAdjustedPricing.price,
      nearestEvent,
      sentimentScore,
      daysToEvent
    )

    const confidence = this.calculateConfidence(nearestEvent, sentimentScore, daysToEvent)
    const recommendation = this.generateRecommendation(
      basePricing.price,
      sentimentAdjustedPricing.price,
      nearestEvent,
      sentimentScore,
      daysToEvent,
      isCall
    )

    return {
      basePrice: basePricing.price,
      eventAdjustedPrice: eventAdjustedPricing.price,
      sentimentAdjustedPrice: sentimentAdjustedPricing.price,
      recommendedEntryPrice,
      adjustedVolatility: volatilityAdjustment.finalIV,
      baseVolatility,
      eventPremium,
      sentimentImpact,
      daysToEvent,
      confidence,
      recommendation,
      priceRange
    }
  }

  static calculateVolatilityAdjustment(
    baseIV: number,
    event: MarketEvent | null,
    daysToEvent: number,
    sentimentScore: SentimentScore | null
  ): VolatilityAdjustment {
    let eventMultiplier = 1.0
    let sentimentMultiplier = 1.0

    if (event && daysToEvent <= 30) {
      const baseEventMultiplier = this.EVENT_IMPACT_MULTIPLIERS[event.event_type as keyof typeof this.EVENT_IMPACT_MULTIPLIERS] || 0.5

      const daysKey = Object.keys(this.PRE_EARNINGS_IV_MULTIPLIERS)
        .map(Number)
        .sort((a, b) => a - b)
        .find(key => daysToEvent <= key) || 30

      const timeMultiplier = this.PRE_EARNINGS_IV_MULTIPLIERS[daysKey]

      const severityMultiplier = event.impact_severity === 'critical' ? 1.3 :
                                  event.impact_severity === 'high' ? 1.2 :
                                  event.impact_severity === 'medium' ? 1.1 : 1.0

      eventMultiplier = baseEventMultiplier * timeMultiplier * severityMultiplier
    }

    if (sentimentScore) {
      const sentimentMagnitude = Math.abs(sentimentScore.overall_sentiment_score) / 100
      const momentumImpact = Math.abs(sentimentScore.sentiment_momentum) / 50

      sentimentMultiplier = 1.0 + (sentimentMagnitude * 0.15) + (momentumImpact * 0.1)
    }

    const eventAdjustedIV = baseIV * eventMultiplier
    const finalIV = eventAdjustedIV * sentimentMultiplier

    return {
      baseIV,
      eventAdjustedIV,
      preEarningsMultiplier: eventMultiplier,
      sentimentMultiplier,
      finalIV: Math.min(finalIV, baseIV * 2.5)
    }
  }

  static calculatePostEventIVCrush(preEventIV: number, event: MarketEvent): number {
    const baseMultiplier = this.POST_EARNINGS_IV_CRUSH

    const surpriseFactor = event.surprise_factor || 0
    const surpriseImpact = Math.abs(surpriseFactor) / 100

    const crushMultiplier = baseMultiplier + (surpriseImpact * 0.1)

    return preEventIV * (1 - crushMultiplier)
  }

  static async getEventImpactOnOption(
    ticker: string,
    strikePrice: number,
    expirationDate: string,
    isCall: boolean,
    spotPrice: number,
    currentIV: number
  ): Promise<{
    preEventPrice: number
    postEventPrice: number
    ivCrushImpact: number
    priceChange: number
  } | null> {
    const historicalEvents = await MarketEventsService.getHistoricalEvents(ticker, 180)

    const recentEvent = historicalEvents.find(event => event.event_type === 'earnings')
    if (!recentEvent) return null

    const daysToExpiry = Math.max(1, (new Date(expirationDate).getTime() - new Date(recentEvent.event_date).getTime()) / (1000 * 60 * 60 * 24))
    const timeToExpiry = daysToExpiry / 365

    const preEventPricing = BlackScholesService.calculateOptionPrice(
      spotPrice,
      strikePrice,
      timeToExpiry,
      0.05,
      currentIV,
      isCall
    )

    const postEventIV = this.calculatePostEventIVCrush(currentIV, recentEvent)

    const postEventPricing = BlackScholesService.calculateOptionPrice(
      spotPrice,
      strikePrice,
      timeToExpiry,
      0.05,
      postEventIV,
      isCall
    )

    const ivCrushImpact = ((postEventPricing.price - preEventPricing.price) / preEventPricing.price) * 100

    return {
      preEventPrice: preEventPricing.price,
      postEventPrice: postEventPricing.price,
      ivCrushImpact,
      priceChange: postEventPricing.price - preEventPricing.price
    }
  }

  private static findNearestEvent(events: MarketEvent[], timeToExpiry: number): MarketEvent | null {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (timeToExpiry * 365))

    const relevantEvents = events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate <= expiryDate
    })

    if (relevantEvents.length === 0) return null

    return relevantEvents.sort((a, b) => {
      const daysToA = MarketEventsService.getDaysUntilEvent(a.event_date)
      const daysToB = MarketEventsService.getDaysUntilEvent(b.event_date)
      return daysToA - daysToB
    })[0]
  }

  private static calculatePriceRange(
    basePrice: number,
    event: MarketEvent | null,
    sentimentScore: SentimentScore | null
  ): { optimistic: number; realistic: number; pessimistic: number } {
    let rangeFactor = 0.1

    if (event) {
      if (event.impact_severity === 'critical') rangeFactor = 0.25
      else if (event.impact_severity === 'high') rangeFactor = 0.2
      else if (event.impact_severity === 'medium') rangeFactor = 0.15
    }

    if (sentimentScore) {
      const sentimentFactor = Math.abs(sentimentScore.overall_sentiment_score) / 200
      rangeFactor += sentimentFactor
    }

    return {
      optimistic: basePrice * (1 + rangeFactor),
      realistic: basePrice,
      pessimistic: basePrice * (1 - rangeFactor)
    }
  }

  private static calculateRecommendedEntry(
    basePrice: number,
    adjustedPrice: number,
    event: MarketEvent | null,
    sentimentScore: SentimentScore | null,
    daysToEvent: number
  ): number {
    if (!event || daysToEvent > 30) {
      return basePrice * 0.95
    }

    const eventPremium = adjustedPrice - basePrice
    let discountFactor = 0.7

    if (sentimentScore) {
      if (sentimentScore.overall_sentiment_score > 30) {
        discountFactor = 0.85
      } else if (sentimentScore.overall_sentiment_score < -30) {
        discountFactor = 0.6
      }
    }

    if (daysToEvent <= 3) {
      discountFactor *= 0.9
    }

    return basePrice + (eventPremium * discountFactor)
  }

  private static calculateConfidence(
    event: MarketEvent | null,
    sentimentScore: SentimentScore | null,
    daysToEvent: number
  ): 'high' | 'medium' | 'low' {
    if (!event) return 'low'

    let confidenceScore = 0

    if (event.impact_severity === 'critical' || event.impact_severity === 'high') {
      confidenceScore += 30
    } else if (event.impact_severity === 'medium') {
      confidenceScore += 20
    }

    if (sentimentScore) {
      const sentimentStrength = Math.abs(sentimentScore.overall_sentiment_score)
      if (sentimentStrength > 50) confidenceScore += 30
      else if (sentimentStrength > 25) confidenceScore += 20
      else confidenceScore += 10
    }

    if (daysToEvent <= 7) confidenceScore += 25
    else if (daysToEvent <= 14) confidenceScore += 15
    else if (daysToEvent <= 21) confidenceScore += 10

    if (confidenceScore >= 70) return 'high'
    if (confidenceScore >= 40) return 'medium'
    return 'low'
  }

  private static generateRecommendation(
    basePrice: number,
    adjustedPrice: number,
    event: MarketEvent | null,
    sentimentScore: SentimentScore | null,
    daysToEvent: number,
    isCall: boolean
  ): string {
    if (!event) {
      return `No major events detected. Consider standard BS pricing at $${basePrice.toFixed(2)}`
    }

    const eventPremium = ((adjustedPrice - basePrice) / basePrice) * 100
    const optionType = isCall ? 'call' : 'put'

    if (daysToEvent <= 3) {
      return `⚠️ ${event.event_type} in ${daysToEvent} day${daysToEvent === 1 ? '' : 's'}. High IV premium (+${eventPremium.toFixed(1)}%). Consider selling ${optionType}s or waiting for IV crush.`
    }

    if (daysToEvent <= 7) {
      if (sentimentScore && Math.abs(sentimentScore.overall_sentiment_score) > 40) {
        const sentiment = sentimentScore.overall_sentiment_score > 0 ? 'bullish' : 'bearish'
        return `${event.event_type} in ${daysToEvent} days. ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} sentiment detected. ${eventPremium > 20 ? 'Consider waiting for better entry' : 'Moderate entry opportunity'}.`
      }
      return `${event.event_type} approaching (${daysToEvent} days). IV premium at +${eventPremium.toFixed(1)}%. Consider timing your entry carefully.`
    }

    if (daysToEvent <= 14) {
      return `${event.event_type} in ${daysToEvent} days. Building positions now may capture some IV expansion. Fair entry zone.`
    }

    return `${event.event_type} scheduled in ${daysToEvent} days. IV premium minimal (+${eventPremium.toFixed(1)}%). Good time to establish positions before IV ramps up.`
  }
}
