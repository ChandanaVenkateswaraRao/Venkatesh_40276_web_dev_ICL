import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const Layout = () => {
  return (
    <div className="flex bg-[#F5F5F5] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        {/* We can place an AdminNavbar here if we want, or just a simple header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-[#333333]">Admin Portal</h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F84464] text-white rounded-full flex items-center justify-center font-bold">
              A
            </div>
            <span className="font-semibold text-gray-700">Admin User</span>
          </div>
        </div>
        
        {/* Renders the child admin route components */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
