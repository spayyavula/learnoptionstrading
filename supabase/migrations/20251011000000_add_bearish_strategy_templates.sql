/*
  # Add Comprehensive Bearish Strategy Templates

  1. Description
    - Adds 10 bearish options strategy templates to the saved_strategy_templates table
    - Includes Buy Put, Sell Call, Bear Call Spread, Bear Put Spread, Put Ratio Back Spread
    - Includes Long Calendar with Puts, Bear Condor, Bear Butterfly, Risk Reversal, Short Synthetic Future
    - Each template includes proper leg configuration and strike offsets

  2. Templates Added
    - Buy Put: Basic bearish strategy with limited risk
    - Sell Call: Premium collection with unlimited risk (advanced)
    - Bear Call Spread: Credit spread for bearish outlook
    - Bear Put Spread: Debit spread for defined risk bearish play
    - Put Ratio Back Spread: Ratio spread for strong bearish moves
    - Long Calendar with Puts: Time decay strategy with bearish bias
    - Bear Condor: Four-leg range strategy for moderate bearish moves
    - Bear Butterfly: Precision strategy for specific downside target
    - Risk Reversal: Zero-cost bearish position
    - Short Synthetic Future: Options-based short stock replication

  3. Security
    - All templates are marked as public for authenticated user access
    - Follows existing RLS policies on saved_strategy_templates table
*/

-- Insert bearish strategy templates
INSERT INTO saved_strategy_templates (name, description, strategy_type, is_public, legs_config)
VALUES
  (
    'Buy Put (Long Put)',
    'Buy a put option to profit from downward price movement with limited risk',
    'bearish',
    true,
    '{"legs": [{"action": "buy", "type": "put", "strike_offset": 0}]}'::jsonb
  ),
  (
    'Sell Call (Naked Call)',
    'Sell a call option to collect premium - WARNING: Unlimited risk if stock rises',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "call", "strike_offset": 5}]}'::jsonb
  ),
  (
    'Bear Call Spread',
    'Sell a lower strike call and buy a higher strike call to profit from bearish moves with defined risk',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "call", "strike_offset": 5}, {"action": "buy", "type": "call", "strike_offset": 10}]}'::jsonb
  ),
  (
    'Bear Put Spread',
    'Buy a higher strike put and sell a lower strike put to reduce cost while maintaining defined risk',
    'bearish',
    true,
    '{"legs": [{"action": "buy", "type": "put", "strike_offset": 0}, {"action": "sell", "type": "put", "strike_offset": -5}]}'::jsonb
  ),
  (
    'Put Ratio Back Spread',
    'Sell higher strike puts and buy more lower strike puts for limited risk with substantial profit potential',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "put", "strike_offset": 0}, {"action": "buy", "type": "put", "strike_offset": -10, "quantity": 2}]}'::jsonb
  ),
  (
    'Long Calendar with Puts',
    'Sell near-term put and buy longer-term put at same strike to profit from time decay differential',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "put", "strike_offset": -5, "expiration": "30d"}, {"action": "buy", "type": "put", "strike_offset": -5, "expiration": "60d"}]}'::jsonb
  ),
  (
    'Bear Condor',
    'Four-leg spread expecting moderate bearish move with defined risk and reward',
    'bearish',
    true,
    '{"legs": [{"action": "buy", "type": "put", "strike_offset": 15}, {"action": "sell", "type": "put", "strike_offset": 10}, {"action": "sell", "type": "put", "strike_offset": -5}, {"action": "buy", "type": "put", "strike_offset": -15}]}'::jsonb
  ),
  (
    'Bear Butterfly',
    'Three-strike strategy with weighted middle leg expecting limited downside move',
    'bearish',
    true,
    '{"legs": [{"action": "buy", "type": "put", "strike_offset": 10}, {"action": "sell", "type": "put", "strike_offset": 0, "quantity": 2}, {"action": "buy", "type": "put", "strike_offset": -10}]}'::jsonb
  ),
  (
    'Risk Reversal (Bearish)',
    'Sell call and buy put to profit from bearish moves while collecting premium',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "call", "strike_offset": 10}, {"action": "buy", "type": "put", "strike_offset": -10}]}'::jsonb
  ),
  (
    'Short Synthetic Future',
    'Sell call and buy put at same strike to replicate short stock position using options',
    'bearish',
    true,
    '{"legs": [{"action": "sell", "type": "call", "strike_offset": 0}, {"action": "buy", "type": "put", "strike_offset": 0}]}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Create index for strategy_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_saved_strategy_templates_type ON saved_strategy_templates(strategy_type);

-- Add comment to table for documentation
COMMENT ON TABLE saved_strategy_templates IS 'Strategy templates for multi-leg options strategies including bullish, bearish, neutral, and volatility strategies';
