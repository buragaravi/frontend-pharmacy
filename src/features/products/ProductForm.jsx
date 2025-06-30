import React, { useState, useEffect, useRef } from 'react';

// Predefined units for dropdown with descriptive names
const UNIT_OPTIONS = [
  { value: 'mg', label: 'mg (Milligrams)' },
  { value: 'g', label: 'g (Grams)' },
  { value: 'kg', label: 'kg (Kilograms)' },
  { value: 'ml', label: 'ml (Milliliters)' },
  { value: 'L', label: 'L (Liters)' },
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'set', label: 'set (Sets)' },
  { value: 'box', label: 'box (Boxes)' },
  { value: 'pack', label: 'pack (Packs)' },
  { value: 'cap', label: 'cap (Capsules)' },
  { value: 'other', label: 'other (Other)' }
];

// Predefined variants for glassware/equipment
const VARIANT_PRESETS = {
  glassware: [
    '50ml', '100ml', '250ml', '500ml', '1000ml', 'other'
  ],
  equipment: [
    'Small', 'Medium', 'Large', 'other'
  ],
  others: ['Standard', 'other']
};

const ProductForm = ({ product, onCreate, onUpdate, onClose, initialName }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    thresholdValue: 0,
    category: 'chemical',
    subCategory: '',
    variant: '',
    variantOther: '',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const toastTimeout = useRef(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        unit: product.unit,
        thresholdValue: product.thresholdValue,
        category: product.category,
        subCategory: product.subCategory || '',
        variant: product.variant || '',
        variantOther: '',
      });
    } else if (initialName) {
      setFormData((prev) => ({ ...prev, name: initialName }));
    }
  }, [product, initialName]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 2500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'variant' && value !== 'other') {
      setFormData((prev) => ({ ...prev, variant: value, variantOther: '' }));
    } else if (name === 'variant' && value === 'other') {
      setFormData((prev) => ({ ...prev, variant: value, variantOther: '' }));
    } else if (name === 'variantOther') {
      setFormData((prev) => ({ ...prev, variant: value, variantOther: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'thresholdValue' ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let submitData = { ...formData };
    if (formData.category !== 'chemical') {
      submitData.unit = '';
      submitData.variant = formData.variant === 'other' ? formData.variantOther : formData.variant;
    }
    if (product) {
      onUpdate(product._id, submitData);
      showToast('Product updated successfully!', 'success');
    } else {
      onCreate(submitData);
      showToast('Product created successfully!', 'success');
    }
  };

  const handleCancel = () => {
    onClose();
    showToast('Action cancelled.', 'info');
  };

  return (
    <div className="p-6 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl relative max-h-[75vh] overflow-y-auto">
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300
            ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {toast.message}
        </div>
      )}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          >
            <option value="chemical">Chemical</option>
            <option value="glassware">Glassware</option>
            <option value="equipment">Equipment</option>
            <option value="others">Others</option>
          </select>
        </div>

        {/* Unit (dropdown, only for chemical) */}
        {formData.category === 'chemical' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            >
              <option value="">Select unit</option>
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Variant (for non-chemical categories) */}
        {formData.category !== 'chemical' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Variant</label>
            <select
              name="variant"
              value={formData.variant || ''}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            >
              <option value="">Select variant</option>
              {(VARIANT_PRESETS[formData.category] || []).map((variant) => (
                <option key={variant} value={variant}>{variant}</option>
              ))}
            </select>
            {/* If 'other' is selected, show a text input for custom variant */}
            {formData.variant === 'other' && (
              <input
                type="text"
                name="variantOther"
                value={formData.variantOther}
                onChange={e => setFormData(prev => ({ ...prev, variantOther: e.target.value, variant: 'other' }))}
                required
                placeholder="Enter custom variant"
                className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              />
            )}
          </div>
        )}

        {/* Threshold Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Threshold Value</label>
          <input
            type="number"
            name="thresholdValue"
            value={formData.thresholdValue}
            onChange={handleChange}
            min="0"
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Sub Category</label>
          <input
            type="text"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {product ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
