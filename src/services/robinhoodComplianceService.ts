export interface ComplianceDisclosure {
  title: string
  content: string
  version: string
  required: boolean
}

export class RobinhoodComplianceService {
  static getRegulatoryDisclosure(type: string): ComplianceDisclosure {
    const disclosures: Record<string, ComplianceDisclosure> = {
      crypto_risk: {
        title: 'Cryptocurrency Trading Risk Disclosure',
        version: '1.0',
        required: true,
        content: `IMPORTANT RISK DISCLOSURE FOR CRYPTOCURRENCY TRADING

By trading cryptocurrencies on Robinhood, you acknowledge and accept the following risks:

1. MARKET VOLATILITY
Cryptocurrency markets are highly volatile and can experience extreme price swings in very short periods. You may lose your entire investment.

2. 24/7 TRADING
Cryptocurrency markets operate 24 hours a day, 7 days a week, including weekends and holidays. Prices can change significantly while you are unable to monitor your positions.

3. LIMITED OWNERSHIP RIGHTS
When you purchase cryptocurrencies on Robinhood, you do not have full ownership or control:
- You cannot transfer crypto to external wallets
- You cannot use crypto for payments or transactions outside Robinhood
- You are dependent on Robinhood's custody services

4. REGULATORY UNCERTAINTY
Cryptocurrency regulations are evolving and unclear. Future regulatory changes could:
- Restrict or prohibit cryptocurrency trading
- Impact the value of your holdings
- Affect your ability to buy, sell, or transfer crypto

5. TECHNOLOGY RISKS
Cryptocurrencies are based on blockchain technology which has inherent risks:
- Network failures or congestion
- Smart contract vulnerabilities
- Cybersecurity threats
- Loss of private keys (though managed by Robinhood)

6. LIQUIDITY RISKS
During periods of high volatility or market stress:
- You may be unable to execute trades at desired prices
- Order execution may be delayed
- Trading may be temporarily halted

7. NO FDIC OR SIPC PROTECTION
Cryptocurrency holdings are NOT protected by:
- Federal Deposit Insurance Corporation (FDIC)
- Securities Investor Protection Corporation (SIPC)
If Robinhood becomes insolvent, you may lose your crypto holdings.

8. IRREVERSIBLE TRANSACTIONS
Cryptocurrency transactions are generally irreversible. If you make an error or are victim of fraud, you may not be able to recover your funds.

9. TAX IMPLICATIONS
Cryptocurrency transactions may have tax consequences. Consult with a tax professional to understand your obligations.

10. LOSS OF ACCESS
If you lose access to your Robinhood account due to:
- Forgotten credentials
- Account restrictions
- Company policy changes
You may be unable to access your cryptocurrency holdings.

INVESTMENT SUITABILITY
Cryptocurrency trading is highly speculative and not suitable for all investors. Only invest what you can afford to lose entirely. Consider your financial situation, investment objectives, and risk tolerance before trading cryptocurrencies.

NO INVESTMENT ADVICE
This disclosure is for informational purposes only and does not constitute investment, financial, legal, or tax advice. Robinhood does not recommend any particular cryptocurrency or trading strategy.

By proceeding, you confirm that you have read, understood, and accept these risks.`
      },
      market_volatility: {
        title: 'Extreme Market Volatility Warning',
        version: '1.0',
        required: true,
        content: `EXTREME MARKET VOLATILITY WARNING

Cryptocurrency markets can experience:

- Price changes of 20% or more in a single day
- Flash crashes with sudden drops of 50% or more
- Extended bear markets lasting months or years
- Pumps and dumps manipulated by large holders
- News-driven volatility from regulatory announcements

Past performance does not guarantee future results. The value of cryptocurrencies can fall to zero.

You should:
- Only invest money you can afford to lose completely
- Diversify your investments across multiple asset classes
- Avoid using borrowed money or margin to trade cryptocurrencies
- Monitor your positions regularly due to 24/7 trading
- Set stop-loss orders to limit potential losses
- Have a clear exit strategy before entering positions

Do not make investment decisions based on:
- Social media hype or "FOMO" (fear of missing out)
- Celebrity endorsements
- Get-rich-quick promises
- Insider tips or rumors

Always conduct your own research and consider consulting with a financial advisor before making investment decisions.`
      },
      custody_limitations: {
        title: 'Custody and Transfer Limitations',
        version: '1.0',
        required: true,
        content: `CUSTODY AND TRANSFER LIMITATIONS

When you hold cryptocurrency on Robinhood:

1. LIMITED OWNERSHIP
- You do not control the private keys to your cryptocurrency
- You cannot send crypto to external wallets or exchanges
- You cannot receive crypto from external sources
- You cannot use your crypto for payments or smart contracts

2. ROBINHOOD CUSTODY
- All cryptocurrency is held in custody by Robinhood Crypto, LLC
- Your ability to access your crypto depends on Robinhood's systems and policies
- Robinhood may restrict or suspend trading at any time
- During system outages, you cannot access or trade your crypto

3. NO DEPOSITS OR WITHDRAWALS
- You can only buy and sell crypto within the Robinhood platform
- To move crypto elsewhere, you must sell on Robinhood and buy on another platform
- This may result in tax events and transaction costs

4. COUNTERPARTY RISK
- You are exposed to Robinhood's financial stability
- In the event of Robinhood's insolvency, your crypto may be at risk
- Cryptocurrency holdings are not insured by FDIC or SIPC

These limitations mean you do not have the same control over your crypto as you would with a self-custody wallet or exchange that permits transfers.

By proceeding, you acknowledge and accept these custody limitations.`
      }
    }

    return disclosures[type] || {
      title: 'Unknown Disclosure',
      content: 'Disclosure content not found',
      version: '1.0',
      required: false
    }
  }

