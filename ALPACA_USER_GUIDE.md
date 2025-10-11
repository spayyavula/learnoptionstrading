# Alpaca Setup - User Guide

## Three Ways to Connect Your Alpaca Account

We've made it easy to connect your Alpaca brokerage account with **three different setup methods**. Choose the one that works best for you!

---

## Method 1: Quick Setup (Accordion) ⚡

**Best for:** Experienced users who want fast setup

### How to Access
1. Go to **Settings** page
2. Find **"Live Trading Integration"** section
3. Click on **"Alpaca Trading Credentials"** to expand

### What You'll See

When collapsed:
```
┌─────────────────────────────────────────┐
│ > Alpaca Trading Credentials       ✓   │
│   1 account(s) connected                │
└─────────────────────────────────────────┘
```

When expanded:
```
┌─────────────────────────────────────────┐
│ ∨ Alpaca Trading Credentials            │
│                                          │
│ 🔒 Connected Accounts                   │
│ ┌────────────────────────────────────┐  │
│ │ ● Paper Trading          [Remove]  │  │
│ │ Level 2 • Compliance OK            │  │
│ │ Validated: 1/15/2025               │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Add Another Account  [Use Setup Wizard] │
│                                          │
│ Environment          (i) <- Click       │
│ [Paper]  [Live]                          │
│                                          │
│ API Key ID           (i)                │
│ [PKXXXXXXXXXXXXXXXXX]  👁               │
│                                          │
│ API Secret Key       (i)                │
│ [••••••••••••••••••]  👁               │
│                                          │
│ Options Trading Level (i)               │
│ [▼ Level 2 - Buy Calls & Puts]         │
│                                          │
│ 📋 Standard - Available Strategies:    │
│ • Buy Calls                             │
│ • Buy Puts                              │
│ • Level 1 Strategies                    │
│                                          │
│ [Test Connection] [Save Credentials]    │
└─────────────────────────────────────────┘
```

### Features You'll Love

#### 1. **Interactive Help** (i) Icons
Click the **(i)** icon next to any field to see:
- What the field means
- How to get the right information
- Link to Alpaca documentation
- Best practices

Example:
```
API Key ID                              (i) <- Click this
┌─────────────────────────────────────────┐
│ ℹ API Key ID                            │
│                                          │
│ Your API Key ID is a public identifier  │
│ for your Alpaca account. Paper trading  │
│ keys start with "PK" while live trading │
│ keys start with "AK".                   │
│                                          │
│ 🔗 Generate API keys ↗                  │
└─────────────────────────────────────────┘
```

#### 2. **Real-Time Validation**
As you type, you'll see instant feedback:

**Valid Input:**
```
API Key ID
┌─────────────────────────────────────────┐
│ PKABCDEFGHIJ1234567890               ✓  │
└─────────────────────────────────────────┘
```

**Warning:**
```
API Key ID
┌─────────────────────────────────────────┐
│ ⚠ PK123                                  │ <- Yellow
└─────────────────────────────────────────┘
⚠ API Key appears to be too short
```

**Error:**
```
API Secret
┌─────────────────────────────────────────┐
│ ✕                                        │ <- Red
└─────────────────────────────────────────┘
✕ API Secret is required
```

#### 3. **Test Before Saving**
- Click **"Test Connection"** to verify your credentials
- We'll check with Alpaca's servers
- Shows success/failure message
- Safe to test - won't activate live trading yet

```
✓ Credentials validated successfully!
```

#### 4. **See All Your Accounts**
- View all connected accounts (paper and live)
- See trading level for each
- Check last validation date
- Remove credentials with one click

---

## Method 2: Step-by-Step Wizard 🧙

**Best for:** First-time users or those who want guidance

### How to Access
1. Go to **Settings** page
2. Find **"Live Trading Integration"** section
3. Click **"Alpaca Trading Credentials"** to expand
4. Click **"Use Setup Wizard"** link

### The 4-Step Journey

