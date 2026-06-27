import MainLayout from 'layout/MainLayout';
import HomePage from 'views/home/HomePage';

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: <HomePage />
    }
  ]
};

export default MainRoutes;
