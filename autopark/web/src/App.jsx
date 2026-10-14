import './index.css';
// Before anything renders, so <html lang/dir> is right on the first paint.
import './i18n';
import AppRouter from './router/index';
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
