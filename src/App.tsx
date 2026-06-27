import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import Locales from 'ui-component/Locales';
import NavigationScroll from 'layout/NavigationScroll';
import Snackbar from 'ui-component/extended/Snackbar';
import Notistack from 'ui-component/third-party/Notistack';

import ThemeCustomization from 'themes';

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <Locales>
        <NavigationScroll>
          <Notistack>
            <RouterProvider router={router} />
            <Snackbar />
          </Notistack>
        </NavigationScroll>
      </Locales>
    </ThemeCustomization>
  );
}
