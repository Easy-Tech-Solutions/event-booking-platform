import { body, param, query } from 'express-validator';

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['attendee', 'organizer']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('description').trim().notEmpty().withMessage('Event description is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('location.venue').optional().trim(),
  body('location.address').optional().trim(),
  body('location.city').optional().trim(),
  body('isOnline').optional().isBoolean()
];

const ticketTypeValidation = [
  body('event').isMongoId().withMessage('Valid event ID is required'),
  body('name').trim().notEmpty().withMessage('Ticket type name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('maxPerOrder').optional().isInt({ min: 1 }).withMessage('Max per order must be at least 1')
];

const orderValidation = [
  body('eventId').isMongoId().withMessage('Valid event ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.ticketType').isMongoId().withMessage('Valid ticket type ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('billingDetails.name').trim().notEmpty().withMessage('Billing name is required'),
  body('billingDetails.email').isEmail().withMessage('Valid billing email is required')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Valid ID is required')
];

const eventIdValidation = [
  param('eventId').isMongoId().withMessage('Valid event ID is required')
];

export {
  registerValidation,
  loginValidation,
  eventValidation,
  ticketTypeValidation,
  orderValidation,
  paginationValidation,
  mongoIdValidation,
  eventIdValidation
};