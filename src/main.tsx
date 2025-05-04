
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize application 
const initApp = () => {
  // Record initial path on first load
  if (!localStorage.getItem('lastPath')) {
    localStorage.setItem('lastPath', window.location.pathname);
  }

  // Save the current URL in localStorage when navigation happens
  window.addEventListener('popstate', () => {
    // Don't save login/signup pages in lastPath
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      localStorage.setItem('lastPath', window.location.pathname);
    }
  });

  // Also save the path when clicking links (before popstate fires)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.tagName === 'A' ? target : target.closest('a');
    
    if (link) {
      // Extract path from href
      const href = link.getAttribute('href');
      if (href && !href.includes('/login') && !href.includes('/signup')) {
        // Delay to ensure we get the right path after navigation
        setTimeout(() => {
          localStorage.setItem('lastPath', window.location.pathname);
        }, 0);
      }
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
