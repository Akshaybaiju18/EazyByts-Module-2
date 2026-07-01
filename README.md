# 📈 Stock Market Dashboard

A real-time, responsive Stock Market Dashboard and simulation trading platform built with React (TypeScript), Node.js (Express), Socket.io, and MySQL.

---

> [!IMPORTANT]
> **Project Deadline:** October 24th  
> **Team Lead:** Akshat (Debugger & Tester)

---

## 👥 Team & Roles

| Member | Role / Domain | Core Responsibilities | Branch |
| :--- | :--- | :--- | :--- |
| **Akshat** | Team Lead | Code integration, testing, debugging, and deployment preparation | `master` |
| **Bishwanath** | Frontend Developer | React, Tailwind CSS UI/UX, Chart.js charts, real-time Socket.io updates | `frontend-bishwanath` |
| **Akshay** | Backend Developer | Express APIs, authentication, trade engine logic, and WebSocket server | `backend-akshay` |
| **Saurav** | Database Developer | MySQL schema design, indexing, performance optimization, and queries | `database-dev` |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 (TypeScript), Tailwind CSS, Chart.js, Axios, React Router
- **Backend:** Node.js, Express, Socket.io (WebSocket), JSON Web Tokens (JWT)
- **Database:** MySQL (Supports local MySQL / Aiven Cloud / PlanetScale)
- **External Data Source:** Finnhub.io API (Stock data feed)

---

## 📁 Project Structure

```text
├── frontend/          # ReactJS application (UI and charts)
├── backend/           # Node.js + Express API & Socket.io server
├── database/          # MySQL schemas and setup guides
└── docs/              # Detailed documentation and planning guides
```

---

## ⚙️ Quick Start & Setup

### 1. Database Setup
1. Ensure MySQL is installed and running.
2. Create the database schema by importing the SQL file:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. For advanced setups, see the [Database Setup Guide](file:///e:/Projects/EazyByts-Module-2/database/README.md).

### 2. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file based on `.env.example` (see variables below).
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

---

## 🔑 Environment Variables Configuration

### Backend Environment (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306         # e.g., 3306 (local) or 26760 (cloud)
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=defaultdb

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Stock API Configuration (Finnhub)
# Register at https://finnhub.io to get a free API key
STOCK_API_URL=https://api.finnhub.io/api/v1
STOCK_API_KEY=your_finnhub_api_key_here
```

### Frontend Environment (`frontend/.env`)
Create a `.env` file inside the `frontend` folder:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🔌 API Endpoints Reference

### Authentication
* `POST /auth/signup` - Register a new user (`name`, `email`, `password`)
* `POST /auth/login` - Authenticate a user and receive JWT token (`email`, `password`)

### Stocks
* `GET /stocks/live` - Fetch live stock ticker price updates
* `GET /stocks/:symbol` - Retrieve detailed information for a specific stock symbol

### Portfolio & Trading
* `GET /portfolio` - Get the authenticated user's current holdings and balance
* `POST /trade/buy` - Place an order to buy stocks (`symbol`, `quantity`)
* `POST /trade/sell` - Place an order to sell stocks (`symbol`, `quantity`)

For additional details, see the [API Documentation](file:///e:/Projects/EazyByts-Module-2/docs/api-documentation.md).

---

## 🗄️ Database Schema Design
* **`users`**: Manages user profiles, account creation date, password hashes, and virtual cash balance (default: `$10,000.00`).
* **`portfolio`**: Stores user stock holdings, quantities, and average buy price.
* **`transactions`**: Keeps history of buy and sell operations.
* **`notifications`**: User alert system for price action and trades (optional).

---

## 🔄 Git Branching Workflow
To collaborate smoothly:
1. Always branch out from `master` to your designated branch (`frontend-bishwanath`, `backend-akshay`, `database-dev`).
2. Commit changes and push to your remote branch.
3. Open a Pull Request (PR) to `master`.
4. Akshat (Team Lead) will test, review, and merge the PR.
5. Refer to [TEAM-WORKFLOW.md](file:///e:/Projects/EazyByts-Module-2/TEAM-WORKFLOW.md) for full branch synchronization steps.

---

## 🚀 Deployment

- **Frontend:** Deployed to Vercel/Netlify. Build using `npm run build`.
- **Backend:** Deployed to Render/Railway. Start server with `npm start`.
- **Database:** Hosted on PlanetScale / Aiven Cloud / MongoDB Atlas.
- Check the [Deployment Guide](file:///e:/Projects/EazyByts-Module-2/docs/deployment-guide.md) for complete cloud setup instructions.