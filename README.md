# Event Management Platform

A production-ready Eventbrite-like event management and ticketing web application built with the MERN stack.

## Features

- Event creation and management
- Multi-tier ticketing system
- Secure payment processing with Stripe
- Role-based access control (attendee, organizer, admin)
- QR code ticket generation
- Real-time analytics dashboard

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React.js, Vite, Redux Toolkit
- **Payment**: Stripe
- **Authentication**: JWT
- **Deployment**: Docker-ready

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure your environment variables.

## Architecture

- Clean architecture with separation of concerns
- RESTful API design
- JWT-based authentication
- Role-based authorization
- Webhook integration for payments
- Scalable database design

## Deployment Plan (Vercel + Render + MongoDB Atlas)

### 1. MongoDB Atlas (Database)
1. Create a MongoDB Atlas cluster.
2. Create a database user and allow network access for Render.
3. Copy the connection string and set it as MONGODB_URI in Render.

### 2. Backend on Render
1. Push this repository to GitHub.
2. In Render, create a new Web Service from this repository.
3. Set Root Directory to backend.
4. Build Command: npm install
5. Start Command: npm start
6. Set environment variables:
	- NODE_ENV=production
	- MONGODB_URI=<atlas-connection-string>
	- JWT_SECRET=<strong-secret>
	- JWT_REFRESH_SECRET=<strong-secret>
	- JWT_EXPIRES_IN=15m
	- JWT_REFRESH_EXPIRES_IN=7d
	- STRIPE_SECRET_KEY=<stripe-secret>
	- STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
	- CLIENT_URL=<your-vercel-frontend-url>
	- CLIENT_URLS=<optional-comma-separated-origins>
7. Deploy and verify health endpoint:
	- https://your-render-service.onrender.com/api/health

Tip: The repository includes render.yaml at the project root so you can use Render Blueprint deploy.

### 3. Frontend on Vercel
1. In Vercel, import this repository.
2. Set Root Directory to frontend.
3. Build Command: npm run build
4. Output Directory: dist
5. Set environment variables:
	- VITE_API_URL=https://your-render-service.onrender.com/api
	- VITE_STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
6. Deploy.

Tip: The repository includes frontend/vercel.json with SPA rewrites for React Router.

### 4. Post-Deploy Verification
1. Open frontend URL and verify events page loads.
2. Register/login and confirm protected routes work.
3. Create an event as organizer.
4. Create ticket types and test checkout in Stripe test mode.
5. Confirm Render logs show no CORS or database errors.