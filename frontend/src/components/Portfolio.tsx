import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioHolding {
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  total_value: number;
}

const Portfolio: React.FC = () => {
  const [sortBy, setSortBy] = useState<'value' | 'gainLoss' | 'symbol'>('value');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view portfolio');
          setLoading(false);
          return;
        }

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        // Fetch portfolio holdings
        const portfolioResponse = await axios.get(`${API_URL}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch balance
        const balanceResponse = await axios.get(`${API_URL}/api/portfolio/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Portfolio API response:', portfolioResponse.data);
        console.log('Balance API response:', balanceResponse.data);

        if (portfolioResponse.data.success && balanceResponse.data.success) {
          const portfolioData: PortfolioHolding[] = portfolioResponse.data.data || [];
          const userBalance = Number(balanceResponse.data.balance) || 0;
          
          setBalance(userBalance);

          // Fetch current prices for all holdings to calculate gains/losses
          if (portfolioData.length > 0) {
            const symbols = portfolioData.map(h => h.stock_symbol);
            const stocksResponse = await axios.get(`${API_URL}/api/stocks/multiple?symbols=${symbols.join(',')}`);
            
            if (stocksResponse.data.success) {
              const currentPrices = stocksResponse.data.data;
              
              const transformedHoldings: Holding[] = portfolioData.map((holding, index) => {
                // Convert all values to numbers to ensure they're not strings
                const quantity = Number(holding.quantity) || 0;
                const avgPrice = Number(holding.avg_price) || 0;
                const currentPrice = Number(currentPrices[index]?.c) || avgPrice;
                const totalValue = quantity * currentPrice;
                const originalValue = quantity * avgPrice;
                const gainLoss = totalValue - originalValue;
                const gainLossPercent = originalValue > 0 ? (gainLoss / originalValue) * 100 : 0;

                return {
                  symbol: holding.stock_symbol,
                  quantity: quantity,
                  averagePrice: avgPrice,
                  currentPrice: currentPrice,
                  totalValue: totalValue,
                  gainLoss: gainLoss,
                  gainLossPercent: gainLossPercent
                };
              });

              setHoldings(transformedHoldings);
            } else {
              // If stock prices fail, use average price as current price
              const transformedHoldings: Holding[] = portfolioData.map((holding) => {
                const quantity = Number(holding.quantity) || 0;
                const avgPrice = Number(holding.avg_price) || 0;
                const totalValue = quantity * avgPrice;

                return {
                  symbol: holding.stock_symbol,
                  quantity: quantity,
                  averagePrice: avgPrice,
                  currentPrice: avgPrice,
                  totalValue: totalValue,
                  gainLoss: 0,
                  gainLossPercent: 0
                };
              });
              setHoldings(transformedHoldings);
            }
          } else {
            setHoldings([]);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch portfolio:', err);
        setError(err.response?.data?.message || 'Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0) + balance;
  const totalGainLoss = holdings.reduce((sum, holding) => sum + holding.gainLoss, 0);

  const sortedHoldings = [...holdings].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.totalValue - a.totalValue;
      case 'gainLoss':
        return b.gainLoss - a.gainLoss;
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
          <span className="text-white ml-2">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your investments and performance</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'value' | 'gainLoss' | 'symbol')}
          className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white"
        >
          <option value="value" className="bg-gray-800">Sort by Value</option>
          <option value="gainLoss" className="bg-gray-800">Sort by Gain/Loss</option>
          <option value="symbol" className="bg-gray-800">Sort by Symbol</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-400 text-sm font-medium mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-400 mt-1">Cash: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-400 text-sm font-medium mb-1">Total Gain/Loss</p>
              <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-6">Holdings</h3>
        {holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white border-opacity-10">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Stock</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Shares</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Avg Price</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Current Price</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Total Value</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => (
                  <tr key={holding.symbol} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{holding.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{holding.symbol}</h4>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-left text-white font-medium">
                      {holding.quantity}
                    </td>
                    <td className="py-4 px-6 text-left text-white font-medium">
                      ${Number(holding.averagePrice).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-left text-white font-medium">
                      ${Number(holding.currentPrice).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-left text-white font-medium">
                      ${Number(holding.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-left">
                      <div className={`font-medium ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {holding.gainLoss >= 0 ? '+' : ''}${Number(holding.gainLoss).toFixed(2)}
                      </div>
                      <div className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ({holding.gainLossPercent >= 0 ? '+' : ''}{Number(holding.gainLossPercent).toFixed(2)}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No holdings yet</p>
            <p className="text-gray-500 text-sm mt-2">Start trading to build your portfolio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;