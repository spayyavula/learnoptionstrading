import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OptionsContract {
  contract_type: string;
  exercise_style: string;
  expiration_date: string;
  shares_per_contract: number;
  strike_price: number;
  ticker: string;
  underlying_ticker: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  intrinsic_value: number;
  time_value: number;
}

const TOP_LIQUID_OPTIONS: OptionsContract[] = [
  {
    contract_type: 'call',
    exercise_style: 'american',
    expiration_date: '2024-03-15',
    shares_per_contract: 100,
    strike_price: 580,
    ticker: 'SPY240315C00580000',
    underlying_ticker: 'SPY',
    bid: 29.05,
    ask: 29.15,
    last: 29.10,
    volume: 15234,
    open_interest: 45678,
    implied_volatility: 0.25,
    delta: 0.65,
    gamma: 0.02,
    theta: -0.15,
    vega: 0.30,
    intrinsic_value: 0,
    time_value: 29.10
  },
  {
    contract_type: 'call',
    exercise_style: 'american',
    expiration_date: '2024-03-15',
    shares_per_contract: 100,
    strike_price: 500,
    ticker: 'QQQ240315C00500000',
    underlying_ticker: 'QQQ',
    bid: 15.20,
    ask: 15.30,
    last: 15.25,
    volume: 12456,
    open_interest: 38901,
    implied_volatility: 0.28,
    delta: 0.58,
    gamma: 0.025,
    theta: -0.12,
    vega: 0.35,
    intrinsic_value: 0,
    time_value: 15.25
  },
  {
    contract_type: 'call',
    exercise_style: 'american',
    expiration_date: '2024-03-15',
    shares_per_contract: 100,
    strike_price: 230,
    ticker: 'AAPL240315C00230000',
    underlying_ticker: 'AAPL',
    bid: 8.45,
    ask: 8.55,
    last: 8.50,
    volume: 9876,
    open_interest: 25432,
    implied_volatility: 0.32,
    delta: 0.42,
    gamma: 0.03,
    theta: -0.08,
    vega: 0.28,
    intrinsic_value: 0,
    time_value: 8.50
  },
  {
    contract_type: 'call',
    exercise_style: 'american',
    expiration_date: '2024-03-15',
    shares_per_contract: 100,
    strike_price: 1000,
    ticker: 'TSLA240315C01000000',
    underlying_ticker: 'TSLA',
    bid: 45.80,
    ask: 46.20,
    last: 46.00,
    volume: 7654,
    open_interest: 18765,
    implied_volatility: 0.55,
    delta: 0.35,
    gamma: 0.015,
    theta: -0.25,
    vega: 0.45,
    intrinsic_value: 0,
    time_value: 46.00
  },
  {
    contract_type: 'call',
    exercise_style: 'american',
    expiration_date: '2024-03-15',
    shares_per_contract: 100,
    strike_price: 1400,
    ticker: 'NVDA240315C01400000',
    underlying_ticker: 'NVDA',
    bid: 125.50,
    ask: 126.50,
    last: 126.00,
    volume: 5432,
    open_interest: 12345,
    implied_volatility: 0.48,
    delta: 0.68,
    gamma: 0.008,
    theta: -0.35,
    vega: 0.52,
    intrinsic_value: 0,
    time_value: 126.00
  }
];

function getBasePriceForTicker(ticker: string): number {
  const basePrices: { [key: string]: number } = {
    'SPY': 580,
    'QQQ': 500,
    'AAPL': 185,
    'MSFT': 420,
    'GOOGL': 150,
    'AMZN': 175,
    'TSLA': 190,
    'NVDA': 1400
  };
  return basePrices[ticker] || 100;
}

function generateSimulatedHistoricalData(ticker: string, days: number) {
  const data = [];
  const basePrice = getBasePriceForTicker(ticker);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyChange = (Math.random() - 0.5) * 2;
    const open = basePrice * (1 + dailyChange * 0.01);
    const close = open * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    data.push({
      ticker,
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000)
    });
  }
  
  return data;
}

function generateSimulatedOptionsHistoricalData(option: OptionsContract, days: number) {
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyChange = (Math.random() - 0.5) * 0.1;
    const bid = option.bid * (1 + dailyChange);
    const ask = option.ask * (1 + dailyChange);
    const last = option.last * (1 + dailyChange);
    
    data.push({
      contract_ticker: option.ticker,
      underlying_ticker: option.underlying_ticker,
      date: date.toISOString().split('T')[0],
      bid,
      ask,
      last,
      volume: Math.floor(Math.random() * option.volume),
      open_interest: option.open_interest + Math.floor((Math.random() - 0.5) * 1000),
      implied_volatility: option.implied_volatility * (1 + (Math.random() - 0.5) * 0.1),
      delta: option.delta * (1 + (Math.random() - 0.5) * 0.05),
      gamma: option.gamma * (1 + (Math.random() - 0.5) * 0.1),
      theta: option.theta * (1 + (Math.random() - 0.5) * 0.1),
      vega: option.vega * (1 + (Math.random() - 0.5) * 0.1)
    });
  }
  
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting historical data load job...');
    
    const results = {
      stockDataLoaded: 0,
      optionsDataLoaded: 0,
      errors: [] as string[],
      tickers: [] as string[],
      optionContracts: [] as string[]
    };

    const tickers = [...new Set(TOP_LIQUID_OPTIONS.map(option => option.underlying_ticker))];
    
    for (const ticker of tickers) {
      try {
        const historicalData = generateSimulatedHistoricalData(ticker, 14);
        
        const { error: stockError } = await supabase
          .from('historical_data')
          .upsert(historicalData, { 
            onConflict: 'ticker,date',
            ignoreDuplicates: false 
          });

        if (stockError) {
          console.error(`Error storing data for ${ticker}:`, stockError);
          results.errors.push(`${ticker}: ${stockError.message}`);
        } else {
          results.stockDataLoaded += historicalData.length;
          results.tickers.push(ticker);
          console.log(`Loaded ${historicalData.length} data points for ${ticker}`);
        }
      } catch (error) {
        console.error(`Failed to process ${ticker}:`, error);
        results.errors.push(`${ticker}: ${error.message}`);
      }
    }

    for (const option of TOP_LIQUID_OPTIONS) {
      try {
        const optionsData = generateSimulatedOptionsHistoricalData(option, 14);
        
        const { error: optionsError } = await supabase
          .from('options_historical_data')
          .upsert(optionsData, { 
            onConflict: 'contract_ticker,date',
            ignoreDuplicates: false 
          });

        if (optionsError) {
          console.error(`Error storing options data for ${option.ticker}:`, optionsError);
          results.errors.push(`${option.ticker}: ${optionsError.message}`);
        } else {
          results.optionsDataLoaded += optionsData.length;
          results.optionContracts.push(option.ticker);
          console.log(`Loaded ${optionsData.length} options data points for ${option.ticker}`);
        }
      } catch (error) {
        console.error(`Failed to process options for ${option.ticker}:`, error);
        results.errors.push(`${option.ticker}: ${error.message}`);
      }
    }

    console.log('Historical data load job completed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Historical data load completed',
        timestamp: new Date().toISOString(),
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in load-historical-data function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});