import React, { useState, useEffect } from 'react';
import { useRealTimeStocks } from '../hooks/useRealTimeStocks';
import axios from 'axios';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  volume?: number;
}

interface Trade {
  stock_symbol: string;
  transaction_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  created_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TradingInterface: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(0);

  const symbols = stocks.map(s => s.symbol);
  const { getPrice } = useRealTimeStocks(symbols);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to access trading');
        return;
      }

      // Fetch stocks - get first 20 popular stocks
      const stocksResponse = await axios.get(
        `${API_BASE_URL}/api/stocks/multiple?limit=20`
      );
      
      if (stocksResponse.data.success) {
        const transformed = stocksResponse.data.data.map((stock: any) => ({
          symbol: stock.symbol,
          price: stock.c || 0,
          change: stock.d || 0,
          volume: Math.floor(Math.random() * 50000000),
        }));
        setStocks(transformed);
      }

      // Fetch user balance - FIXED: Using correct endpoint
      const balanceResponse = await axios.get(`${API_BASE_URL}/api/portfolio/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (balanceResponse.data.success) {
        setBalance(balanceResponse.data.balance || 0);
      }

      // Fetch trade history
      const tradesResponse = await axios.get(`${API_BASE_URL}/api/trade/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (tradesResponse.data.success) {
        setRecentTrades(tradesResponse.data.data.slice(0, 5));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load data');
      }
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const selectedStockData = stocks.find(s => s.symbol === selectedStock);
    if (!selectedStockData) {
      setError('Please select a valid stock');
      setLoading(false);
      return;
    }

    const tradePrice = selectedStockData.price;
    const totalCost = tradePrice * quantity;

    // Validate sufficient balance for buy
    if (action === 'buy' && totalCost > balance) {
      setError(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${balance.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to trade');
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/trade/${action}`,
        { symbol: selectedStock, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(
        `Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock} for $${totalCost.toFixed(2)}`
      );

      // Refresh data
      await fetchData();
      
      // Reset form
      setQuantity(1);
      setSelectedStock('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedStockData = stocks.find(s => s.symbol === selectedStock);
  const realTimeData = getPrice(selectedStock);
  const currentPrice = selectedStockData
    ? realTimeData?.price || selectedStockData.price
    : 0;
  const totalCost = currentPrice * quantity;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trading Interface</h1>
          <p className="text-gray-400">Execute trades and manage your positions</p>
        </div>

        {/* Balance Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm mb-1">Available Balance</p>
              <h2 className="text-3xl font-bold text-white">
                ${typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
              </h2>
            </div>
            <button 
              onClick={fetchData}
              className="btn-secondary px-4 py-2 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        {/* Trading Form */}
        <div className="card mb-6">
          <form onSubmit={handleTrade} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Stock Symbol</label>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a Stock</option>
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} - ${(getPrice(s.symbol)?.price || s.price).toFixed(2)}
                    {s.change !== 0 && ` (${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAction('buy')}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                  action === 'buy' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setAction('sell')}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                  action === 'sell' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sell
              </button>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {selectedStock && (
              <div className="bg-gray-800/50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white font-medium">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white font-medium">{quantity}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-300">Total Cost:</span>
                  <span className="text-white">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedStock}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                action === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${quantity} Share${quantity > 1 ? 's' : ''}`}
            </button>
          </form>
        </div>

        {/* Recent Trades */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Recent Trades</h3>
          <div className="space-y-3">
            {recentTrades.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No trades yet</p>
            ) : (
              recentTrades.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{t.stock_symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      t.transaction_type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t.transaction_type.toUpperCase()}
                    </span>
                    <span className="text-gray-400">{t.quantity} shares</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${t.total_amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
