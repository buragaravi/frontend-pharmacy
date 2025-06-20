import React, { useState } from 'react';
import { addEquipmentToCentral } from './equipmentApi';

const AddEquipmentToCentralForm = () => {
  const [items, setItems] = useState([
    { productId: '', name: '', variant: '', quantity: 1, vendor: '', pricePerUnit: '', department: '', unit: '', expiryDate: '', warranty: '', maintenanceCycle: '' }
  ]);
  const [usePreviousBatchId, setUsePreviousBatchId] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, { productId: '', name: '', variant: '', quantity: 1, vendor: '', pricePerUnit: '', department: '', unit: '', expiryDate: '', warranty: '', maintenanceCycle: '' }]);
  };

  const removeRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await addEquipmentToCentral(items, usePreviousBatchId);
      setMessage(res.message || 'Equipment added successfully!');
      setItems([
        { productId: '', name: '', variant: '', quantity: 1, vendor: '', pricePerUnit: '', department: '', unit: '', expiryDate: '', warranty: '', maintenanceCycle: '' }
      ]);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Add Equipment to Central Store</h2>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-2 border-b pb-2 mb-2">
          <input type="text" placeholder="Product ID" value={item.productId} onChange={e => handleChange(idx, 'productId', e.target.value)} className="border p-1 rounded" required />
          <input type="text" placeholder="Name" value={item.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="border p-1 rounded" required />
          <input type="text" placeholder="Variant" value={item.variant} onChange={e => handleChange(idx, 'variant', e.target.value)} className="border p-1 rounded" />
          <input type="number" min="1" placeholder="Quantity" value={item.quantity} onChange={e => handleChange(idx, 'quantity', e.target.value)} className="border p-1 rounded" required />
          <input type="text" placeholder="Vendor" value={item.vendor} onChange={e => handleChange(idx, 'vendor', e.target.value)} className="border p-1 rounded" />
          <input type="number" placeholder="Price/Unit" value={item.pricePerUnit} onChange={e => handleChange(idx, 'pricePerUnit', e.target.value)} className="border p-1 rounded" />
          <input type="text" placeholder="Department" value={item.department} onChange={e => handleChange(idx, 'department', e.target.value)} className="border p-1 rounded" />
          <input type="text" placeholder="Unit" value={item.unit} onChange={e => handleChange(idx, 'unit', e.target.value)} className="border p-1 rounded" />
          <input type="date" placeholder="Expiry Date" value={item.expiryDate} onChange={e => handleChange(idx, 'expiryDate', e.target.value)} className="border p-1 rounded" />
          <input type="text" placeholder="Warranty" value={item.warranty} onChange={e => handleChange(idx, 'warranty', e.target.value)} className="border p-1 rounded" />
          <input type="text" placeholder="Maintenance Cycle" value={item.maintenanceCycle} onChange={e => handleChange(idx, 'maintenanceCycle', e.target.value)} className="border p-1 rounded" />
          <button type="button" onClick={() => removeRow(idx)} className="text-red-500">Remove</button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="bg-blue-500 text-white px-2 py-1 rounded">Add Row</button>
      <div className="flex items-center gap-2 mt-2">
        <input type="checkbox" checked={usePreviousBatchId} onChange={e => setUsePreviousBatchId(e.target.checked)} />
        <label>Use Previous Batch ID</label>
      </div>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Adding...' : 'Add Equipment'}</button>
      {message && <div className="mt-2 text-blue-700">{message}</div>}
    </form>
  );
};

export default AddEquipmentToCentralForm;
