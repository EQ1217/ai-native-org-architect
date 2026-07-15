import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
