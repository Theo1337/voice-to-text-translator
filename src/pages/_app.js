import React from 'react';
import { ThemeProvider, StyledEngineProvider  } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from '../theme'
import 'regenerator-runtime/runtime'
import '../styles/globals.css'

function MyApp({ Component, pageProps:{session, ...pageProps} }) {
  return (
    <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
        </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default MyApp
