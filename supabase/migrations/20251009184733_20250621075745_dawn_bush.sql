/*
  # Add Subscriptions Table

  1. New Tables
    - `subscriptions`
      - `id` (text, primary key, Stripe subscription ID)
      - `customer_id` (text, Stripe customer ID)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text, subscription status)
      - `price_id` (text, Stripe price ID)
      - `quantity` (integer, number of subscriptions)
      - `cancel_at_period_end` (boolean)
      - `cancel_at` (timestamptz, when subscription will be canceled)
      - `canceled_at` (timestamptz, when subscription was canceled)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `created` (timestamptz, when subscription was created)
      - `ended_at` (timestamptz, when subscription ended)
      - `trial_start` (timestamptz, when trial started)
      - `trial_end` (timestamptz, when trial ends)
      - `metadata` (jsonb, additional metadata)

  2. Security
    - Enable RLS on subscriptions table
    - Add policies for authenticated users to read their own subscriptions
    - Add policies for service role to manage all subscriptions

  3. Indexes
    - Add indexes for efficient querying by user_id and customer_id
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  customer_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL,
  price_id text,
  quantity integer NOT NULL DEFAULT 1,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz,
  created timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for service role
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  USING (true)
  WITH CHECK (true);

-- Add terms acceptance tracking to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;