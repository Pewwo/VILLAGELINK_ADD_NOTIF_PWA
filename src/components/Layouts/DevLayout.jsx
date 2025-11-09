import NavbarDev from '../partials/NavbarDev';
import SidebarDev from '../partials/SidebarDev';
import { Outlet } from 'react-router-dom';

const DevLayout = () => {
  return (
    <div >
      <NavbarDev className="fixed"/>
      <div className="flex">
        <SidebarDev />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DevLayout;
