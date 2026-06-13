import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import App from './app/App.tsx';
import { store } from './app/store';
import { fetchProfile } from './app/store/slices/authSlice';
import './styles/index.css';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
// loadStripe returns null if the key is empty, which is handled gracefully by Elements
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Bootstrap: if a token exists, fetch the user profile on app load
if (localStorage.getItem('accessToken')) {
  store.dispatch(fetchProfile());
}

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <Elements stripe={stripePromise} options={{ locale: 'en' }}>
      <App />
    </Elements>
  </Provider>
);
