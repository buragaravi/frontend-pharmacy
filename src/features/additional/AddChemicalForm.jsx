import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddChemicalForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    batchId: '',
    quantity: '',
    expiryDate: '',
    category: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    const { name, unit, batchId, quantity, expiryDate } = formData;
    if (!name || !unit || !batchId || !quantity || !expiryDate) {
      setError('All fields except category are required.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/chemicals/add',
        {
          ...formData,
          quantity: parseFloat(formData.quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess('Chemical added successfully!');
      setFormData({
        name: '',
        unit: '',
        batchId: '',
        quantity: '',
        expiryDate: '',
        category: '',
      });

      setTimeout(() => navigate('/chemicals'), 1000);
    } catch (err) {
      console.error(err);
      setError('Failed to add chemical.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Chemical</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Chemical Name', name: 'name', type: 'text' },
          { label: 'Unit (e.g., ml, g)', name: 'unit', type: 'text' },
          { label: 'Batch ID', name: 'batchId', type: 'text' },
          { label: 'Quantity', name: 'quantity', type: 'number' },
          { label: 'Expiry Date', name: 'expiryDate', type: 'date' },
          { label: 'Category (Optional)', name: 'category', type: 'text' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required={name !== 'category'}
            />
          </div>
        ))}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/chemicals')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded`}
          >
            {loading ? 'Adding...' : 'Add Chemical'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddChemicalForm;
