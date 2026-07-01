import { getStockQuote, getMultipleStocks, getStockSymbols } from '../services/stockService.js';

// Popular stocks across different sectors (72 stocks total)
const POPULAR_STOCKS = [
  // Technology
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'CSCO', 'AVGO', 'IBM',
  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V', 'MA', 'PYPL',
  // Healthcare
  'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'LLY', 'BMY',
  // Consumer
  'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'DIS', 'COST', 'PEP', 'KO',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG',
  // Industrial
  'BA', 'CAT', 'HON', 'UNP', 'UPS', 'RTX', 'LMT', 'DE', 'GE', 'MMM'
];

// Get single stock quote
export const getStockData = async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required.' });
    }

    const data = await getStockQuote(symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get multiple stocks list
export const getStocksList = async (req, res) => {
  try {
    let symbols = POPULAR_STOCKS.slice(0, 20); // Default to first 20 stocks
    
    if (req.query.symbols) {
      symbols = req.query.symbols.split(',').map(s => s.trim().toUpperCase());
    } else if (req.query.limit) {
      const limit = Math.min(parseInt(req.query.limit), 50); // Max 50 to avoid rate limits
      symbols = POPULAR_STOCKS.slice(0, limit);
    }

    const data = await getMultipleStocks(symbols);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of popular stock symbols (no API call needed)
export const getPopularSymbols = async (req, res) => {
  try {
    const symbolsData = POPULAR_STOCKS.map(symbol => ({ 
      symbol,
      displaySymbol: symbol 
    }));
    res.json({ success: true, data: symbolsData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search stocks from Finnhub API
export const searchStocks = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    // For now, filter from popular stocks
    const results = POPULAR_STOCKS.filter(symbol => 
      symbol.toLowerCase().includes(query.toLowerCase())
    ).map(symbol => ({ symbol, displaySymbol: symbol }));

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
