import { Navbar } from '../partials/Navbar';
import Sidebar from '../partials/Sidebar';
import { Outlet } from 'react-router-dom';

const ResLayout = () => {
  return (
    <div>
      <Navbar className="fixed"/>
      <div className="flex">
        <Sidebar />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResLayout;
