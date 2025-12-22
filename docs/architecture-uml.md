# Options Academy - UML Architecture Diagrams

This document contains UML diagrams representing the system architecture. Diagrams are written in PlantUML format and can be rendered using:
- [PlantUML Online Server](https://www.plantuml.com/plantuml)
- VS Code PlantUML Extension
- JetBrains IDE PlantUML Plugin

---

## Table of Contents

1. [System Context Diagram](#1-system-context-diagram)
2. [Component Diagram](#2-component-diagram)
3. [Deployment Diagram](#3-deployment-diagram)
4. [Class Diagrams](#4-class-diagrams)
5. [Sequence Diagrams](#5-sequence-diagrams)
6. [State Diagrams](#6-state-diagrams)
7. [Use Case Diagram](#7-use-case-diagram)
8. [Entity Relationship Diagram](#8-entity-relationship-diagram)

---

## 1. System Context Diagram

Shows the system boundaries and external actors/systems.

```plantuml
@startuml System Context Diagram
!theme plain
skinparam backgroundColor #FEFEFE

title Options Academy - System Context Diagram

actor "Trader/User" as user
actor "Admin" as admin

package "Options Academy Platform" as system {
  [Web Application]
}

cloud "External Services" {
  [Polygon.io] as polygon
  [Stripe] as stripe
  [Broker APIs] as brokers
}

database "Azure PostgreSQL" as db

user --> system : Uses
admin --> system : Manages
system --> polygon : Market Data
system --> stripe : Payments
system --> brokers : Trading
system --> db : Persistence

note right of polygon
  Real-time options chains
  Stock prices
  Historical data
end note

note right of brokers
  Alpaca
  Interactive Brokers
  Robinhood
  Zerodha
end note

@enduml
```

---

## 2. Component Diagram

Shows the main components and their relationships.

```plantuml
@startuml Component Diagram
!theme plain
skinparam backgroundColor #FEFEFE

title Options Academy - Component Diagram

package "Frontend (React SPA)" as frontend {
  [Pages] as pages
  [Components] as components
  [Contexts] as contexts
  [Services] as feServices
  [Hooks] as hooks

  pages --> components
  pages --> contexts
  pages --> hooks
  components --> contexts
  feServices --> contexts
}

package "Backend (Azure Functions)" as backend {
  [Auth Functions] as authFn
  [Trading Functions] as tradingFn
  [Strategy Functions] as strategyFn
  [Stripe Functions] as stripeFn
  [Health Functions] as healthFn

  package "Libraries" {
    [Database Lib] as dbLib
    [Auth Lib] as authLib
    [Response Lib] as respLib
  }

  authFn --> dbLib
  authFn --> authLib
  tradingFn --> dbLib
  tradingFn --> authLib
  strategyFn --> dbLib
  stripeFn --> dbLib
}

package "External Services" as external {
  [Polygon.io API] as polygonApi
  [Stripe API] as stripeApi
  [Broker APIs] as brokerApis
}

database "Azure PostgreSQL" as db

frontend --> backend : REST API
feServices --> polygonApi : Market Data
feServices --> brokerApis : Trading
backend --> db : SQL
stripeFn --> stripeApi : Webhooks

@enduml
```

---

## 3. Deployment Diagram

Shows the physical deployment architecture.

```plantuml
@startuml Deployment Diagram
!theme plain
skinparam backgroundColor #FEFEFE

title Options Academy - Deployment Diagram

node "GitHub" as github {
  artifact "Source Code" as source
  component "GitHub Actions" as actions
}

cloud "Azure Cloud" as azure {
  node "Azure Static Web Apps" as staticWeb {
    artifact "React SPA" as spa
    artifact "dist/" as dist
  }

  node "Azure Functions" as funcApp {
    component "Node.js Runtime" as nodeRuntime
    artifact "Auth Functions" as authFn
    artifact "Trading Functions" as tradeFn
    artifact "Strategy Functions" as stratFn
    artifact "Stripe Webhooks" as stripeFn
  }

  database "Azure PostgreSQL" as postgres {
    collections "users"
    collections "trades"
    collections "strategies"
    collections "subscriptions"
  }

  node "Application Insights" as appInsights

  node "Storage Account" as storage
}

cloud "CDN / Edge" as cdn {
  component "Global Distribution"
}

cloud "External APIs" as external {
  component "Polygon.io" as polygon
  component "Stripe" as stripe
  component "Broker APIs" as brokers
}

github --> azure : Deploy
actions --> staticWeb : Build & Deploy Frontend
actions --> funcApp : Build & Deploy Functions

cdn --> staticWeb : Cache & Serve
staticWeb --> funcApp : API Calls
funcApp --> postgres : Data
funcApp --> appInsights : Telemetry
funcApp --> storage : Files

funcApp --> external : API Calls

actor User as user
user --> cdn : HTTPS

@enduml
```

---

## 4. Class Diagrams

### 4.1 Frontend State Management

```plantuml
@startuml Frontend Contexts
!theme plain
skinparam backgroundColor #FEFEFE

title Frontend State Management - Context Classes

package "React Contexts" {

  class TradingContext {
    - state: TradingState
    - dispatch: Dispatch
    --
    + positions: Position[]
    + orders: Order[]
    + watchlist: WatchlistItem[]
    + balance: number
    + buyingPower: number
    --
    + placeOrder(order: Order): void
    + cancelOrder(orderId: string): void
    + fillOrder(orderId: string): void
    + addToWatchlist(item: WatchlistItem): void
  }

  class OptionsContext {
    - state: OptionsState
    - dispatch: Dispatch
    --
    + positions: OptionsPosition[]
    + orders: OptionsOrder[]
    + contracts: OptionsContract[]
    + multiLegOrders: MultiLegOrder[]
    --
    + placeOptionsOrder(order: OptionsOrder): void
    + placeMultiLegOrder(order: MultiLegOrder): void
    + closePosition(positionId: string): void
  }

  class OptionsDataContext {
    - state: OptionsDataState
    - dispatch: Dispatch
    --
    + chains: Map<string, OptionsChain>
    + lastUpdated: Date
    + schedulerStatus: string
    --
    + fetchOptionsChain(symbol: string): void
    + startScheduler(): void
    + stopScheduler(): void
  }

  class GamificationContext {
    - state: GamificationState
    --
    + xp: number
    + level: number
    + achievements: Achievement[]
    + streak: number
    --
    + addXP(amount: number): void
    + unlockAchievement(id: string): void
  }

  class AccountContext {
    - state: AccountState
    --
    + selectedAccount: Account
    + brokerConnections: BrokerConnection[]
    --
    + switchAccount(accountId: string): void
    + connectBroker(broker: string): void
  }
}

TradingContext ..> OptionsContext : coordinates
OptionsContext ..> OptionsDataContext : uses data
GamificationContext ..> TradingContext : observes trades

@enduml
```

### 4.2 Backend Service Classes

```plantuml
@startuml Backend Services
!theme plain
skinparam backgroundColor #FEFEFE

title Backend - Service Architecture

package "Azure Functions" {

  class AuthService {
    + hashPassword(password: string): string
    + verifyPassword(password: string, hash: string): boolean
    + generateToken(user: User): string
    + verifyToken(token: string): JwtPayload
    + requireAuth(request: HttpRequest): AuthUser
  }

  class DatabaseService {
    - pool: Pool
    --
    + query<T>(sql: string, params: any[]): T[]
    + transaction(callback: Function): void
    + healthCheck(): boolean
  }

  class ResponseService {
    + jsonResponse(data: any, status: number): HttpResponse
    + badRequest(message: string): HttpResponse
    + unauthorized(message: string): HttpResponse
    + serverError(message: string): HttpResponse
    + handleError(error: Error): HttpResponse
  }
}

package "Function Handlers" {

  class LoginFunction {
    + handler(request: HttpRequest): HttpResponse
  }

  class RegisterFunction {
    + handler(request: HttpRequest): HttpResponse
  }

  class TradingFunctions {
    + createTrade(request: HttpRequest): HttpResponse
    + getTradeHistory(request: HttpRequest): HttpResponse
    + closeTrade(request: HttpRequest): HttpResponse
    + getTradingMetrics(request: HttpRequest): HttpResponse
  }

  class StrategyFunctions {
    + saveStrategy(request: HttpRequest): HttpResponse
    + getSavedStrategies(request: HttpRequest): HttpResponse
  }

  class StripeFunctions {
    + handleWebhook(request: HttpRequest): HttpResponse
    + createCheckout(request: HttpRequest): HttpResponse
  }
}

LoginFunction --> AuthService
LoginFunction --> DatabaseService
LoginFunction --> ResponseService

RegisterFunction --> AuthService
RegisterFunction --> DatabaseService

TradingFunctions --> AuthService
TradingFunctions --> DatabaseService

StrategyFunctions --> AuthService
StrategyFunctions --> DatabaseService

StripeFunctions --> DatabaseService

@enduml
```

### 4.3 Domain Models

```plantuml
@startuml Domain Models
!theme plain
skinparam backgroundColor #FEFEFE

title Domain Models

class User {
  + id: UUID
  + email: string
  + passwordHash: string
  + displayName: string
  + emailVerified: boolean
  + createdAt: Date
}

class UserProfile {
  + id: UUID
  + userId: UUID
  + bio: string
  + avatarUrl: string
  + tradingExperience: string
  + riskTolerance: string
}

class Position {
  + id: UUID
  + accountId: UUID
  + symbol: string
  + quantity: number
  + entryPrice: number
  + currentPrice: number
  + positionType: string
}

class OptionsPosition {
  + id: UUID
  + accountId: UUID
  + contractSymbol: string
  + optionType: "call" | "put"
  + strikePrice: number
  + expirationDate: Date
  + quantity: number
  + entryPrice: number
  + greeks: Greeks
}

class Greeks {
  + delta: number
  + gamma: number
  + theta: number
  + vega: number
  + rho: number
}

class Trade {
  + id: UUID
  + userId: UUID
  + symbol: string
  + tradeType: string
  + quantity: number
  + entryPrice: number
  + exitPrice: number
  + pnl: number
  + strategyType: string
}

class Strategy {
  + id: UUID
  + userId: UUID
  + name: string
  + strategyType: string
  + underlyingSymbol: string
  + legs: StrategyLeg[]
  + maxProfit: number
  + maxLoss: number
  + breakEvenPoints: number[]
}

class StrategyLeg {
  + legId: number
  + optionType: "call" | "put"
  + action: "buy" | "sell"
  + strike: number
  + expiration: Date
  + quantity: number
}

class Subscription {
  + id: UUID
  + userId: UUID
  + stripeCustomerId: string
  + planType: string
  + status: string
  + periodStart: Date
  + periodEnd: Date
}

User "1" -- "1" UserProfile
User "1" -- "*" Position
User "1" -- "*" OptionsPosition
User "1" -- "*" Trade
User "1" -- "*" Strategy
User "1" -- "0..1" Subscription
Strategy "1" -- "*" StrategyLeg
OptionsPosition "1" -- "1" Greeks

@enduml
```

---

## 5. Sequence Diagrams

### 5.1 User Authentication Flow

```plantuml
@startuml Authentication Flow
!theme plain
skinparam backgroundColor #FEFEFE

title User Authentication Sequence

actor User as user
participant "React App" as app
participant "Auth Service\n(Frontend)" as authFe
participant "Azure Functions\n/api/users/login" as api
database "PostgreSQL" as db

user -> app : Enter credentials
app -> authFe : login(email, password)
authFe -> api : POST /api/users/login\n{email, password}

api -> db : SELECT * FROM users\nWHERE email = ?
db --> api : User record

alt User found
  api -> api : bcrypt.compare(password, hash)

  alt Password valid
    api -> api : jwt.sign(payload, secret)
    api --> authFe : 200 OK\n{accessToken, refreshToken, user}
    authFe -> authFe : Store tokens in memory
    authFe --> app : Success
    app --> user : Redirect to Dashboard
  else Password invalid
    api --> authFe : 401 Unauthorized\n{error: "Invalid credentials"}
    authFe --> app : Error
    app --> user : Show error message
  end
else User not found
  api --> authFe : 401 Unauthorized\n{error: "Invalid credentials"}
  authFe --> app : Error
  app --> user : Show error message
end

@enduml
```

### 5.2 Options Trading Flow

```plantuml
@startuml Options Trading Flow
!theme plain
skinparam backgroundColor #FEFEFE

title Options Order Execution Sequence

actor Trader as user
participant "Trading UI" as ui
participant "OptionsContext" as ctx
participant "Validation\nService" as validation
participant "Payoff\nService" as payoff
participant "Azure Functions" as api
database "PostgreSQL" as db

user -> ui : Build multi-leg strategy
ui -> validation : validateStrategy(legs)
validation -> validation : Check leg combinations
validation -> validation : Calculate margin requirements
validation --> ui : ValidationResult

alt Valid Strategy
  ui -> payoff : calculatePayoff(strategy)
  payoff -> payoff : Compute P/L at each price
  payoff -> payoff : Find break-even points
  payoff --> ui : PayoffDiagram data

  ui --> user : Show payoff diagram
  user -> ui : Confirm order

  ui -> ctx : placeMultiLegOrder(order)
  ctx -> ctx : Update local state
  ctx -> api : POST /api/trading/trades

  api -> api : requireAuth(request)
  api -> db : INSERT INTO trade_history
  db --> api : Success
  api --> ctx : 201 Created

  ctx --> ui : Order confirmed
  ui --> user : Show confirmation

else Invalid Strategy
  validation --> ui : Validation errors
  ui --> user : Show error messages
end

@enduml
```

### 5.3 Real-time Data Flow

```plantuml
@startuml Real-time Data Flow
!theme plain
skinparam backgroundColor #FEFEFE

title Real-time Options Data Flow

participant "Scheduler" as scheduler
participant "OptionsData\nContext" as ctx
participant "Polygon\nService" as polygon
participant "Polygon.io\nAPI" as api
participant "LocalStorage" as storage
participant "React\nComponents" as components

== Scheduled Update ==

scheduler -> ctx : triggerUpdate()
ctx -> polygon : getOptionsChain(symbol)
polygon -> api : GET /v3/reference/options/contracts
api --> polygon : Options contracts data

alt API Success
  polygon -> polygon : Transform data
  polygon -> polygon : Calculate Greeks
  polygon --> ctx : OptionsChain

  ctx -> ctx : Dispatch UPDATE_CHAIN
  ctx -> storage : Persist data
  ctx -> components : Notify subscribers
  components -> components : Re-render

else API Failure
  polygon -> polygon : Generate mock data
  polygon --> ctx : Mock OptionsChain
  ctx -> components : Notify with mock data
end

== Manual Refresh ==

components -> ctx : refreshChain(symbol)
ctx -> polygon : getOptionsChain(symbol)
note right: Same flow as scheduled update

@enduml
```

### 5.4 Stripe Payment Flow

```plantuml
@startuml Stripe Payment Flow
!theme plain
skinparam backgroundColor #FEFEFE

title Subscription Payment Flow

actor User as user
participant "React App" as app
participant "Stripe.js" as stripejs
participant "Stripe\nCheckout" as checkout
participant "Azure Functions\n/api/stripe/webhook" as webhook
database "PostgreSQL" as db
participant "Stripe API" as stripeApi

user -> app : Click "Subscribe"
app -> stripejs : redirectToCheckout(priceId)
stripejs -> checkout : Open Stripe Checkout

user -> checkout : Enter payment details
checkout -> stripeApi : Process payment

alt Payment Success
  stripeApi -> checkout : Payment confirmed
  checkout -> app : Redirect to /success

  stripeApi -> webhook : POST webhook\ncheckout.session.completed
  webhook -> webhook : Verify signature
  webhook -> db : INSERT INTO subscriptions
  webhook -> db : UPDATE users SET premium = true
  webhook --> stripeApi : 200 OK

  app --> user : Show success page

else Payment Failed
  stripeApi -> checkout : Payment failed
  checkout --> user : Show error
end

== Subscription Renewal ==

stripeApi -> webhook : POST webhook\ninvoice.payment_succeeded
webhook -> db : UPDATE subscriptions\nSET period_end = ?
webhook --> stripeApi : 200 OK

== Subscription Cancelled ==

stripeApi -> webhook : POST webhook\ncustomer.subscription.deleted
webhook -> db : UPDATE subscriptions\nSET status = 'cancelled'
webhook --> stripeApi : 200 OK

@enduml
```

---

## 6. State Diagrams

### 6.1 Order Lifecycle

```plantuml
@startuml Order State Machine
!theme plain
skinparam backgroundColor #FEFEFE

title Order State Machine

[*] --> Pending : Order created

Pending --> Submitted : Submit order
Pending --> Cancelled : User cancels

Submitted --> PartiallyFilled : Partial execution
Submitted --> Filled : Full execution
Submitted --> Rejected : Validation failed
Submitted --> Cancelled : User cancels

PartiallyFilled --> Filled : Remaining filled
PartiallyFilled --> Cancelled : User cancels remaining

Filled --> [*]
Rejected --> [*]
Cancelled --> [*]

note right of Pending
  Order created locally
  Not yet sent to market
end note

note right of Filled
  All shares/contracts
  executed
end note

@enduml
```

### 6.2 User Session State

```plantuml
@startuml Session State Machine
!theme plain
skinparam backgroundColor #FEFEFE

title User Session State Machine

[*] --> Anonymous : App loaded

Anonymous --> Authenticating : Login attempt
Authenticating --> Authenticated : Success
Authenticating --> Anonymous : Failure

Authenticated --> Refreshing : Token expiring
Refreshing --> Authenticated : Refresh success
Refreshing --> Anonymous : Refresh failed

Authenticated --> Anonymous : Logout

state Authenticated {
  [*] --> Active
  Active --> Idle : No activity (5 min)
  Idle --> Active : User action
  Idle --> TimedOut : No activity (30 min)
  TimedOut --> [*]
}

@enduml
```

### 6.3 Options Position Lifecycle

```plantuml
@startuml Position State Machine
!theme plain
skinparam backgroundColor #FEFEFE

title Options Position Lifecycle

[*] --> Open : Position opened

Open --> InTheMoney : Price moves ITM
Open --> OutOfMoney : Price moves OTM
Open --> AtTheMoney : Price at strike

InTheMoney --> Open : Price changes
OutOfMoney --> Open : Price changes
AtTheMoney --> Open : Price changes

Open --> Closed : User closes
Open --> Exercised : Exercise option
Open --> Expired : Expiration date

InTheMoney --> Exercised : Auto-exercise at expiry
OutOfMoney --> Expired : Worthless at expiry

Closed --> [*]
Exercised --> [*]
Expired --> [*]

@enduml
```

---

## 7. Use Case Diagram

```plantuml
@startuml Use Case Diagram
!theme plain
skinparam backgroundColor #FEFEFE

title Options Academy - Use Cases

left to right direction

actor "Trader" as trader
actor "Premium User" as premium
actor "Admin" as admin

rectangle "Options Academy Platform" {

  package "Trading" {
    usecase "View Options Chain" as UC1
    usecase "Build Multi-leg Strategy" as UC2
    usecase "Place Paper Trade" as UC3
    usecase "View Positions" as UC4
    usecase "Close Position" as UC5
    usecase "View Trade History" as UC6
  }

  package "Analysis" {
    usecase "View Payoff Diagram" as UC7
    usecase "Analyze Greeks" as UC8
    usecase "Run Options Screener" as UC9
    usecase "View Sentiment" as UC10
    usecase "Market Regime Analysis" as UC11
  }

  package "Account" {
    usecase "Register" as UC12
    usecase "Login" as UC13
    usecase "Manage Profile" as UC14
    usecase "Connect Broker" as UC15
    usecase "Subscribe" as UC16
  }

  package "Community" {
    usecase "Share Strategy" as UC17
    usecase "View Leaderboard" as UC18
    usecase "Earn Achievements" as UC19
  }

  package "Admin" {
    usecase "Manage Users" as UC20
    usecase "Configure Features" as UC21
    usecase "View Analytics" as UC22
  }
}

trader --> UC1
trader --> UC2
trader --> UC3
trader --> UC4
trader --> UC5
trader --> UC6
trader --> UC7
trader --> UC8
trader --> UC12
trader --> UC13
trader --> UC14

premium --> UC9
premium --> UC10
premium --> UC11
premium --> UC15
premium --> UC16
premium --> UC17
premium --> UC18
premium --> UC19

admin --> UC20
admin --> UC21
admin --> UC22

trader <|-- premium : extends

UC2 ..> UC7 : includes
UC3 ..> UC4 : includes

@enduml
```

---

## 8. Entity Relationship Diagram

```plantuml
@startuml Entity Relationship Diagram
!theme plain
skinparam backgroundColor #FEFEFE

title Database Entity Relationship Diagram

entity "users" as users {
  * id : UUID <<PK>>
  --
  * email : VARCHAR(255) <<unique>>
  * password_hash : VARCHAR(255)
  display_name : VARCHAR(100)
  azure_oid : VARCHAR(255)
  email_verified : BOOLEAN
  created_at : TIMESTAMPTZ
  updated_at : TIMESTAMPTZ
}

entity "user_profiles" as profiles {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  bio : TEXT
  avatar_url : TEXT
  trading_experience : VARCHAR(50)
  risk_tolerance : VARCHAR(50)
  preferred_strategies : TEXT[]
}

entity "paper_trading_accounts" as accounts {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  balance : DECIMAL(15,2)
  buying_power : DECIMAL(15,2)
  created_at : TIMESTAMPTZ
}

entity "paper_trading_positions" as positions {
  * id : UUID <<PK>>
  --
  * account_id : UUID <<FK>>
  * symbol : VARCHAR(20)
  * quantity : INTEGER
  * entry_price : DECIMAL(10,2)
  current_price : DECIMAL(10,2)
  position_type : VARCHAR(10)
  option_type : VARCHAR(4)
  strike_price : DECIMAL(10,2)
  expiration_date : DATE
  opened_at : TIMESTAMPTZ
}

entity "trade_history" as trades {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  * symbol : VARCHAR(20)
  * trade_type : VARCHAR(10)
  * quantity : INTEGER
  * entry_price : DECIMAL(10,2)
  exit_price : DECIMAL(10,2)
  pnl : DECIMAL(15,2)
  strategy_type : VARCHAR(50)
  notes : TEXT
  opened_at : TIMESTAMPTZ
  closed_at : TIMESTAMPTZ
}

entity "saved_strategies" as strategies {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  * name : VARCHAR(100)
  * strategy_type : VARCHAR(50)
  * underlying_symbol : VARCHAR(20)
  * legs : JSONB
  max_profit : DECIMAL(15,2)
  max_loss : DECIMAL(15,2)
  break_even_points : DECIMAL[]
  created_at : TIMESTAMPTZ
}

entity "subscriptions" as subs {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>> <<unique>>
  stripe_customer_id : VARCHAR(255)
  stripe_subscription_id : VARCHAR(255)
  * plan_type : VARCHAR(50)
  * status : VARCHAR(50)
  current_period_start : TIMESTAMPTZ
  current_period_end : TIMESTAMPTZ
  created_at : TIMESTAMPTZ
}

entity "user_gamification_stats" as gamification {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>> <<unique>>
  xp : INTEGER
  level : INTEGER
  achievements : JSONB
  current_streak : INTEGER
  longest_streak : INTEGER
  last_activity_date : DATE
}

entity "broker_credentials" as brokers {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  * broker_type : VARCHAR(50)
  * encrypted_credentials : TEXT
  is_paper : BOOLEAN
  created_at : TIMESTAMPTZ
}

users ||--o| profiles : has
users ||--o{ accounts : owns
users ||--o{ trades : makes
users ||--o{ strategies : creates
users ||--o| subs : subscribes
users ||--o| gamification : has
users ||--o{ brokers : connects

accounts ||--o{ positions : contains

@enduml
```

---

## Rendering the Diagrams

### Option 1: PlantUML Online Server

1. Go to [https://www.plantuml.com/plantuml](https://www.plantuml.com/plantuml)
2. Copy the PlantUML code (between \`\`\`plantuml and \`\`\`)
3. Paste into the editor
4. View/download the rendered diagram

### Option 2: VS Code Extension

1. Install "PlantUML" extension by jebbs
2. Open this file
3. Press `Alt+D` to preview diagrams
4. Export as PNG/SVG

### Option 3: Generate All Diagrams

```bash
# Install PlantUML
npm install -g node-plantuml

# Generate all diagrams
plantuml docs/architecture-uml.md -o docs/diagrams/
```

### Option 4: Mermaid Alternative

For GitHub rendering, convert to Mermaid syntax which renders natively in GitHub markdown.

---

## Diagram Summary

| Diagram | Purpose |
|---------|---------|
| System Context | High-level system boundaries |
| Component | Internal component relationships |
| Deployment | Physical infrastructure |
| Class (Contexts) | Frontend state management |
| Class (Services) | Backend service architecture |
| Class (Domain) | Core business entities |
| Sequence (Auth) | Authentication flow |
| Sequence (Trading) | Order execution flow |
| Sequence (Data) | Real-time data updates |
| Sequence (Payment) | Subscription flow |
| State (Order) | Order lifecycle |
| State (Session) | User session states |
| State (Position) | Options position lifecycle |
| Use Case | System capabilities |
| ERD | Database schema |

---

*Generated: December 2024*
