/**
 * Black-Scholes Option Pricing Model Service
 * 
 * This service provides functions for calculating option prices and Greeks
 * using the Black-Scholes model, as well as identifying potential arbitrage
 * opportunities in the options market.
 */

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal probability density function
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate d1 and d2 parameters for Black-Scholes
 */
function calculateD1D2(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number
): { d1: number; d2: number } {
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / 
             (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  
  return { d1, d2 };
}

export interface OptionPricingResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility?: number;
}

export interface ArbitrageOpportunity {
  contractTicker: string;
  underlyingTicker: string;
  strikePrice: number;
  expirationDate: string;
  contractType: 'call' | 'put';
  marketPrice: number;
  theoreticalPrice: number;
  priceDifference: number;
  percentageDifference: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedProfit: number;
  maxLoss: number;
  riskRewardRatio: number;
}

export class BlackScholesService {
  /**
   * Calculate option price and Greeks using Black-Scholes model
   * 
   * @param spotPrice Current price of the underlying asset
   * @param strikePrice Strike price of the option
   * @param timeToExpiry Time to expiration in years
   * @param riskFreeRate Risk-free interest rate (as a decimal, e.g., 0.05 for 5%)
   * @param volatility Implied volatility (as a decimal)
   * @param isCall Whether the option is a call (true) or put (false)
   * @returns Object containing price and Greeks
   */
  static calculateOptionPrice(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    isCall: boolean
  ): OptionPricingResult {
    // Validate inputs
    if (spotPrice <= 0 || strikePrice <= 0 || timeToExpiry <= 0 || volatility <= 0) {
      throw new Error('Invalid input parameters: values must be positive');
    }

    // Handle very small time to expiry to avoid numerical issues
    if (timeToExpiry < 0.000001) {
      timeToExpiry = 0.000001;
    }

    const { d1, d2 } = calculateD1D2(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
    
    let price: number;
    let delta: number;
    
    if (isCall) {
      price = spotPrice * normalCDF(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
      delta = normalCDF(d1);
    } else {
      price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) - spotPrice * normalCDF(-d1);
      delta = normalCDF(d1) - 1;
    }
    
    // Calculate other Greeks
    const gamma = normalPDF(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry));
    
    // Theta (per calendar day)
    const theta1 = -(spotPrice * volatility * normalPDF(d1)) / (2 * Math.sqrt(timeToExpiry));
    const theta2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry);
    let theta: number;
    
    if (isCall) {
      theta = (theta1 - theta2 * normalCDF(d2)) / 365;
    } else {
      theta = (theta1 + theta2 * normalCDF(-d2)) / 365;
    }
    
    // Vega (for 1% change in volatility)
    const vega = spotPrice * Math.sqrt(timeToExpiry) * normalPDF(d1) * 0.01;
    
