# Event Platform API Documentation

## Overview

The Event Platform API provides endpoints for managing events, users, tickets, and orders. It's built with Node.js, Express, and MongoDB.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "attendee" // or "organizer"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Events

#### Get Events
```http
GET /events?page=1&limit=10&search=music&category=music&location=NYC
```

#### Get Event by ID
```http
GET /events/:id
```

#### Create Event (Organizer/Admin only)
```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Music Concert",
  "description": "Amazing live music event",
  "category": "category-id",
  "startDate": "2024-06-01T19:00:00Z",
  "endDate": "2024-06-01T23:00:00Z",
  "capacity": 500,
  "location": {
    "venue": "Concert Hall",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY"
  },
  "isOnline": false
}
```

### Ticket Types

#### Create Ticket Type (Organizer/Admin only)
```http
POST /tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "event-id",
  "name": "General Admission",
  "description": "Standard entry ticket",
  "price": 50,
  "quantity": 100,
  "maxPerOrder": 5
}
```

#### Get Ticket Types for Event
```http
GET /tickets/event/:eventId
```

### Orders

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "event-id",
  "items": [
    {
      "ticketType": "ticket-type-id",
      "quantity": 2
    }
  ],
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Confirm Order
```http
POST /orders/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-id",
  "paymentIntentId": "pi_stripe_payment_intent_id"
}
```

#### Get My Orders
```http
GET /orders
Authorization: Bearer <token>
```

### Webhooks

#### Stripe Webhook
```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: <stripe-signature>

// Stripe webhook payload
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Pagination

List endpoints support pagination with `page` and `limit` query parameters:

```http
GET /events?page=1&limit=10
```

Response includes pagination metadata:

```json
{
  "events": [...],
  "currentPage": 1,
  "totalPages": 5,
  "total": 50
}
```