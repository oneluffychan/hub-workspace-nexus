
import { createRoot } from 'react-dom/client'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </AuthProvider>
);
