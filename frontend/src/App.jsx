import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { OperationsPreviewProvider } from './context/OperationsPreviewContext';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ToastProvider><AuthProvider><DataProvider><OperationsPreviewProvider><AppRoutes /></OperationsPreviewProvider></DataProvider></AuthProvider></ToastProvider>
  );
}
