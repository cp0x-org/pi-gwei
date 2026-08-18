import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

// third party
import { FormattedMessage } from 'react-intl';

// material-ui
import Alert from '@mui/material/Alert';

// ==============================|| ELEMENT ERROR - COMMON ||============================== //

export default function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <Alert color="error">
          <FormattedMessage id="error.404" />
        </Alert>
      );
    }

    if (error.status === 401) {
      return (
        <Alert color="error">
          <FormattedMessage id="error.401" />
        </Alert>
      );
    }

    if (error.status === 503) {
      return (
        <Alert color="error">
          <FormattedMessage id="error.503" />
        </Alert>
      );
    }

    if (error.status === 418) {
      return (
        <Alert color="error">
          <FormattedMessage id="error.418" />
        </Alert>
      );
    }
  }

  return (
    <Alert color="error">
      <FormattedMessage id="error.maintenance" />
    </Alert>
  );
}
