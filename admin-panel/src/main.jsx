import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './i18n';
import App from './App.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents refetching when switching tabs
      retry: 1,
      staleTime: 0, // Immediately stale (always re-fetch in background)
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
// setTimeout(() => {
//   // test backend connection
//   axiosClient.get("http://0.0.0.0:3000/api/").then((res) => {
//     console.log("Backend is running");
//     console.log(res);
//   }).catch((err) => {
//     console.log(err);
//   });
// }, 1000);
