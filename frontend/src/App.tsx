import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ToastProvider } from './components/ui/toast/ToastProvider';
import { queryClient } from './lib/queryClient';
import { createAppRouter } from './router';
import './index.css';

function App() {
  const [router] = useState(() => createAppRouter(queryClient));

  return (
    <AppErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} context={{ queryClient }} />
        </QueryClientProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );
}

export default App;
