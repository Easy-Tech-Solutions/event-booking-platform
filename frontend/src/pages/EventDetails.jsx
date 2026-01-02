import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, MapPin, Users, Clock, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { fetchEventById } from '../store/slices/eventSlice';
import { createOrder } from '../store/slices/orderSlice';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentEvent: event, ticketTypes, isLoading } = useSelector((state) => state.events);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedTickets, setSelectedTickets] = useState({});

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  const handleTicketQuantityChange = (ticketTypeId, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, quantity)
    }));
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t._id === ticketTypeId);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase tickets');
      navigate('/login');
      return;
    }

    const items = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticketType: ticketTypeId,
        quantity
      }));

    if (items.length === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    try {
      const orderData = {
        eventId: event._id,
        items,
        billingDetails: {
          name: 'John Doe', // This would come from user profile
          email: 'john@example.com'
        }
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      navigate('/checkout', { state: { order: result.order, clientSecret: result.clientSecret } });
    } catch (error) {
      toast.error(error || 'Failed to create order');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="card">
              {event.images?.[0] && (
                <img
                  src={event.images[0]}
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                <button className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(event.startDate), 'EEEE, MMMM dd, yyyy')}
                    </p>
                    <p className="text-sm">
                      {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">
                      {event.isOnline ? 'Online Event' : event.location?.venue}
                    </p>
                    {!event.isOnline && (
                      <p className="text-sm">
                        {event.location?.city}, {event.location?.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">{event.capacity - event.soldTickets} spots left</p>
                    <p className="text-sm">of {event.capacity} total</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm">
                      {Math.ceil((new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60))} hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About this event</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Organizer</h2>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-semibold">
                      {event.organizer?.firstName?.[0]}{event.organizer?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.organizer?.firstName} {event.organizer?.lastName}
                    </p>
                    <p className="text-gray-600">{event.organizer?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Tickets</h2>
              
              <div className="space-y-4 mb-6">
                {ticketTypes.map((ticketType) => (
                  <div key={ticketType._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{ticketType.name}</h3>
                        <p className="text-sm text-gray-600">{ticketType.description}</p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        ${ticketType.price}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-gray-500">
                        {ticketType.available} available
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTicketQuantityChange(ticketType._id, (selectedTickets[ticketType._id] || 0) - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          disabled={!selectedTickets[ticketType._id]}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">
                          {selectedTickets[ticketType._id] || 0}
                        </span>
                        <button
                          onClick={() => handleTicketQuantityChange(ticketType._id, (selectedTickets[ticketType._id] || 0) + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          disabled={(selectedTickets[ticketType._id] || 0) >= Math.min(ticketType.available, ticketType.maxPerOrder)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getTotalTickets() > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal ({getTotalTickets()} tickets)</span>
                    <span className="font-semibold">${getTotalAmount()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Fees</span>
                    <span className="font-semibold">${Math.round(getTotalAmount() * 0.059 + 30)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>${getTotalAmount() + Math.round(getTotalAmount() * 0.059 + 30)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={getTotalTickets() === 0}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getTotalTickets() === 0 ? 'Select Tickets' : 'Purchase Tickets'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;