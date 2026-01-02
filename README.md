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