#### Step 1: Choose Your Environment
```
┌─────────────────────────────────────────┐
│     🛡️ Connect Your Alpaca Account      │
│                                          │
│ Before You Start:                        │
│ ✓ You need an approved Alpaca account   │
│ ✓ Account must be approved for options  │
│ ✓ Have your API credentials ready       │
│                                          │
│ Choose Environment:                      │
│                                          │
│ ┌────────────┐  ┌────────────┐         │
│ │  Paper     │  │    Live    │         │
│ │  Trading   │  │   Trading  │         │
│ │            │  │            │         │
│ │ Practice   │  │ Trade with │         │
│ │ with $$$   │  │ real money │         │
│ └────────────┘  └────────────┘         │
│                                          │
│ ⚠ Start with paper trading to practice  │
│                                          │
│ [Cancel]              [Continue →]      │
└─────────────────────────────────────────┘
```

#### Step 2: Enter Your Credentials
```
┌─────────────────────────────────────────┐
│     🔑 Enter API Credentials             │
│                                          │
│ How to get your API keys:                │
│ 1. Log in to your Alpaca account        │
│ 2. Navigate to API Keys section         │
│ 3. Generate new keys for Paper Trading  │
│ 4. Copy and paste them below            │
│                                          │
│ 🔗 Open Alpaca Dashboard ↗              │
│                                          │
│ API Key ID                               │
│ [________________________]  👁          │
│                                          │
│ Secret Key                               │
│ [________________________]  👁          │
│                                          │
│ Options Trading Level                    │
│ [▼ Level 2 - Buy Calls & Puts]         │
│                                          │
│ 🔒 Your credentials are encrypted using │
│    AES-256 encryption before storage    │
│                                          │
│ [← Back]        [Validate & Continue]   │
└─────────────────────────────────────────┘
```

#### Step 3: Verify Account Info
```
┌─────────────────────────────────────────┐
│     ✓ Credentials Verified               │
│                                          │
│ Your Alpaca account has been connected!  │
│                                          │
│ Account Information:                     │
│ • Account: PA123456789                   │
│ • Status: ACTIVE                         │
│ • Buying Power: $100,000.00             │
│ • Trading Level: Level 2                 │
│                                          │
│ Trading Level Restrictions:              │
│ Allowed Strategies:                      │
│ • Buy Calls                              │
│ • Buy Puts                               │
│ • Level 1 Strategies                     │
│                                          │
│ Restrictions:                            │
│ • Cannot use spreads or multi-leg       │
│ • Cannot sell naked options             │
│                                          │
│ [← Back]    [Continue to Disclosures]   │
└─────────────────────────────────────────┘
```

#### Step 4: Acknowledge Disclosures
```
┌─────────────────────────────────────────┐
│     ⚠️ Important Disclosures             │
│                                          │
│ Please read and acknowledge:             │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Options Trading Risk Disclosure      ││
│ │                                      ││
│ │ # Options Trading Risk Disclosure   ││
│ │                                      ││
│ │ Options trading involves significant││
│ │ risk and is not suitable for all    ││
│ │ investors...                         ││
│ │                                      ││
│ │ ## Key Risks:                        ││
│ │ 1. Total Loss of Premium             ││
│ │ 2. Unlimited Loss Potential          ││
│ │ 3. Time Decay...                     ││
│ │ [Scroll for more]                    ││
│ └──────────────────────────────────────┘│
│                                          │
│ ☐ I have read and understand options    │
│   trading risks                          │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Pattern Day Trader Rules             ││
│ │ [Scroll to read...]                  ││
│ └──────────────────────────────────────┘│
│                                          │
│ ☐ I understand Pattern Day Trader rules │
│                                          │
│ [← Back]            [Complete Setup]    │
└─────────────────────────────────────────┘
```

### Progress Indicator
At the top of every step:
```
Step 1 of 4
█████░░░░░░░░░░░░
```

---

## Method 3: Standard Form 📝

**Best for:** Quick access, minimal UI

Simple form with all fields visible at once. Less guidance, faster for experienced users.

---

## Getting Your Alpaca API Keys

### For Paper Trading (Practice)

