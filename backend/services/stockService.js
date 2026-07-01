import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.STOCK_API_URL || 'https://api.finnhub.io/api/v1';
const apiKey = process.env.STOCK_API_KEY;

// Validate API key on startup
if (!apiKey || apiKey === 'your_stock_api_key_here') {
  console.warn('⚠️  WARNING: Finnhub API key not configured. Get your free key at https://finnhub.io/register');
}

// Get live quote for a single symbol
export async function getStockQuote(symbol) {
  try {
    if (!apiKey || apiKey === 'your_stock_api_key_here') {
      throw new Error('Finnhub API key not configured');
    }

    const response = await axios.get(`${baseURL}/quote`, {
      params: { symbol, token: apiKey },
      timeout: 5000 // 5 second timeout
    });

    // Finnhub returns object with 'c' (current price), 'h' (high), 'l' (low), etc.
    if (response.data.c === 0 && response.data.d === 0) {
      throw new Error(`Invalid symbol or no data: ${symbol}`);
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Finnhub API rate limit exceeded. Free tier: 60 calls/min');
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    console.error(`Error fetching Finnhub quote for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch live stock data for ${symbol}`);
  }
}

// Fetch multiple stocks by calling getStockQuote with delay to avoid rate limits
export async function getMultipleStocks(symbols = ['AAPL', 'GOOGL', 'TSLA']) {
  try {
    const results = [];
    
    // Add small delay between requests to avoid rate limiting
    for (const symbol of symbols) {
      try {
        const data = await getStockQuote(symbol);
        results.push({ symbol, ...data });
        // Small delay to stay within rate limits (60/min = 1 per second)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error.message);
        // Push null data for failed symbol
        results.push({ symbol, c: 0, d: 0, dp: 0, error: true });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching multiple quotes:', error.message);
    throw new Error('Failed to fetch multiple stock prices');
  }
}

// Get list of available stock symbols from Finnhub
export async function getStockSymbols(exchange = 'US') {
  try {
    if (!apiKey || apiKey === 'your_stock_api_key_here') {
      throw new Error('Finnhub API key not configured');
    }

    const response = await axios.get(`${baseURL}/stock/symbol`, {
      params: { exchange, token: apiKey },
      timeout: 10000
    });

    return response.data; // Returns array of {symbol, description, displaySymbol, type}
  } catch (error) {
    console.error('Error fetching stock symbols:', error.message);
    throw new Error('Failed to fetch stock symbols');
  }
}