  static getAllRequiredDisclosures(): ComplianceDisclosure[] {
    return [
      this.getRegulatoryDisclosure('crypto_risk'),
      this.getRegulatoryDisclosure('market_volatility'),
      this.getRegulatoryDisclosure('custody_limitations')
    ]
  }

  static validateComplianceAcknowledgments(acknowledgments: Record<string, boolean>): {
    valid: boolean
    missing: string[]
  } {
    const required = ['crypto_risk', 'market_volatility', 'custody_limitations']
    const missing = required.filter(key => !acknowledgments[key])

    return {
      valid: missing.length === 0,
      missing
    }
  }

  static getCryptoTradingGuidelines(): string[] {
    return [
      'Only invest what you can afford to lose completely',
      'Cryptocurrencies are highly volatile and speculative',
      'Crypto markets operate 24/7 - prices change constantly',
      'You cannot transfer crypto off Robinhood platform',
      'Crypto holdings are not FDIC or SIPC insured',
      'Do your own research before investing',
      'Be aware of tax implications of crypto trading',
      'Beware of scams and fraudulent schemes',
      'Never share your account credentials',
      'Use strong passwords and enable two-factor authentication'
    ]
  }

  static getRiskLevel(orderValue: number, accountBalance: number): {
    level: 'low' | 'medium' | 'high' | 'extreme'
    warning: string
  } {
    const percentOfBalance = (orderValue / accountBalance) * 100

    if (percentOfBalance < 5) {
      return {
        level: 'low',
        warning: 'This order represents less than 5% of your account balance.'
      }
    } else if (percentOfBalance < 25) {
      return {
        level: 'medium',
        warning: 'This order represents 5-25% of your account balance. Consider diversification.'
      }
    } else if (percentOfBalance < 50) {
      return {
        level: 'high',
        warning: 'WARNING: This order represents 25-50% of your account balance. This is a significant concentration of risk.'
      }
    } else {
      return {
        level: 'extreme',
        warning: 'EXTREME RISK: This order represents over 50% of your account balance. You could lose a substantial portion of your portfolio.'
      }
    }
  }

  static getVolatilityWarning(symbol: string): string {
    const highVolatilityCoins = ['BTC', 'ETH', 'DOGE', 'SHIB', 'PEPE']

    if (highVolatilityCoins.includes(symbol.toUpperCase())) {
      return `${symbol} is known for extreme price volatility. Prices can swing dramatically in short periods.`
    }

    return `Cryptocurrency prices are highly volatile and can change rapidly.`
  }

  static shouldWarnAboutMarketHours(): boolean {
    return true
  }

  static getMarketHoursWarning(): string {
    return 'Cryptocurrency markets trade 24/7, including weekends and holidays. Prices can change significantly when you are not monitoring.'
  }

  static validateOrderRisk(
    orderType: string,
    quantity: number,
    price: number,
    accountBalance: number
  ): {
    approved: boolean
    warnings: string[]
    requiresAcknowledgment: boolean
  } {
    const warnings: string[] = []
    let requiresAcknowledgment = false

    const orderValue = quantity * price
    const riskLevel = this.getRiskLevel(orderValue, accountBalance)

    if (riskLevel.level === 'high' || riskLevel.level === 'extreme') {
      warnings.push(riskLevel.warning)
      requiresAcknowledgment = true
    }

    if (orderValue > accountBalance) {
      warnings.push('ERROR: Order value exceeds account balance. Order cannot be placed.')
      return {
        approved: false,
        warnings,
        requiresAcknowledgment: false
      }
    }

    if (orderType === 'market') {
      warnings.push('Market orders execute at current market price, which may differ from displayed prices during volatile conditions.')
    }

    warnings.push(this.getMarketHoursWarning())

    return {
      approved: true,
      warnings,
      requiresAcknowledgment
    }
  }
}
