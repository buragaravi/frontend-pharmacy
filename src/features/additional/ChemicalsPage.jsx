import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const ChemicalsPage = () => {
  const [chemicals, setChemicals] = useState([]);
  const [labChemicals, setLabChemicals] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('central'); // 'central' or 'labs'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userLabId, setUserLabId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setUserRole(decoded.role);
      setUserLabId(decoded.labId); // if role is lab_assistant
      setViewMode(decoded.role === 'lab_assistant' ? 'labs' : 'central');
    }
  }, []);

  useEffect(() => {
    if (userRole) fetchChemicals();
  }, [viewMode, userRole]);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = '';

      if (userRole === 'lab_assistant') {
        url = `https://backend-pharmacy-5541.onrender.com/api/chemicals/stock/${userLabId}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLabChemicals([{ labId: userLabId, chemicals: response.data }]);
      } else {
        url =
          viewMode === 'central'
            ? 'https://backend-pharmacy-5541.onrender.com/api/chemicals'
            : 'https://backend-pharmacy-5541.onrender.com/api/chemicals/labs';
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        viewMode === 'central'
          ? setChemicals(response.data)
          : setLabChemicals(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load chemical data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredChemicals = chemicals.filter((chem) =>
    chem.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#0B3861]">
          {viewMode === 'central' ? 'Central Inventory' : 'Lab Inventory'}
        </h2>
        {userRole !== 'lab_assistant' && (
          <div className="space-x-2">
            <button
              onClick={() => navigate('/chemicals/add')}
              className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] transition-colors"
            >
              Add Chemical
            </button>
            <button
              onClick={() => navigate('/chemicals/allocate')}
              className="px-4 py-2 bg-[#64B5F6] text-white rounded-lg hover:bg-[#1E88E5] transition-colors"
            >
              Allocate Chemical
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'central' ? 'labs' : 'central')}
              className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] transition-colors"
            >
              {viewMode === 'central' ? 'View Lab Stocks' : 'View Central Stock'}
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full p-2 rounded-lg border border-[#BCE0FD] focus:ring-2 focus:ring-[#64B5F6] focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3861]"></div>
        </div>
      ) : error ? (
        <div className="bg-[#F5F9FD] border-l-4 border-[#0B3861] p-4 rounded-lg">
          <p className="text-[#0B3861]">{error}</p>
        </div>
      ) : viewMode === 'central' ? (
        <div className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-[#F5F9FD]">
              <tr>
                <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Original Quantity</th>
                <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Current Quantity</th>
                <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Unit</th>
                <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredChemicals.map((chem) => (
                <tr key={chem._id} className="border-t border-[#BCE0FD] hover:bg-[#F5F9FD]">
                  <td className="px-4 py-3 text-[#0B3861]">{chem.name}</td>
                  <td className="px-4 py-3 text-[#64B5F6]">{chem.originalQuantity}</td>
                  <td className="px-4 py-3 text-[#64B5F6]">{chem.currentQuantity}</td>
                  <td className="px-4 py-3 text-[#64B5F6]">{chem.unit}</td>
                  <td className="px-4 py-3 text-[#64B5F6]">{chem.category || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {labChemicals.map((lab) => (
            <div key={lab.labId} className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] overflow-hidden">
              <div className="bg-[#F5F9FD] px-4 py-3 border-b border-[#BCE0FD]">
                <h3 className="text-lg font-semibold text-[#0B3861]">Lab: {lab.labId}</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-[#F5F9FD]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Chemical</th>
                    <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Original Qty</th>
                    <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Current Qty</th>
                    <th className="px-4 py-3 text-left text-[#0B3861] font-semibold">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.chemicals.map((chem, index) => (
                    <tr key={index} className="border-t border-[#BCE0FD] hover:bg-[#F5F9FD]">
                      <td className="px-4 py-3 text-[#0B3861]">{chem.name}</td>
                      <td className="px-4 py-3 text-[#64B5F6]">{chem.originalQuantity}</td>
                      <td className="px-4 py-3 text-[#64B5F6]">{chem.currentQuantity}</td>
                      <td className="px-4 py-3 text-[#64B5F6]">{chem.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChemicalsPage;
