import type { OptionsContract } from '../types/options'

export interface ATMFilterResult {
  atmStrike: number
  filteredContracts: OptionsContract[]
  underlyingPrice: number
}

export class OptionsChainFilterService {
  static identifyATMStrike(underlyingPrice: number, availableStrikes: number[]): number {
    if (availableStrikes.length === 0) return underlyingPrice

    let closestStrike = availableStrikes[0]
    let minDifference = Math.abs(availableStrikes[0] - underlyingPrice)

    for (const strike of availableStrikes) {
      const difference = Math.abs(strike - underlyingPrice)
      if (difference < minDifference) {
        minDifference = difference
        closestStrike = strike
      }
    }

    return closestStrike
  }

  static getStrikesAroundATM(
    atmStrike: number,
    allStrikes: number[],
    numAbove: number = 10,
    numBelow: number = 10
  ): number[] {
    const sortedStrikes = [...allStrikes].sort((a, b) => a - b)
    const atmIndex = sortedStrikes.indexOf(atmStrike)

    if (atmIndex === -1) return sortedStrikes.slice(0, 21)

    const startIndex = Math.max(0, atmIndex - numBelow)
    const endIndex = Math.min(sortedStrikes.length, atmIndex + numAbove + 1)

    return sortedStrikes.slice(startIndex, endIndex)
  }

  static filterATMContracts(
    contracts: OptionsContract[],
    underlyingPrice: number,
    contractType?: 'call' | 'put'
  ): ATMFilterResult {
    let filteredByType = contracts

    if (contractType) {
      filteredByType = contracts.filter(c => c.contract_type === contractType)
    }

    if (filteredByType.length === 0) {
      return {
        atmStrike: underlyingPrice,
        filteredContracts: [],
        underlyingPrice
      }
    }

    const uniqueStrikes = [...new Set(filteredByType.map(c => c.strike_price))].sort((a, b) => a - b)
    const atmStrike = this.identifyATMStrike(underlyingPrice, uniqueStrikes)
    const selectedStrikes = this.getStrikesAroundATM(atmStrike, uniqueStrikes, 10, 10)

    const filteredContracts = filteredByType
      .filter(c => selectedStrikes.includes(c.strike_price))
      .sort((a, b) => a.strike_price - b.strike_price)

    return {
      atmStrike,
      filteredContracts,
      underlyingPrice
    }
  }

  static filterATMContractsByExpiration(
    contracts: OptionsContract[],
    underlyingPrice: number,
    expirationDate: string,
    contractType?: 'call' | 'put'
  ): ATMFilterResult {
    const contractsForExpiry = contracts.filter(c => c.expiration_date === expirationDate)
    return this.filterATMContracts(contractsForExpiry, underlyingPrice, contractType)
  }

  static getAvailableExpirations(contracts: OptionsContract[]): string[] {
    const expirations = [...new Set(contracts.map(c => c.expiration_date))]
    return expirations.sort()
  }

  static isATMStrike(strike: number, atmStrike: number): boolean {
    return strike === atmStrike
  }

  static getMoneyness(strike: number, underlyingPrice: number, contractType: 'call' | 'put'): 'ITM' | 'ATM' | 'OTM' {
    const difference = Math.abs(strike - underlyingPrice)
    const threshold = underlyingPrice * 0.01

    if (difference < threshold) return 'ATM'

    if (contractType === 'call') {
      return strike < underlyingPrice ? 'ITM' : 'OTM'
    } else {
      return strike > underlyingPrice ? 'ITM' : 'OTM'
    }
  }

  static formatStrikeDisplay(
    contract: OptionsContract,
    atmStrike: number,
    underlyingPrice: number
  ): string {
    const isATM = this.isATMStrike(contract.strike_price, atmStrike)
    const moneyness = this.getMoneyness(contract.strike_price, underlyingPrice, contract.contract_type)
    const atmLabel = isATM ? ' [ATM]' : ''
    const moneynessLabel = ` (${moneyness})`

    return `$${contract.strike_price}${atmLabel}${moneynessLabel} - $${contract.last.toFixed(2)}`
  }

  static validateContractLiquidity(contract: OptionsContract): {
    isLiquid: boolean
    warnings: string[]
  } {
    const warnings: string[] = []
    let isLiquid = true

    if (contract.volume < 10) {
      warnings.push('Low volume (< 10)')
      isLiquid = false
    }

    if (contract.open_interest < 50) {
      warnings.push('Low open interest (< 50)')
      isLiquid = false
    }

    const bidAskSpread = contract.ask - contract.bid
    const spreadPercent = (bidAskSpread / contract.last) * 100

    if (spreadPercent > 10) {
      warnings.push(`Wide bid-ask spread (${spreadPercent.toFixed(1)}%)`)
    }

    return { isLiquid, warnings }
  }
}
