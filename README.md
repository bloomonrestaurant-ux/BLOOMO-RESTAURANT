# 🌟 Bloomon Family Restaurant - Luxury Dining & Management System

A production-ready, full-stack Restaurant Management and Online Ordering Platform built for **Bloomon Family Restaurant** (Warangal, Telangana). Featuring an obsidian-and-gold luxury glassmorphic design, dynamic menu management, real-time store open/closed controls, table seating & advance bookings, live order tracking with instant cancellation & wallet refunds, and comprehensive admin analytics.

---

## 🏛️ System Architecture

```
BLOOMO-RESTAURANT/
├── frontend/                     # Next.js 15 (React 19, Tailwind CSS v4, Redux Toolkit, TanStack Query)
│   ├── src/app/                  # App Router Pages (Menu, Checkout, Reservations, My Orders, Dashboard, Admin)
│   ├── src/components/           # Reusable UI (Navigation, Footer, ClosedModal, Modals)
│   ├── src/store/                # Redux State Management (Auth, Cart)
│   └── src/services/             # Axios API Client & Interceptors
├── backend/                      # Node.js + Express + TypeScript Backend API
│   ├── src/controllers/          # Route Business Logic (Auth, Menu, Orders, Admin, Reservations)
│   ├── src/routes/               # REST API Endpoints
│   ├── src/middlewares/          # JWT Auth, Role-Based Access Control (RBAC)
│   ├── src/config/               # Database Client (Prisma), Email (Resend), Stripe
│   └── prisma/                   # PostgreSQL Schema & Seed Scripts
├── docker-compose.yml            # Multi-container local orchestration
└── README.md                     # Project Documentation & Deployment Manual
```

---

## ✨ Key Features & Capabilities

### 🍽️ Customer Experience & Gourmet Dining
- **Luxury Obsidian & Gold Aesthetics**: Custom glassmorphism, responsive micro-animations, and fluid transitions.
- **Dynamic Gourmet Menu**: Instant filtering (Veg / Non-Veg / All), multi-size portion selection (Single / Half / Family), in-memory caching for zero latency.
- **Synchronized Table Seating**: Choose a table directly from the cart sidebar or checkout grid (`Table 1` to `Table 10`).
- **Flexible Ordering Modes**:
  - 🍽️ **Dine-In At Restaurant** (Direct to seat with table selection)
  - 🛍️ **Takeaway / Parcel Pickup**
  - 🛵 **Online Delivery**
- **Dual Payment Options**: Seamlessly switch between **Cash on Delivery (COD)** and **Online Payment (Stripe / UPI)**.
- **Live Order Tracking**: Real-time 6-stage delivery tracker (Received ➔ Preparing ➔ Cooking ➔ Ready ➔ Out for Delivery ➔ Delivered).
- **Instant Order Cancellation & Auto-Refund**: Cancel active orders with 1-click; prepaid orders are immediately refunded to the user's digital wallet.
- **Automated PDF Invoices**: Download official tax-compliant invoices with GST breakdown directly from order cards.
- **Dark & Light Mode Toggle**: Switch between Obsidian Gold and Pearl White themes with persistent storage.
- **OTP Account Security**: OTP-verified updates for registered Email, Password, and Phone numbers.

### 👑 Real-Time Admin Management Portal
- **Instant Store Open/Closed Toggle**: Pause online ordering across the whole website with one click; visitors receive a tailored notification popup with kitchen resumption timings.
- **Dynamic Kitchen Timings**: Adjust daily opening and closing hours directly from `/admin/settings` to synchronize across all customer pages.
- **Live Kitchen & Orders Dashboard**: Filter, update order progress stages, assign delivery, and track daily revenue.
- **Menu & Pricing Control**: Create, edit, activate/deactivate menu items, categories, and multi-portion rates.
- **Promotions & Coupon Engine**: Create fixed or percentage discount promo codes with usage limits.
- **Table Reservation Hub**: Approve, reject, and monitor private table bookings in real time.

---

## 🔑 Default Credentials & Universal OTP

### 👑 Admin Account
- **Email**: `bloomonrestaurant@gmail.com`
- **Password**: `Admin@1234`
- **Role**: `ADMIN`
- **Access Route**: `http://localhost:3000/admin`

