import { Link as RouterLink } from 'react-router-dom';
import { ReactComponent as Cp0xLogo } from '@/assets/images/cp0x-logo.svg';
import gweiLogo from '@/assets/images/gwei_logo.png';
// material-ui
import Link from '@mui/material/Link';

// project imports
import { DASHBOARD_PATH } from 'config';

// ==============================|| MAIN LOGO ||============================== //

export default function LogoSection() {
  return (
    <Link
      component={RouterLink}
      to={DASHBOARD_PATH}
      aria-label="theme-logo"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        textDecoration: 'none'
      }}
    >
      <img src={gweiLogo} alt="gwei-logo" style={{ width: 50, height: 'auto', objectFit: 'contain' }} />
      <Cp0xLogo style={{ width: 50, height: 30 }} />
    </Link>
  );
}
