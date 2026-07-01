import React, { useState, useEffect } from 'react';
import { useRealTimeStocks } from '../hooks/useRealTimeStocks';
import axios from 'axios';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  volume?: number;
  marketCap?: string;
}

interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
}

const Dashboard: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');



  // Mock data fallback
  const mockStocks: Stock[] = [
    { symbol: 'AAPL', price: 175.43, change: 2.15, volume: 45234567, marketCap: '2.8T' },
    { symbol: 'GOOGL', price: 147.52, change: -1.23, volume: 1234567, marketCap: '1.9T' },
    { symbol: 'MSFT', price: 378.85, change: 5.67, volume: 23456789, marketCap: '2.8T' },
    { symbol: 'TSLA', price: 248.50, change: -8.32, volume: 34567890, marketCap: '789B' },
    { symbol: 'AMZN', price: 145.67, change: 3.21, volume: 12345678, marketCap: '1.5T' },
    { symbol: 'NVDA', price: 456.78, change: 12.45, volume: 56789012, marketCap: '1.1T' }
  ];

  const mockPortfolio: PortfolioSummary = {
    totalValue: 85421.50,
    dayChange: 1847.32,
    dayChangePercent: 2.21
  };

  const symbols = stocks.map(s => s.symbol);
  const { isConnected, getPrice } = useRealTimeStocks(symbols);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (isMounted) {
          try {
            // Try to fetch from backend first
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const stocksResponse = await axios.get(`${API_BASE_URL}/api/stocks/multiple?symbols=AAPL,GOOGL,MSFT,TSLA,AMZN,NVDA`);
            
            // Transform Finnhub data to expected format
            const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];
            const transformedStocks = stocksResponse.data.data.map((stock: any, index: number) => ({
              symbol: symbols[index],
              price: stock.c, // current price
              change: stock.d, // change
              volume: Math.floor(Math.random() * 50000000), // mock volume since not in response
              marketCap: ['2.8T', '1.9T', '2.8T', '789B', '1.5T', '1.1T'][index]
            }));
            
            setStocks(transformedStocks);

            // Fetch portfolio summary if user is logged in
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const portfolioResponse = await axios.get(`${API_BASE_URL}/api/portfolio`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                // Transform portfolio data to summary format
                const portfolio = portfolioResponse.data;
                const totalHoldingsValue = portfolio.holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.averagePrice), 0);
                const totalValue = totalHoldingsValue + portfolio.balance;
                
                setPortfolio({
                  totalValue,
                  dayChange: totalValue * 0.02, // mock 2% change
                  dayChangePercent: 2.0
                });
              } catch (portfolioErr) {
                // Portfolio fetch failed,use mock data
                setPortfolio(mockPortfolio);
              }
            }
          } catch (backendErr) {
            // Backend not available, use mock data
            console.log('Backend not available, using mock data');
            setStocks(mockStocks);
            const token = localStorage.getItem('token');
            if (token) {
              setPortfolio(mockPortfolio);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // Fallback to mock data on any error
          setStocks(mockStocks);
          const token = localStorage.getItem('token');
          if (token) {
            setPortfolio(mockPortfolio);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Update stocks with real-time data from WebSocket
  useEffect(() => {
    if (!getPrice) return;

    const interval = setInterval(() => {
      setStocks(prevStocks =>
        prevStocks.map(stock => {
          const realTimeData = getPrice(stock.symbol);
          if (realTimeData?.price !== undefined && realTimeData.price !== stock.price) {
            const priceChange = realTimeData.price - stock.price;
            return { 
              ...stock, 
              price: realTimeData.price, 
              change: priceChange 
            };
          }
          return stock;
        })
      );
    }, 1000); // Check for updates every second

    return () => clearInterval(interval);
  }, [getPrice]);

  // Real-time updates will come from WebSocket connection


  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="modern-card p-8">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-white font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="modern-card p-6 bg-danger border border-red-500/30">
          <p className="text-red-100">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <div className="flex items-center space-x-3">
            <p className="text-gray-400">Welcome back! Here's your market overview.</p>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 lg:mt-0">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input w-full lg:w-80"
          />
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="stats-grid">
          <div className="modern-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Portfolio Value</p>
                <p className="text-3xl font-bold text-white">${portfolio.totalValue.toLocaleString()}</p>
              </div>

            </div>
          </div>
          
          <div className="modern-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Day Change</p>
                <p className={`text-3xl font-bold ${portfolio.dayChange >= 0 ? 'text-success' : 'text-danger'}`}>
                  {portfolio.dayChange >= 0 ? '+' : ''}${portfolio.dayChange.toLocaleString()}
                </p>
              </div>

            </div>
          </div>
          
          <div className="modern-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Day Change %</p>
                <p className={`text-3xl font-bold ${portfolio.dayChangePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {portfolio.dayChangePercent >= 0 ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}%
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Market Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Market Overview</h2>
        <div className="dashboard-grid">
          {filteredStocks.map((stock) => (
            <div key={stock.symbol} className="modern-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">

                  <div>
                    <h3 className="text-lg font-semibold text-white">{stock.symbol}</h3>
                    {stock.marketCap && (
                      <p className="text-gray-400 text-sm">{stock.marketCap}</p>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stock.change >= 0 
                    ? 'bg-success text-success' 
                    : 'bg-danger text-danger'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</span>
                    {getPrice(stock.symbol) && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Change %</span>
                  <span className={`font-semibold ${
                    stock.change >= 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {((stock.change / (stock.price - stock.change)) * 100).toFixed(2)}%
                  </span>
                </div>
                
                {stock.volume && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-gray-300">{stock.volume.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;