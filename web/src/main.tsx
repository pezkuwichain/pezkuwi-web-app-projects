import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

// All providers are now in App.tsx for better organization
createRoot(document.getElementById("root")!).render(<App />);
