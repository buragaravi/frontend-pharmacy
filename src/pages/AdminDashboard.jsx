import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#F8F4F6] to-[#F0E6EC]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1]">
          <div className="flex items-center mb-6">
            <div className="bg-[#6D123F] p-2 rounded-lg mr-3">
              <AdminIcon />
            </div>
            <h2 className="text-2xl font-bold text-[#6D123F]">Admin Dashboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Existing dashboard cards */}
            // ... existing code ...

            {/* User Management Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8D8E1] hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-[#6D123F] p-2 rounded-lg mr-3">
                  <UserIcon />
                </div>
                <h3 className="text-lg font-semibold text-[#6D123F]">User Management</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage user accounts, roles, and permissions. Reset passwords and handle user-related tasks.
              </p>
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full px-4 py-2 bg-[#6D123F] text-white rounded-lg hover:bg-[#5A0F33] transition-colors"
              >
                Manage Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 