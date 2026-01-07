import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './legacy/App'; // 或根据实际情况用新版 App
import { Provider } from 'react-redux';
import store from './legacy/redux/store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { setData } from './legacy/redux/dataSlice';
import RunTab from './legacy/pages/Sessions/tabs/RunTab';
async function bootstrap(): Promise<void> {
  // const data = await window.api.readDataFile();
  // store.dispatch(setData(JSON.parse(data as string)));

  const darkTheme = createTheme({
    palette: { mode: 'dark' }
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Provider>
    </StrictMode>
  );
}

bootstrap();
