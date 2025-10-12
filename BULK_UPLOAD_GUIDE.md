# Bulk Data Upload Tool - User Guide

## Overview

The Bulk Data Upload tool provides a powerful and user-friendly way to populate your historical market data tables. It supports 7 different table types with comprehensive validation, batch processing, and beautiful UX.

## Accessing the Tool

Navigate to: **System → Bulk Data Upload** in the sidebar menu, or visit `/app/bulk-upload`

## Supported Tables

### 1. **Historical Stock Data (OHLCV)**
- Daily stock price data
- Required: ticker, date, open, high, low, close, volume
- Perfect for: Backtesting stock strategies

### 2. **Historical Options Data**
- Daily options contract data with pricing and Greeks
- Required: contract_ticker, underlying_ticker, date, bid, ask, last
- Optional: Greeks (delta, gamma, theta, vega), volume, OI, IV
- Perfect for: Options strategy backtesting

### 3. **Greeks Snapshots**
- High-frequency Greeks tracking (intraday snapshots)
- Supports: Hourly or sub-hourly Greeks evolution
- Perfect for: Detailed Greeks analysis and gamma scalping studies

### 4. **Volatility Surface Data**
- IV surface across strikes and expirations
- Tracks: IV skew, term structure, moneyness
- Perfect for: Volatility trading strategies and surface analysis

### 5. **Corporate Actions**
- Dividends, stock splits, earnings, mergers
- Tracks: Ex-dates, payment dates, amounts
- Perfect for: Adjusting options pricing and event-driven strategies

### 6. **Market Indicators**
- VIX, market breadth, put/call ratio, fear & greed index
- Supports: Sector rotation, advance/decline data
- Perfect for: Market regime analysis and sentiment studies

### 7. **Intraday Price Data**
- High-resolution bars: 1min, 5min, 15min, 30min, 1hour
- Includes: OHLCV, VWAP, trade count
- Perfect for: Intraday strategy backtesting

## How to Use

### Step 1: Select Table Type
- Choose from categorized cards
- View field count and description
- Tables organized by: Stock & Options, Greeks & Volatility, Market Events

### Step 2: Download Template (Optional but Recommended)
- Click "Download CSV" or "Download JSON"
- Templates include:
  - All required and optional fields
  - Sample data showing correct format
  - Field descriptions and examples

### Step 3: Upload Your File
- **Drag & drop** your CSV or JSON file into the upload zone
- OR click to browse and select file
- Supported formats: `.csv`, `.json`

### Step 4: Preview & Validate
- View first 10 rows of your data
- See validation results:
  - ✅ Green: All data valid
  - ❌ Red: Errors found (with row-level details)
- Review statistics:
  - Total records
  - File name
  - Table destination

### Step 5: Upload
- Click "Start Upload" if validation passes
- Watch real-time progress:
  - Progress bar (% complete)
  - Successful uploads
  - Failed uploads
  - Remaining records
- Batch processing: 100 records per batch

### Step 6: Review Results
- View completion summary:
  - Total records processed
  - Successful inserts
  - Failed records
  - Upload duration
  - Success rate percentage
- View detailed error log (if any failures)
- Options:
  - **Upload More Data**: Start new upload
  - **Done**: Return to app

## Data Format Examples

### CSV Format (historical_data)
```csv
ticker,date,open,high,low,close,volume
AAPL,2024-01-01,150.25,152.30,149.80,151.75,50000000
AAPL,2024-01-02,151.75,153.50,151.00,152.80,45000000
```

### JSON Format (historical_data)
```json
[
  {
    "ticker": "AAPL",
    "date": "2024-01-01",
    "open": 150.25,
    "high": 152.30,
    "low": 149.80,
    "close": 151.75,
    "volume": 50000000
  },
  {
    "ticker": "AAPL",
    "date": "2024-01-02",
    "open": 151.75,
    "high": 153.50,
    "low": 151.00,
    "close": 152.80,
    "volume": 45000000
  }
]
```

### Options Data Example
```csv
contract_ticker,underlying_ticker,date,bid,ask,last,volume,open_interest,implied_volatility,delta,gamma,theta,vega
O:AAPL250117C00150000,AAPL,2024-01-01,5.20,5.30,5.25,1000,5000,0.25,0.65,0.05,-0.03,0.15
```

## Validation Rules

### Required Field Validation
- All fields marked as "required" must have values
- Empty or null values in required fields will cause validation errors

### Type Validation
- **text**: Must be string
- **number**: Must be numeric (no text)
- **date**: Must be valid date (YYYY-MM-DD)
- **datetime**: Must be valid ISO 8601 timestamp
- **boolean**: Must be true/false
- **json**: Must be valid JSON object

### Data Quality Checks
- Automatic duplicate detection via unique constraints
- Upsert operation: Updates existing records, inserts new ones
- Conflict resolution on unique column combinations

## Duplicate Handling

The tool uses intelligent upsert (insert or update) with these unique keys:

- **historical_data**: ticker + date
- **options_historical_data**: contract_ticker + date
- **historical_greeks_snapshots**: contract_ticker + snapshot_time
- **historical_volatility_surface**: ticker + date + strike + expiration + type
- **corporate_actions**: ticker + action_type + ex_date
- **historical_market_indicators**: indicator_date
- **intraday_price_data**: ticker + timestamp + interval

