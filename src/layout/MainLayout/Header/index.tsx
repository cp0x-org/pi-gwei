// material-ui
import Box from '@mui/material/Box';

// project imports
import LogoSection from '../LogoSection';
import MenuItems from './MenuItems';
import ConnectButtonCustom from 'components/ConnectButtonCustom';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  return (
    <>
      {/* logo */}
      <Box sx={{ display: 'flex' }}>
        <LogoSection />
      </Box>

      {/* menu */}
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <MenuItems />
      </Box>

      {/* connect wallet */}
      <Box>
        <ConnectButtonCustom chainStatus="icon" showBalance={false} />
      </Box>
    </>
  );
}
