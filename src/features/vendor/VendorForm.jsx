import React, { useState, useEffect } from 'react';

const VendorForm = ({ vendor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    phone: '',
    website: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        address: vendor.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        },
        phone: vendor.phone || '',
        website: vendor.website || '',
        description: vendor.description || ''
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }
    
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[420px] overflow-y-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address.street"
            placeholder="Street"
            value={formData.address.street}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={formData.address.city}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="address.state"
              placeholder="State"
              value={formData.address.state}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="address.postalCode"
              placeholder="Postal Code"
              value={formData.address.postalCode}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="address.country"
              placeholder="Country"
              value={formData.address.country}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.website && <span className="text-red-500 text-xs">{errors.website}</span>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength="500"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          />
          <div className="text-xs text-gray-400 text-right">{formData.description.length}/500</div>
          {errors.description && <span className="text-red-500 text-xs">{errors.description}</span>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
            {vendor ? 'Update' : 'Save'} Vendor
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;