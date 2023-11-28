import { createTheme } from '@mui/material/styles'

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#fff',
            600: '#201E1E',
            900: '#181717',
        },
        secondary: {
            main: '#4698e0',
            600: "#5865F2"
        }
    },
});

export default theme