    // Rho (for 1% change in interest rate)
    let rho: number;
    if (isCall) {
      rho = strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2) * 0.01;
    } else {
      rho = -strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) * 0.01;
    }
    
    return {
      price,
      delta,
      gamma,
      theta,
      vega,
      rho
    };
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   * 
   * @param marketPrice Market price of the option
   * @param spotPrice Current price of the underlying asset
   * @param strikePrice Strike price of the option
   * @param timeToExpiry Time to expiration in years
   * @param riskFreeRate Risk-free interest rate (as a decimal)
   * @param isCall Whether the option is a call (true) or put (false)
   * @param tolerance Precision tolerance (default: 0.0001)
   * @param maxIterations Maximum iterations (default: 100)
   * @returns Implied volatility or undefined if it doesn't converge
   */
  static calculateImpliedVolatility(
    marketPrice: number,
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    isCall: boolean,
    tolerance: number = 0.0001,
    maxIterations: number = 100
  ): number | undefined {
    // Initial guess for implied volatility
    let volatility = 0.3;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      const result = this.calculateOptionPrice(
        spotPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        isCall
      );
      
      const priceDifference = result.price - marketPrice;
      
      // If the price difference is within tolerance, return the volatility
      if (Math.abs(priceDifference) < tolerance) {
        return volatility;
      }
      
      // Update volatility using Newton-Raphson method
      // vega is the derivative of price with respect to volatility
      volatility = volatility - priceDifference / (result.vega * 100);
      
      // Ensure volatility stays within reasonable bounds
      if (volatility <= 0.001) volatility = 0.001;
      if (volatility > 5) volatility = 5;
      
      iteration++;
    }
    
    // If we didn't converge, return undefined
    return undefined;
  }

  /**
   * Find arbitrage opportunities in options contracts
   * 
   * @param contracts Array of options contracts to analyze
   * @param riskFreeRate Risk-free interest rate (as a decimal)
   * @param minPriceDifference Minimum price difference to consider (default: 0.05 or 5%)
   * @returns Array of arbitrage opportunities
   */
  static findArbitrageOpportunities(
    contracts: any[],
    riskFreeRate: number = 0.05,
    minPriceDifference: number = 0.05
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const contract of contracts) {
      try {
        // Extract contract details
        const spotPrice = contract.underlying_price || 0;
        if (!spotPrice) continue; // Skip if no underlying price
        
        const strikePrice = contract.strike_price;
        const marketPrice = contract.last;
        const bid = contract.bid;
        const ask = contract.ask;
        
        // Calculate time to expiry in years
        const expiryDate = new Date(contract.expiration_date);
        const currentDate = new Date();
        const timeToExpiryDays = Math.max(1, (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        const timeToExpiry = timeToExpiryDays / 365;
        
        // Use implied volatility from the contract or calculate it
        let volatility = contract.implied_volatility;
        if (!volatility && bid > 0 && ask > 0) {
          // If IV is not provided, calculate it using the mid price
          const midPrice = (bid + ask) / 2;
          volatility = this.calculateImpliedVolatility(
            midPrice,
            spotPrice,
            strikePrice,
            timeToExpiry,
            riskFreeRate,
            contract.contract_type === 'call'
          ) || 0.3; // Default to 30% if calculation fails
        }
        
        // Calculate theoretical price
        const theoreticalResult = this.calculateOptionPrice(
          spotPrice,
          strikePrice,
          timeToExpiry,
          riskFreeRate,
          volatility,
          contract.contract_type === 'call'
        );
        
        const theoreticalPrice = theoreticalResult.price;
        
        // Calculate price difference
        const priceDifference = marketPrice - theoreticalPrice;
        const percentageDifference = Math.abs(priceDifference) / theoreticalPrice;
        
        // If the difference is significant, consider it an arbitrage opportunity
        if (percentageDifference >= minPriceDifference) {
          // Determine confidence level based on liquidity and spread
          let confidence: 'high' | 'medium' | 'low' = 'low';
          
          if (contract.volume > 1000 && contract.open_interest > 5000 && (ask - bid) / bid < 0.1) {
            confidence = 'high';
          } else if (contract.volume > 500 && contract.open_interest > 1000 && (ask - bid) / bid < 0.2) {
            confidence = 'medium';
          }
          
          // Calculate expected profit and max loss
          const expectedProfit = Math.abs(priceDifference) * 100; // Per contract (100 shares)
          const maxLoss = confidence === 'high' ? expectedProfit * 0.5 : 
                         confidence === 'medium' ? expectedProfit : 
                         expectedProfit * 2;
          
          // Generate recommendation
          let recommendation = '';
          if (priceDifference > 0) {
            recommendation = `${contract.contract_type === 'call' ? 'Call' : 'Put'} appears overpriced. Consider selling ${contract.ticker}.`;
          } else {
            recommendation = `${contract.contract_type === 'call' ? 'Call' : 'Put'} appears underpriced. Consider buying ${contract.ticker}.`;
          }
          
          opportunities.push({
            contractTicker: contract.ticker,
            underlyingTicker: contract.underlying_ticker,
            strikePrice: contract.strike_price,
            expirationDate: contract.expiration_date,
            contractType: contract.contract_type,
            marketPrice,
            theoreticalPrice,
            priceDifference,
            percentageDifference,
            confidence,
            recommendation,
            expectedProfit,
            maxLoss,
            riskRewardRatio: expectedProfit / maxLoss
          });
        }
      } catch (error) {
        console.error(`Error analyzing contract ${contract.ticker}:`, error);
      }
    }
    
    // Sort opportunities by percentage difference (highest first)
    return opportunities.sort((a, b) => b.percentageDifference - a.percentageDifference);
  }

  /**
   * Check for put-call parity arbitrage opportunities
   * 
   * @param callContracts Call option contracts
   * @param putContracts Put option contracts with matching strikes and expirations
   * @param spotPrice Current price of the underlying asset
   * @param riskFreeRate Risk-free interest rate (as a decimal)
   * @returns Array of arbitrage opportunities
   */
  static findPutCallParityArbitrage(
    callContracts: any[],
    putContracts: any[],
    spotPrice: number,
    riskFreeRate: number = 0.05
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Group contracts by strike and expiration
    const contractMap = new Map<string, { call: any, put: any }>();
    
    // Map call contracts
    for (const call of callContracts) {
      const key = `${call.strike_price}-${call.expiration_date}`;
      if (!contractMap.has(key)) {
        contractMap.set(key, { call, put: null });
      } else {
        const pair = contractMap.get(key);
        pair.call = call;
      }
    }
    
    // Map put contracts and check for pairs
    for (const put of putContracts) {
      const key = `${put.strike_price}-${put.expiration_date}`;
      if (!contractMap.has(key)) {
        contractMap.set(key, { call: null, put });
      } else {
        const pair = contractMap.get(key);
        pair.put = put;
      }
    }
    
    // Check each pair for put-call parity arbitrage
    for (const [key, pair] of contractMap.entries()) {
      if (!pair.call || !pair.put) continue; // Skip if we don't have both call and put
      
      const call = pair.call;
      const put = pair.put;
      const strikePrice = call.strike_price;
      
      // Calculate time to expiry in years
      const expiryDate = new Date(call.expiration_date);
      const currentDate = new Date();
      const timeToExpiryDays = Math.max(1, (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeToExpiry = timeToExpiryDays / 365;
      
      // Put-call parity: C + K*e^(-rT) = P + S
      const callPrice = call.last;
      const putPrice = put.last;
      const discountedStrike = strikePrice * Math.exp(-riskFreeRate * timeToExpiry);
      
      // Calculate both sides of the equation
      const leftSide = callPrice + discountedStrike;
      const rightSide = putPrice + spotPrice;
      
      // Calculate the difference
      const difference = Math.abs(leftSide - rightSide);
      const percentageDifference = difference / Math.min(leftSide, rightSide);
      
      // If there's a significant difference, it's an arbitrage opportunity
      if (percentageDifference >= 0.02) { // 2% threshold
        let recommendation = '';
        let contractTicker = '';
        let contractType: 'call' | 'put' = 'call';
        
        if (leftSide > rightSide) {
          // Left side overvalued: Sell call, buy put, buy stock, borrow cash
          recommendation = 'Sell call, buy put, buy stock, borrow cash';
          contractTicker = call.ticker;
          contractType = 'call';
        } else {
          // Right side overvalued: Buy call, sell put, short stock, lend cash
          recommendation = 'Buy call, sell put, short stock, lend cash';
          contractTicker = put.ticker;
          contractType = 'put';
        }
        
        // Calculate expected profit and max loss
        const expectedProfit = difference * 100; // Per contract (100 shares)
        const maxLoss = expectedProfit * 0.5; // Estimate
        
        opportunities.push({
          contractTicker,
          underlyingTicker: call.underlying_ticker,
          strikePrice,
          expirationDate: call.expiration_date,
          contractType,
          marketPrice: contractType === 'call' ? callPrice : putPrice,
          theoreticalPrice: contractType === 'call' ? (rightSide - discountedStrike) : (leftSide - spotPrice),
          priceDifference: difference,
          percentageDifference,
          confidence: percentageDifference > 0.05 ? 'high' : 'medium',
          recommendation,
          expectedProfit,
          maxLoss,
          riskRewardRatio: expectedProfit / maxLoss
        });
      }
    }
    
    return opportunities.sort((a, b) => b.percentageDifference - a.percentageDifference);
  }

  /**
   * Find volatility arbitrage opportunities
   * 
   * @param contracts Array of options contracts to analyze
   * @param historicalVolatility Historical volatility of the underlying asset
   * @param minVolDifference Minimum volatility difference to consider (default: 0.1 or 10%)
   * @returns Array of arbitrage opportunities
   */
  static findVolatilityArbitrage(
    contracts: any[],
    historicalVolatility: number,
    minVolDifference: number = 0.1
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const contract of contracts) {
      try {
        const impliedVolatility = contract.implied_volatility;
        if (!impliedVolatility) continue;
        
        // Calculate volatility difference
        const volDifference = impliedVolatility - historicalVolatility;
        const percentageDifference = Math.abs(volDifference) / historicalVolatility;
        
        if (percentageDifference >= minVolDifference) {
          // Calculate theoretical price using historical volatility
          const spotPrice = contract.underlying_price || 0;
          if (!spotPrice) continue;
          
          const strikePrice = contract.strike_price;
          const marketPrice = contract.last;
          
          // Calculate time to expiry in years
          const expiryDate = new Date(contract.expiration_date);
          const currentDate = new Date();
          const timeToExpiryDays = Math.max(1, (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          const timeToExpiry = timeToExpiryDays / 365;
          
          // Use historical volatility to calculate theoretical price
          const theoreticalResult = this.calculateOptionPrice(
            spotPrice,
            strikePrice,
            timeToExpiry,
            0.05, // Assume 5% risk-free rate
            historicalVolatility,
            contract.contract_type === 'call'
          );
          
          const theoreticalPrice = theoreticalResult.price;
          const priceDifference = marketPrice - theoreticalPrice;
          const priceDifferencePercentage = Math.abs(priceDifference) / theoreticalPrice;
          
          let recommendation = '';
          if (volDifference > 0) {
            // Implied volatility higher than historical
            recommendation = `Implied volatility (${(impliedVolatility * 100).toFixed(1)}%) is higher than historical volatility (${(historicalVolatility * 100).toFixed(1)}%). Consider selling ${contract.contract_type}s and delta-hedging.`;
          } else {
            // Historical volatility higher than implied
            recommendation = `Implied volatility (${(impliedVolatility * 100).toFixed(1)}%) is lower than historical volatility (${(historicalVolatility * 100).toFixed(1)}%). Consider buying ${contract.contract_type}s and delta-hedging.`;
          }
          
          // Calculate expected profit and max loss
          const expectedProfit = Math.abs(priceDifference) * 100; // Per contract (100 shares)
          const maxLoss = contract.contract_type === 'call' ? 
                         (spotPrice * 0.1 * 100) : // 10% move in underlying for calls
                         (strikePrice * 0.1 * 100); // 10% of strike for puts
          
          opportunities.push({
            contractTicker: contract.ticker,
            underlyingTicker: contract.underlying_ticker,
            strikePrice: contract.strike_price,
            expirationDate: contract.expiration_date,
            contractType: contract.contract_type,
            marketPrice,
            theoreticalPrice,
            priceDifference,
            percentageDifference: priceDifferencePercentage,
            confidence: percentageDifference > 0.1 ? 'high' : 'medium',
            recommendation,
            expectedProfit,
            maxLoss,
            riskRewardRatio: expectedProfit / maxLoss
          });
        }
      } catch (error) {
        console.error(`Error analyzing volatility for contract ${contract.ticker}:`, error);
      }
    }
    
    return opportunities.sort((a, b) => b.percentageDifference - a.percentageDifference);
  }
}