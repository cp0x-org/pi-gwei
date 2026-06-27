import { Outlet } from 'react-router-dom';

// material-ui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

// project imports
import Header from './Header';
import Footer from './Footer';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* header */}
      <AppBar enableColorOnDark position="fixed" color="inherit" elevation={0} sx={{ bgcolor: 'background.default' }}>
        <Toolbar sx={{ p: 2 }}>
          <Header />
        </Toolbar>
      </AppBar>

      {/* body panel — sides keep page color, panel is rgb(22, 22, 31) */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '88px'
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1280,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgb(22, 22, 31)'
          }}
        >
          {/* main content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2
            }}
          >
            <Outlet />
          </Box>

          {/* footer */}
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
