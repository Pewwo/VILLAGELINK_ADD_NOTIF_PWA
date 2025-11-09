import { NavbarPre_VP } from '../partials/NavbarPre_VP';
import SidebarPre_VP from '../partials/SidebarPre_VP';
import { Outlet } from 'react-router-dom';

const Pre_VPLayout = () => {
  return (
    <div >
      <NavbarPre_VP className="fixed"/>
      <div className="flex">
        <SidebarPre_VP />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Pre_VPLayout;
