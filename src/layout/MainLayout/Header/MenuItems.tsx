import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';

// material-ui
import { Box, Button, Stack, Theme, useMediaQuery, useTheme } from '@mui/material';

// Menu button styling as an object for reuse
const menuButtonStyle = (theme: Theme) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  padding: '6px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main
  }
});

const MenuItems = () => {
  const theme = useTheme();
  const intl = useIntl();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const { pathname } = useLocation();

  if (matchDownMd) return null;

  return (
    <Box component="nav" aria-label={intl.formatMessage({ id: 'nav.main' })} sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
      <Stack direction="row" spacing={1}>
        {/* Internal link using RouterLink */}
        <Button component={RouterLink} to="/" aria-current={pathname === '/' ? 'page' : undefined} sx={menuButtonStyle(theme)}>
          <FormattedMessage id="nav.home" />
        </Button>

        {/* External links using anchor tags */}
        <Button href="https://pi.cp0x.com" rel="noopener noreferrer" sx={menuButtonStyle(theme)}>
          <FormattedMessage id="nav.permissionless-interfaces" />
        </Button>

        <Button href="https://cp0x.com" target="_blank" rel="noopener noreferrer" sx={menuButtonStyle(theme)}>
          <FormattedMessage id="nav.cp0x-referrals" />
        </Button>
      </Stack>
    </Box>
  );
};

export default MenuItems;
