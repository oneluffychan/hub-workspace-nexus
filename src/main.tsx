
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize application 
const initApp = () => {
  // Save the current URL in localStorage when navigation happens
  // This will help restore the state on refresh
  window.addEventListener('popstate', () => {
    localStorage.setItem('lastPath', window.location.pathname);
  });

  // Also save the path when clicking links (before popstate fires)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      setTimeout(() => {
        localStorage.setItem('lastPath', window.location.pathname);
      }, 0);
    }
  });

  // Create root and render app
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
};

// Start the application
initApp();
