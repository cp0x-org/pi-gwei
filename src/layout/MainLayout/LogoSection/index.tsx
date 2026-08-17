import { Link as RouterLink } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { ReactComponent as Cp0xLogo } from '@/assets/images/cp0x-logo.svg';
import gweiLogo from '@/assets/images/gwei_logo.png';
// material-ui
import Link from '@mui/material/Link';

// project imports
import { DASHBOARD_PATH } from 'config';

// ==============================|| MAIN LOGO ||============================== //

export default function LogoSection() {
  const intl = useIntl();

  return (
    <Link
      component={RouterLink}
      to={DASHBOARD_PATH}
      aria-label={intl.formatMessage({ id: 'nav.logo-home' })}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        textDecoration: 'none'
      }}
    >
      {/* Decorative: the link itself carries the accessible name. */}
      <img src={gweiLogo} alt="" style={{ width: 50, height: 'auto', objectFit: 'contain' }} />
      <Cp0xLogo aria-hidden="true" focusable="false" style={{ width: 50, height: 30 }} />
    </Link>
  );
}
