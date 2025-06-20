import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AllocateChemicalForm = () => {
  const [chemicals, setChemicals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [selectedChemicals, setSelectedChemicals] = useState([]); // For storing multiple chemicals
  const [selectedLab, setSelectedLab] = useState('');
  const [quantities, setQuantities] = useState({}); // Store quantities for each selected chemical
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchChemicals();
    fetchLabs();
  }, []);

  const fetchChemicals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChemicals(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load chemicals.');
    }
  };

  const fetchLabs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/labs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabs(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load labs.');
    }
  };

  const handleChemicalSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedChemicals(selected);
  };

  const handleQuantityChange = (chemicalId, e) => {
    const newQuantities = { ...quantities, [chemicalId]: e.target.value };
    setQuantities(newQuantities);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLab || selectedChemicals.length === 0 || Object.values(quantities).some(qty => !qty || isNaN(qty))) {
      setError('All fields are required and quantities must be valid.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const allocationData = selectedChemicals.map(chemicalId => ({
        chemicalId,
        labId: selectedLab,
        quantity: parseInt(quantities[chemicalId]),
      }));

      const response = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/chemicals/allocate',
        { allocations: allocationData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setSuccess('Chemicals allocated successfully!');
        setSelectedChemicals([]);
        setSelectedLab('');
        setQuantities({});
      }
    } catch (err) {
      console.error(err);
      setError('Failed to allocate chemicals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Allocate Chemicals</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="chemicals">
            Chemicals
          </label>
          <select
            id="chemicals"
            multiple
            value={selectedChemicals}
            onChange={handleChemicalSelect}
            className="w-full p-2 border rounded-md"
          >
            {chemicals.map((chem) => (
              <option key={chem._id} value={chem._id}>
                {chem.name}
              </option>
            ))}
          </select>
        </div>

        {selectedChemicals.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="quantity">
              Quantity for each selected chemical
            </label>
            {selectedChemicals.map((chemicalId) => {
              const chemical = chemicals.find(c => c._id === chemicalId);
              return (
                <div key={chemicalId} className="mb-4">
                  <label className="block text-sm font-semibold">{chemical.name}</label>
                  <input
                    type="number"
                    min="1"
                    value={quantities[chemicalId] || ''}
                    onChange={(e) => handleQuantityChange(chemicalId, e)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Quantity"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="lab">
            Lab
          </label>
          <select
            id="lab"
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select Lab</option>
            {labs.map((lab) => (
              <option key={lab._id} value={lab._id}>
                {lab.labId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/chemicals')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? 'bg-gray-500' : 'bg-blue-600'
            } text-white px-4 py-2 rounded-md hover:bg-blue-700`}
          >
            {loading ? 'Allocating...' : 'Allocate'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AllocateChemicalForm;
