# Event Platform Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Stripe account for payments
- Git

## Quick Start

### 1. Environment Setup

Copy the environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/event-platform

# JWT Secrets (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will start on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:3000

### 4. Database Setup

Make sure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB Atlas cluster.

The application will automatically create the necessary collections when you start using it.

### 5. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe dashboard
3. Add them to your `.env` file
4. For webhooks, use Stripe CLI or ngrok for local development

## Features Implemented

### Backend Features ✅
- User authentication (JWT with refresh tokens)
- Role-based access control (attendee, organizer, admin)
- Event CRUD operations
- Ticket type management
- Order creation and management
- Stripe payment integration
- QR code generation for tickets
- Webhook handling for payment events
- Input validation and error handling
- Rate limiting and security middleware
- Comprehensive logging

### Frontend Features ✅
- React with Vite for fast development
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- Stripe integration for payments
- Responsive design
- Protected routes
- Form validation
- Toast notifications
- Event browsing and search
- Ticket purchasing flow
- User dashboard
- Event creation (for organizers)

### Security Features ✅
- Password hashing with bcrypt
- JWT access and refresh tokens
- CORS configuration
- Helmet for security headers
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (organizer/admin)
- `PUT /api/events/:id` - Update event (organizer/admin)
- `DELETE /api/events/:id` - Delete event (organizer/admin)
- `GET /api/events/my-events` - Get organizer's events

### Tickets
- `GET /api/tickets/event/:eventId` - Get ticket types for event
- `POST /api/tickets` - Create ticket type (organizer/admin)
- `PUT /api/tickets/:id` - Update ticket type (organizer/admin)
- `DELETE /api/tickets/:id` - Delete ticket type (organizer/admin)
- `POST /api/tickets/:id/check-in` - Check in ticket (organizer/admin)

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category (organizer/admin)
- `PUT /api/categories/:id` - Update category (organizer/admin)

### Orders
- `POST /api/orders` - Create order
- `POST /api/orders/confirm` - Confirm order after payment
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

## Testing the Application

### 1. Create User Accounts
- Register as an attendee to browse and purchase tickets
- Register as an organizer to create and manage events

### 2. Create Events (Organizer Account)
- Login as organizer
- Go to Dashboard → Create Event
- Fill in event details and save

### 3. Purchase Tickets
- Browse events on the home page
- Click on an event to view details
- Select ticket quantities and purchase
- Use Stripe test card: 4242 4242 4242 4242

### 4. Test Payment Flow
- Complete purchase with test card
- Check order confirmation
- View tickets in dashboard

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-platform
JWT_SECRET=production-secret-key
STRIPE_SECRET_KEY=sk_live_your_live_key
CLIENT_URL=https://yourdomain.com
```

### Docker Deployment
```bash
docker-compose up -d
```

The repository now includes both [backend/Dockerfile](backend/Dockerfile) and [frontend/Dockerfile](frontend/Dockerfile) used by [docker-compose.yml](docker-compose.yml).

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Deploy backend to your server
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up MongoDB replica set for production
6. Configure Stripe webhooks for your domain

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Stripe Payment Fails**
   - Verify Stripe keys are correct
   - Check webhook endpoint is accessible

3. **CORS Errors**
   - Ensure `CLIENT_URL` matches your frontend URL
   - Check CORS configuration in backend

4. **JWT Token Issues**
   - Clear localStorage and login again
   - Check JWT secrets are set correctly

### Development Tips

- Use MongoDB Compass to view database
- Use Stripe CLI for webhook testing
- Check browser console for frontend errors
- Check server logs for backend errors

## Next Steps

To extend the platform, consider adding:

- Email notifications
- Event categories management
- Advanced search and filtering
- Event analytics dashboard
- Mobile app
- Social media integration
- Event recommendations
- Multi-language support
- Advanced ticket types (early bird, group discounts)
- Event check-in system with QR scanner