### 🔒 Universal Deployment & Testing OTP
- **Universal OTP Code**: `123456`
- *For hassle-free testing and deployment verification, any OTP prompt (New User Registration, Password Reset, or Profile Changes) universally accepts `123456`.*

---

## 🚀 Quick Start / Local Development

### Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: Local instance or cloud database (e.g. Neon, Supabase, Railway)
- **Git**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Ensure your `backend/.env` file contains:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/bloomon_restaurant?schema=public"
JWT_SECRET="bloomon_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="bloomonrestaurant@gmail.com"
FRONTEND_URL="http://localhost:3000"
RESEND_API_KEY="" # Optional for testing (OTP default: 123456)
STRIPE_SECRET_KEY="sk_test_..." # Optional for Stripe
```

```bash
# Push Prisma schema to database
npx prisma generate
npx prisma db push

# Seed default menus and admin account
npx prisma db seed

# Start backend dev server
npm run dev
```
*Backend API runs at `http://localhost:5000` (Health check: `http://localhost:5000/health`).*

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local
```

Ensure your `frontend/.env.local` file contains:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

```bash
# Start frontend dev server
npm run dev
```
*Frontend opens at `http://localhost:3000`.*

---

## 🌐 Production Deployment Guide

### Deploying Frontend on Vercel
1. Connect your GitHub repository to **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your live backend URL (e.g. `https://your-backend.onrender.com/api/v1`).
4. Click **Deploy**.

### Deploying Backend on Render / Railway
1. Create a **Web Service** pointing to the GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `npm install && npx prisma generate && npm run build`
4. Set **Start Command**: `npm run start`
5. Configure Environment Variables:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string (Neon / Supabase).
   - `JWT_SECRET`: A secure random secret.
   - `ADMIN_EMAIL`: `bloomonrestaurant@gmail.com`
   - `FRONTEND_URL`: Your deployed frontend URL.
6. Click **Deploy**.

---

## 📡 REST API Reference

Base URL: `http://localhost:5000/api/v1`

### 1. Authentication & Profile (`/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new account & trigger OTP | Public |
| `POST` | `/auth/verify-otp` | Verify 6-digit OTP (`123456`) & activate account | Public |
| `POST` | `/auth/login` | Authenticate customer/admin & receive JWT | Public |
| `POST` | `/auth/forgot-password` | Send password reset OTP | Public |
| `GET` | `/auth/profile` | Get user profile, orders & saved addresses | User |
| `POST` | `/auth/profile/send-otp` | Send OTP for profile credential updates | User |
| `PUT` | `/auth/profile/update-with-otp` | Update Email, Password, or Phone with OTP | User |

### 2. Gourmet Menu & Store Status (`/menu`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/menu/items` | Fetch all menu items (filterable by category) | Public |
| `GET` | `/menu/public-settings` | Fetch live restaurant open/closed status & hours | Public |
| `GET` | `/menu/categories` | Fetch list of culinary categories | Public |
| `POST` | `/menu/items` | Add new menu dish | Admin |
| `PUT` | `/menu/items/:id` | Update dish details & pricing | Admin |

### 3. Orders & Billing (`/orders`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/orders` | Submit new order (Delivery / Dine-in / Parcel) | User |
| `GET` | `/orders/:id` | Get live tracking details for specific order | User |
| `POST` | `/orders/:orderId/cancel` | Cancel order & auto-refund paid amount | User / Admin |
| `GET` | `/orders/:id/invoice` | Download official PDF invoice with tax summary | User |
| `POST` | `/orders/coupon/validate` | Validate discount coupon code | Public |

### 4. Admin Management (`/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/orders` | Fetch comprehensive restaurant orders list | Admin |
| `PUT` | `/orders/:orderId/status` | Advance order progress stage | Admin / Staff |
| `GET` | `/admin/settings` | Retrieve all system operational settings | Admin |
| `POST` | `/admin/settings` | Save restaurant timings & store status | Admin |
| `GET` | `/admin/reservations` | Review private dining reservation requests | Admin |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Redux Toolkit, TanStack Query, Framer Motion, Lucide Icons.
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL (Neon), Bcrypt, Jose / JWT, PDFKit, Stripe.
- **Deployment**: Vercel (Frontend), Render / Railway (Backend), Neon (Database).

---

## 📄 License & Attribution

Crafted for **Bloomon Family Restaurant** • Reimagined with Luxury Obsidian & Gold Fine Dining Experience.
