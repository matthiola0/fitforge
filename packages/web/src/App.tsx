import { RouterProvider } from 'react-router-dom';
import { CoreProvider } from '@/lib/core/CoreProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { router } from '@/lib/router/routes';

export function App() {
  return (
    <ThemeProvider>
      <CoreProvider>
        <RouterProvider router={router} />
      </CoreProvider>
    </ThemeProvider>
  );
}