**Result**: Uploading duplicate keys will UPDATE the existing record instead of failing.

## Performance Tips

### For Large Datasets
1. **Split into smaller files** (10,000-50,000 rows recommended)
2. **Use CSV format** (faster parsing than JSON)
3. **Upload during off-peak hours** (less database contention)
4. **Monitor progress** (don't close browser during upload)

### Batch Processing
- Automatic batching: 100 records per batch
- Small delay between batches (prevents rate limiting)
- Progress updates after each batch

## Error Handling

### Common Errors

**"Missing required field"**
- Solution: Ensure all required fields have values
- Check template for required field list (marked with red dot)

**"Invalid type for [field]"**
- Solution: Verify data types match schema
- Example: Numbers should not have commas or currency symbols

**"Batch upload failed"**
- Solution: Check individual row errors in error log
- May indicate database connectivity issues

### Troubleshooting

1. **Download template first** - See exact format required
2. **Test with small sample** - Upload 10-20 rows first
3. **Check validation errors** - Review row-by-row error details
4. **Verify date formats** - Use YYYY-MM-DD for dates
5. **Remove special characters** - Avoid commas in text fields (CSV)

## Best Practices

### Data Preparation
- ✅ Download and use provided templates
- ✅ Validate data in spreadsheet before upload
- ✅ Use consistent date formats
- ✅ Remove header rows (CSV headers are auto-detected)
- ✅ Test with small sample first

### Data Quality
- ✅ Verify ticker symbols are correct
- ✅ Ensure dates are within reasonable range
- ✅ Check that Greeks sum correctly (delta ~0.5 for ATM)
- ✅ Validate volume and OI are non-negative
- ✅ Confirm IV values are between 0 and 5 (0-500%)

### Upload Strategy
- ✅ Upload oldest data first (chronological order)
- ✅ Start with stock data before options data
- ✅ Upload market indicators separately
- ✅ Keep upload files under 50MB
- ✅ Monitor first batch for errors

## Technical Details

### Supported File Sizes
- **Recommended**: Up to 10,000 rows per file
- **Maximum**: Limited by browser memory (~100MB files)
- **Batching**: Automatic 100-record batches

### Processing Speed
- **Small files** (< 1,000 rows): < 10 seconds
- **Medium files** (1,000-10,000 rows): 30-60 seconds
- **Large files** (10,000+ rows): 1-5 minutes

### Database Operations
- **Operation**: UPSERT (INSERT or UPDATE)
- **Transaction**: Per batch (100 records)
- **Rollback**: Automatic on batch failure
- **RLS**: Respects Row Level Security policies

## Use Cases

### Backtesting Setup
1. Upload historical stock data (OHLCV)
2. Upload options historical data for target date range
3. Upload market indicators for same period
4. Upload corporate actions for adjustment data
5. Run backtest with complete historical dataset

### Volatility Analysis
1. Upload volatility surface snapshots
2. Upload market indicators (VIX data)
3. Analyze IV skew evolution
4. Study term structure changes

### Event Studies
1. Upload corporate actions (earnings, dividends)
2. Upload options data around event dates
3. Upload market indicators for context
4. Analyze options behavior around events

## Data Sources

### Where to Get Data

**Stock Data (OHLCV)**
- Yahoo Finance (free API)
- Alpha Vantage (free tier)
- Polygon.io (subscription)
- IEX Cloud (free tier available)

**Options Data**
- Polygon.io Options (subscription)
- CBOE Data Shop (subscription)
- Interactive Brokers TWS (for clients)
- TDAmeritrade API (for clients)

**Market Indicators**
- CBOE (VIX data - free)
- NYSE (breadth data - free)
- Fear & Greed Index (CNN Business - free)

**Corporate Actions**
- SEC Edgar (official filings - free)
- Dividend.com (free data)
- Seeking Alpha (free data)

## Keyboard Shortcuts

- **Esc**: Close modal/go back
- **Enter**: Proceed to next step (when available)
- **Ctrl/Cmd + V**: Paste data (if supported)

## Limitations

- No Excel (.xlsx) support yet - use CSV export from Excel
- Maximum file size limited by browser memory
- No streaming upload (entire file parsed first)
- Cannot pause/resume uploads
- No scheduled/automated uploads

## Future Enhancements (Planned)

- [ ] Excel (.xlsx) file support
- [ ] Streaming upload for huge files
- [ ] Pause/resume capability
- [ ] Scheduled uploads
- [ ] API endpoint for automated uploads
- [ ] Data transformation rules
- [ ] Column mapping wizard
- [ ] Multi-file upload
- [ ] Upload history tracking
- [ ] Data quality scoring

## Support

For issues or questions:
- Check the validation error messages (very detailed)
- Review this guide's troubleshooting section
- Check the table schema in the preview screen
- Download templates to see required format

## License

Part of the Options Trading Platform
© 2024 - Educational purposes only

---

**Pro Tip**: Always download the template first! It shows the exact format and includes sample data. This saves time and prevents validation errors. 🚀
