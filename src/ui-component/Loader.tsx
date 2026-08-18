// third party
import { useIntl } from 'react-intl';

// material-ui
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

// ==============================|| LOADER ||============================== //

export default function Loader() {
  const intl = useIntl();

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, zIndex: 1301, width: '100%' }}>
      <LinearProgress color="primary" aria-label={intl.formatMessage({ id: 'common.loading-page' })} />
    </Box>
  );
}
