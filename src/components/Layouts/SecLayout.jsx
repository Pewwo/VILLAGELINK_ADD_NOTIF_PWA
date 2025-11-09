import { NavbarSec } from '../partials/NavbarSec';
import SidebarSec from '../partials/SidebarSec';
import { Outlet } from 'react-router-dom';

const SecLayout = () => {
  return (
    <div >
      <NavbarSec className="fixed"/>
      <div className="flex">
        <SidebarSec />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SecLayout;
