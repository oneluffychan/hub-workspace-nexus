
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize application 
const initApp = () => {
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
