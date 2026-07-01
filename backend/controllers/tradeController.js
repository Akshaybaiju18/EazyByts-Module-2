import pool from '../config/database.js';
import { getStockQuote } from '../services/stockService.js';

// Buy stock
export const buyStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user.id;
    const { symbol, quantity, price } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid symbol or quantity' });
    }
    
    // Use provided price or get current stock price
    let currentPrice;
    if (price && price > 0) {
      currentPrice = price;
    } else {
      const stockData = await getStockQuote(symbol.toUpperCase());
      currentPrice = stockData.c; // Finnhub current price
    }
    
    const totalCost = currentPrice * quantity;
    
    await connection.beginTransaction();
    
    // Check user balance
    const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0 || userRows[0].balance < totalCost) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    
    // Update user balance
    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, userId]);
    
    // Update or insert portfolio
    const [portfolioRows] = await connection.query(
      'SELECT quantity, avg_price FROM portfolio WHERE user_id = ? AND stock_symbol = ?',
      [userId, symbol.toUpperCase()]
    );
    
    if (portfolioRows.length > 0) {
      // Update existing holding
      const existingQty = portfolioRows[0].quantity;
      const existingAvgPrice = portfolioRows[0].avg_price;
      const newQty = existingQty + quantity;
      const newAvgPrice = ((existingQty * existingAvgPrice) + (quantity * currentPrice)) / newQty;
      
      await connection.query(
        'UPDATE portfolio SET quantity = ?, avg_price = ? WHERE user_id = ? AND stock_symbol = ?',
        [newQty, newAvgPrice, userId, symbol.toUpperCase()]
      );
    } else {
      // Insert new holding
      await connection.query(
        'INSERT INTO portfolio (user_id, stock_symbol, quantity, avg_price) VALUES (?, ?, ?, ?)',
        [userId, symbol.toUpperCase(), quantity, currentPrice]
      );
    }
    
    // Record transaction
    const [result] = await connection.query(
      'INSERT INTO transactions (user_id, stock_symbol, transaction_type, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, symbol.toUpperCase(), 'buy', quantity, currentPrice, totalCost]
    );
    
    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Stock purchased successfully',
      data: {
        id: result.insertId,
        symbol: symbol.toUpperCase(),
        quantity,
        price: currentPrice,
        total: totalCost
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Buy stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to buy stock' });
  } finally {
    connection.release();
  }
};

// Sell stock
export const sellStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user.id;
    const { symbol, quantity, price } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid symbol or quantity' });
    }
    
    // Use provided price or get current stock price
    let currentPrice;
    if (price && price > 0) {
      currentPrice = price;
    } else {
      const stockData = await getStockQuote(symbol.toUpperCase());
      currentPrice = stockData.c;
    }
    
    const totalValue = currentPrice * quantity;
    
    await connection.beginTransaction();
    
    // Check if user has enough shares
    const [portfolioRows] = await connection.query(
      'SELECT quantity FROM portfolio WHERE user_id = ? AND stock_symbol = ?',
      [userId, symbol.toUpperCase()]
    );
    
    if (portfolioRows.length === 0 || portfolioRows[0].quantity < quantity) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient shares' });
    }
    
    // Update portfolio
    const newQuantity = portfolioRows[0].quantity - quantity;
    if (newQuantity === 0) {
      await connection.query('DELETE FROM portfolio WHERE user_id = ? AND stock_symbol = ?', [userId, symbol.toUpperCase()]);
    } else {
      await connection.query('UPDATE portfolio SET quantity = ? WHERE user_id = ? AND stock_symbol = ?', [newQuantity, userId, symbol.toUpperCase()]);
    }
    
    // Update user balance
    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [totalValue, userId]);
    
    // Record transaction
    const [result] = await connection.query(
      'INSERT INTO transactions (user_id, stock_symbol, transaction_type, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, symbol.toUpperCase(), 'sell', quantity, currentPrice, totalValue]
    );
    
    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Stock sold successfully',
      data: {
        id: result.insertId,
        symbol: symbol.toUpperCase(),
        quantity,
        price: currentPrice,
        total: totalValue
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Sell stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to sell stock' });
  } finally {
    connection.release();
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        stock_symbol as symbol,
        transaction_type as action,
        quantity,
        price,
        total_amount as total,
        created_at as timestamp
      FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);
    
    res.json(rows); // Return array directly as frontend expects
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction history' });
  }
};