import NavbarSP from '../partials/NavbarSP';
import SidebarSP from '../partials/SidebarSP';
import { Outlet } from 'react-router-dom';

const SpLayout = () => {
  return (
    <div >
      <NavbarSP className="fixed"/>
      <div className="flex">
        <SidebarSP />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SpLayout;
