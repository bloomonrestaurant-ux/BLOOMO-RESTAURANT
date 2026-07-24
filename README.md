# Bloomon Royale - Restaurant Management System

A COMPLETE, production-ready Restaurant Management System inspired by **Bloomon Family Restaurant (Warangal, Telangana)**, reimagined as a modern luxury dining brand: **Bloomon Royale**.

Features a dark and gold glassmorphic theme, smooth animations, interactive menus, table reservation requests, order checkouts with coupons, Stripe payment simulations, an admin analytics board, stock controllers, and staff directories.

---

## Technical Architecture

```
/restaurant-management-system
├── /frontend               # Next.js 16 (React 19, Redux, React Query, Tailwind v4)
├── /backend                # Express.js (TypeScript, Prisma ORM, JWT, Stripe)
├── /nginx                  # Nginx Reverse Proxy Config
├── docker-compose.yml      # Multi-container Orchestration
├── README.md               # Operations & API Manual
└── .env.example            # Environment Configurations Template
```

---

## Local Development Setup

### Prerequisite Checklist
- Node.js (v20+)
- PostgreSQL Database
- Docker Desktop (Optional, for containerized run)

### 1. Database Configuration
1. Initialize a PostgreSQL database named `bloomon_royale`.
2. Configure `.env` inside `/backend/` mapping your credentials:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bloomon_royale?schema=public"
   JWT_SECRET="bloomon_royale_jwt_secret_key"
   ```

### 2. Backend Booting
Navigate to `/backend/`, install packages, compile the database tables, run initial data seeding, and spin up the developer server:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*Note: Seeding script automatically runs on first push or you can run `npx prisma db seed` to insert default menus (Chicken Biryani, Paneer Masala, etc.) and admin login (`admin@bloomon.com` / `Admin@123`).*

### 3. Frontend Booting
Navigate to `/frontend/`, install packages, and boot the Next.js portal:
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## Docker Compose Orchestration

To run the entire stack including database, backend API, Next.js frontend, and Nginx proxy in a single command, execute the following from the root directory:
```bash
docker-compose up --build
```
Once initialized:
- Main Luxury Portal: `http://localhost` (Routed via Nginx)
- Backend Health Check: `http://localhost/health`

---

## Complete API Documentation

Base Endpoint: `http://localhost:5000/api/v1`

### 1. Authentication & Profiles (`/auth`)

#### `POST /auth/register`
Creates a customer profile.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@gmail.com",
    "password": "Password123",
    "phone": "+919999999999"
  }
  ```
- **Response**: JWT Token + User profile metrics.

#### `POST /auth/login`
Authenticates a user.
- **Request Body**:
  ```json
  {
    "email": "jane@gmail.com",
    "password": "Password123"
  }
  ```
- **Response**: JWT token.

#### `POST /auth/forgot-password`
Sends a 6-digit verification code.
- **Request Body**: `{"email": "jane@gmail.com"}`
- **Response**: Sends code to user log notices (Mock output matches log lines).

---

### 2. Gourmet Menu (`/menu`)

#### `GET /menu/items`
Retrieves menu catalog filtering values.
- **Query Params**: `category` (e.g. Veg), `search` (e.g. Biryani), `vegOnly` (`true`/`false`).
- **Response**: List of matching MenuItems.

#### `POST /menu/reviews`
Adds user rating for an item. Requires authentication header.
- **Request Body**:
  ```json
  {
    "menuItemId": "uuid-here",
    "rating": 5,
    "comment": "Perfect ghee density."
  }
  ```

---

### 3. Order Processing & Billing (`/orders`)

#### `POST /orders`
Submits checkout order.
- **Request Body**:
  ```json
  {
    "items": [
      { "menuItemId": "uuid-here", "quantity": 2 }
    ],
    "paymentMethod": "STRIPE",
    "addressId": "uuid-here",
    "couponCode": "ROYALE20"
  }
  ```
- **Response**: `orderId`, `finalAmount`, and `paymentIntentClientSecret` (if Stripe).

#### `GET /orders/:id/invoice`
Generates and downloads a custom PDF Invoice including GST tax allocations and discounts.

---

### 4. Table Booking (`/reservations`)

#### `POST /reservations`
Submits reservation booking.
- **Request Body**:
  ```json
  {
    "date": "2026-08-15",
    "time": "19:30",
    "guestsCount": 4,
    "occasion": "Anniversary",
    "specialInstructions": "Garden table, quiet area."
  }
  ```
- **Response**: PENDING status reservation object.

---

## Production Deployment Guide

### Frontend Deployment (Vercel)
1. Link your GitHub repository to Vercel.
2. Select `/frontend` as the project root.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL` (Points to your deployed backend, e.g. `https://api.bloomon.com/api/v1`)
4. Click Deploy.

### Backend Deployment (Railway / Render)
1. Add a PostgreSQL database service in Railway.
2. Link your GitHub repository and select `/backend` as the project root.
3. Bind variables:
   - `DATABASE_URL` (Auto-linked from PostgreSQL service)
   - `JWT_SECRET` (A strong custom string)
   - `STRIPE_SECRET_KEY` (Your live Stripe key)
4. Build commands are automatically detected from `package.json`.

---

## Automated Verification Guide

1. **Verify Database compilation**:
   ```bash
   npx prisma validate
   ```
2. **Execute build checks**:
   ```bash
   npm run build
   ```
3. **Verify API health**:
   Execute a GET call to `http://localhost:5000/health` to confirm server status.
