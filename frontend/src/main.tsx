import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './app/App.tsx';
import { store } from './app/store';
import { fetchProfile } from './app/store/slices/authSlice';
import './styles/index.css';

// Bootstrap: if a token exists, fetch the user profile on app load
if (localStorage.getItem('accessToken')) {
  store.dispatch(fetchProfile());
}

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
