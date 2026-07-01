import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';

interface StockUpdate {
  s: string; // symbol
  p: number; // price
  t: number; // timestamp
  v: number; // volume
}

interface StockPrice {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
}

export const useRealTimeStocks = (symbols: string[] = []) => {
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const handleStockUpdate = useCallback((data: StockUpdate[]) => {
    try {
      console.log('Received stock update:', data);
      setStockPrices(prev => {
        const newPrices = new Map(prev);
        
        data.forEach(update => {
          if (symbols.length === 0 || symbols.includes(update.s)) {
            newPrices.set(update.s, {
              symbol: update.s,
              price: update.p,
              timestamp: update.t,
              volume: update.v
            });
          }
        });
        
        return newPrices;
      });
    } catch (error) {
      console.log('Error updating stock prices:', error);
    }
  }, [symbols]);

  useEffect(() => {
    let isMounted = true;
    
    socketService.connect();
    socketService.on('stockUpdate', handleStockUpdate);
    
    const checkConnection = () => {
      if (isMounted) {
        setIsConnected(socketService.isConnected());
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      isMounted = false;
      socketService.off('stockUpdate', handleStockUpdate);
      clearInterval(interval);
    };
  }, [handleStockUpdate]);

  const getPrice = (symbol: string): StockPrice | null => {
    return stockPrices.get(symbol) || null;
  };

  const getAllPrices = (): StockPrice[] => {
    return Array.from(stockPrices.values());
  };

  return {
    stockPrices,
    isConnected,
    getPrice,
    getAllPrices
  };
};