1. Go to [https://app.alpaca.markets/paper/dashboard/overview](https://app.alpaca.markets/paper/dashboard/overview)
2. Click **"API Keys"** in the left menu
3. Click **"Generate New Key"**
4. Give it a name (e.g., "Options Trading App")
5. Copy your Key ID (starts with **PK**)
6. Copy your Secret Key (long random string)
7. Save them somewhere safe!

### For Live Trading (Real Money)

1. Go to [https://app.alpaca.markets/live/dashboard/overview](https://app.alpaca.markets/live/dashboard/overview)
2. Follow same steps as paper trading
3. Your Key ID will start with **AK**
4. ⚠️ **WARNING:** This is real money - start with paper trading first!

---

## Understanding Trading Levels

### Level 0: No Options Trading
- ❌ Cannot trade options at all
- You need to get approved by Alpaca

### Level 1: Basic (Covered Strategies)
- ✅ Covered Calls (must own stock)
- ✅ Cash-Secured Puts (must have cash)
- ❌ Cannot buy calls or puts
- ❌ Cannot use spreads

### Level 2: Standard (Long Options)
- ✅ Buy Calls
- ✅ Buy Puts
- ✅ All Level 1 strategies
- ❌ Cannot use spreads
- ❌ Cannot sell naked options

### Level 3: Advanced (Full Strategies)
- ✅ All spreads (vertical, calendar, diagonal)
- ✅ Iron Condors
- ✅ Butterflies
- ✅ Straddles
- ✅ Strangles
- ✅ All Level 1 & 2 strategies

**How to increase your level:** Contact Alpaca support and request options approval upgrade. Requirements vary by level.

---

## Safety Tips

### ✅ DO
- Start with paper trading
- Test your strategies first
- Read all disclosures
- Understand PDT rules
- Keep credentials secure
- Use Test Connection button

### ❌ DON'T
- Jump straight to live trading
- Share your API keys
- Use credentials in multiple apps simultaneously
- Ignore validation warnings
- Skip the disclosures
- Trade without understanding risks

---

## Troubleshooting

### "Invalid credentials"
- ✓ Check you copied the full key (no spaces)
- ✓ Verify paper key starts with PK, live with AK
- ✓ Ensure keys are from correct environment
- ✓ Try regenerating keys in Alpaca dashboard

### "API Key appears too short"
- ⚠️ This is a warning, not error
- ✓ Double-check you pasted entire key
- ✓ Alpaca keys should be 20+ characters

### "Trading level 0" message
- ℹ️ Your account isn't approved for options
- ✓ Contact Alpaca to get options approval
- ✓ May take 1-3 business days

### "Insufficient buying power"
- ✓ Fund your account (for live trading)
- ✓ Check your paper trading balance
- ✓ Verify options buying power is available

### Can't see saved credentials
- ✓ Refresh the page
- ✓ Check you're logged in
- ✓ Look in "Connected Accounts" section
- ✓ Expand the accordion if collapsed

---

## What Happens After Setup?

### Immediately
1. ✅ Credentials are encrypted and saved
2. ✅ Account is validated with Alpaca
3. ✅ Compliance acknowledgments recorded
4. ✅ Audit log entry created

### Next Steps
1. Go to Dashboard to see account info
2. Switch trading mode (Paper/Alpaca Paper/Alpaca Live)
3. View real-time buying power
4. See Pattern Day Trader status
5. Place your first order!

### Security
- 🔒 Credentials encrypted with AES-256
- 🔒 Never stored in plain text
- 🔒 Never visible after saving
- 🔒 Can be deleted anytime
- 🔒 All actions logged for security

---

## Switching Between Accounts

You can have both paper and live credentials saved:

```
🟢 Paper Trading
   Level 2 • Compliance OK
   [Remove]

🔴 Live Trading
   Level 3 • Compliance OK
   [Remove]
```

Switch between them using the **Trading Mode Toggle** in the main navigation.

---

## Need Help?

### Documentation
- [Alpaca Docs](https://docs.alpaca.markets)
- [Options Trading Guide](https://docs.alpaca.markets/docs/options-trading)
- [API Keys Guide](https://docs.alpaca.markets/docs/about-api-keys)
- [PDT Rules Explained](https://www.finra.org/investors/learn-to-invest/advanced-investing/day-trading-margin-requirements-know-rules)

### Support
- Alpaca Support: [https://alpaca.markets/support](https://alpaca.markets/support)
- Check console for error details
- Review audit logs in Settings

---

## Quick Comparison

| Feature | Accordion | Wizard | Standard |
|---------|-----------|--------|----------|
| Setup Time | 2 min | 5 min | 2 min |
| Guidance | Medium | High | Low |
| Help Available | Interactive | Static | Minimal |
| Best For | Experienced | First-time | Advanced |
| Can Test First | ✓ Yes | ✗ No | ✓ Yes |
| Shows Existing | ✓ Yes | ✗ No | ✓ Yes |

Choose the method that matches your experience level and preferences!
