import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import eventSlice from './slices/eventSlice';
import orderSlice from './slices/orderSlice';
import promoCodeSlice from './slices/promoCodeSlice';
import trackingLinkSlice from './slices/trackingLinkSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    events: eventSlice,
    orders: orderSlice,
    promoCode: promoCodeSlice,
    trackingLinks: trackingLinkSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
