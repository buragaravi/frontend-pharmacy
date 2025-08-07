import React, { useState, useEffect } from 'react';
import axios from 'axios';

// SVG Icons
const FlaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.618v.786a2 2 0 002 2h12a2 2 0 002-2v-.786c0-.824-.393-1.596-1.072-2.19z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const QuotationForm = ({ userRole, userId, labId }) => {
  const [quotationType, setQuotationType] = useState('chemicals');
  const [chemicals, setChemicals] = useState([
    { chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' },
  ]);
  const [equipment, setEquipment] = useState([
    { equipmentName: '', quantity: 0, unit: '', pricePerUnit: 0, specifications: '', remarks: '' },
  ]);
  const [glassware, setGlassware] = useState([
    { glasswareName: '', quantity: 0, unit: '', pricePerUnit: 0, condition: 'new', remarks: '' },
  ]);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [availableGlassware, setAvailableGlassware] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [comments, setComments] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        // Fetch chemicals
        const chemRes = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableChemicals(chemRes.data.sort((a, b) => a.chemicalName.localeCompare(b.chemicalName)));

        // Fetch equipment
        const equipRes = await axios.get('https://backend-pharmacy-5541.onrender.com/api/equipment/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableEquipment(equipRes.data.sort((a, b) => a.name.localeCompare(b.name)));

        // Fetch glassware
        const glassRes = await axios.get('https://backend-pharmacy-5541.onrender.com/api/glassware/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableGlassware(glassRes.data.sort((a, b) => a.name.localeCompare(b.name)));
        
      } catch (err) {
        console.error('Failed to fetch available items', err);
      }
    };

    fetchAvailableItems();
  }, [token]);

  // Helper: get suggestions for item names
  const getChemicalSuggestions = (input) => {
    if (!input) return [];
    return availableChemicals.filter(chem =>
      chem.chemicalName.toLowerCase().includes(input.toLowerCase())
    );
  };

  const getEquipmentSuggestions = (input) => {
    if (!input) return [];
    return availableEquipment.filter(eq =>
      eq.name.toLowerCase().includes(input.toLowerCase())
    );
  };

  const getGlasswareSuggestions = (input) => {
    if (!input) return [];
    return availableGlassware.filter(glass =>
      glass.name.toLowerCase().includes(input.toLowerCase())
    );
  };

  const handleChemicalChange = (index, field, value) => {
    const updated = [...chemicals];
    updated[index][field] = value;
    setChemicals(updated);
  };

  const handleEquipmentChange = (index, field, value) => {
    const updated = [...equipment];
    updated[index][field] = value;
    setEquipment(updated);
  };

  const handleGlasswareChange = (index, field, value) => {
    const updated = [...glassware];
    updated[index][field] = value;
    setGlassware(updated);
  };

  const addChemical = () => {
    setChemicals([...chemicals, { chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' }]);
  };

  const addEquipment = () => {
    setEquipment([...equipment, { equipmentName: '', quantity: 0, unit: '', pricePerUnit: 0, specifications: '', remarks: '' }]);
  };

  const addGlassware = () => {
    setGlassware([...glassware, { glasswareName: '', quantity: 0, unit: '', pricePerUnit: 0, condition: 'new', remarks: '' }]);
  };

  const removeChemical = (index) => {
    if (chemicals.length > 1) {
      setChemicals(chemicals.filter((_, i) => i !== index));
    }
  };

  const removeEquipment = (index) => {
    if (equipment.length > 1) {
      setEquipment(equipment.filter((_, i) => i !== index));
    }
  };

  const removeGlassware = (index) => {
    if (glassware.length > 1) {
      setGlassware(glassware.filter((_, i) => i !== index));
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    chemicals.forEach(chem => {
      const price = parseFloat(chem.pricePerUnit || 0);
      const qty = parseFloat(chem.quantity || 0);
      total += price * qty;
    });
    
    equipment.forEach(eq => {
      const price = parseFloat(eq.pricePerUnit || 0);
      const qty = parseFloat(eq.quantity || 0);
      total += price * qty;
    });
    
    glassware.forEach(glass => {
      const price = parseFloat(glass.pricePerUnit || 0);
      const qty = parseFloat(glass.quantity || 0);
      total += price * qty;
    });
    
    return total.toFixed(2);
  };

  const validateForm = () => {
    // Check if at least one item type has items
    const hasChemicals = chemicals.some(c => c.chemicalName.trim());
    const hasEquipment = equipment.some(e => e.equipmentName.trim());
    const hasGlassware = glassware.some(g => g.glasswareName.trim());
    
    if (!hasChemicals && !hasEquipment && !hasGlassware) {
      setMessage({ text: 'At least one item is required', type: 'error' });
      return false;
    }

    // Validate chemicals
    if (hasChemicals && chemicals.some(chem => chem.chemicalName.trim() && (!chem.quantity || parseFloat(chem.quantity) <= 0))) {
      setMessage({ text: 'Valid positive quantity is required for all chemicals', type: 'error' });
      return false;
    }

    // Validate equipment
    if (hasEquipment && equipment.some(eq => eq.equipmentName.trim() && (!eq.quantity || parseFloat(eq.quantity) <= 0))) {
      setMessage({ text: 'Valid positive quantity is required for all equipment', type: 'error' });
      return false;
    }

    // Validate glassware
    if (hasGlassware && glassware.some(glass => glass.glasswareName.trim() && (!glass.quantity || parseFloat(glass.quantity) <= 0))) {
      setMessage({ text: 'Valid positive quantity is required for all glassware', type: 'error' });
      return false;
    }

    return true;
  };

  const preparePayload = () => {
    const payload = {
      createdBy: userId,
      createdByRole: userRole,
      quotationType: quotationType,
      status: userRole === 'lab_assistant' ? 'pending' : 'draft',
      ...(userRole === 'lab_assistant' && { labId })
    };

    // Add items based on what's filled
    if (chemicals.some(c => c.chemicalName.trim())) {
      payload.chemicals = chemicals
        .filter(chem => chem.chemicalName.trim())
        .map(chem => ({
          chemicalName: chem.chemicalName,
          quantity: parseFloat(chem.quantity),
          unit: chem.unit,
          remarks: typeof chem.remarks === 'string' ? chem.remarks.trim() : '',
          ...(userRole === 'central_store_admin' && { pricePerUnit: parseFloat(chem.pricePerUnit) })
        }));
    }

    if (equipment.some(e => e.equipmentName.trim())) {
      payload.equipment = equipment
        .filter(eq => eq.equipmentName.trim())
        .map(eq => ({
          equipmentName: eq.equipmentName,
          quantity: parseFloat(eq.quantity),
          unit: eq.unit,
          specifications: eq.specifications || '',
          remarks: typeof eq.remarks === 'string' ? eq.remarks.trim() : '',
          ...(userRole === 'central_store_admin' && { pricePerUnit: parseFloat(eq.pricePerUnit) })
        }));
    }

    if (glassware.some(g => g.glasswareName.trim())) {
      payload.glassware = glassware
        .filter(glass => glass.glasswareName.trim())
        .map(glass => ({
          glasswareName: glass.glasswareName,
          quantity: parseFloat(glass.quantity),
          unit: glass.unit,
          condition: glass.condition,
          remarks: typeof glass.remarks === 'string' ? glass.remarks.trim() : '',
          ...(userRole === 'central_store_admin' && { pricePerUnit: parseFloat(glass.pricePerUnit) })
        }));
    }

    if (userRole === 'central_store_admin') {
      payload.totalPrice = parseFloat(calculateTotalPrice());
    }

    if (comments) {
      payload.comments = comments;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = preparePayload();
      const endpoint = userRole === 'lab_assistant' 
        ? '/api/quotations/lab' 
        : '/api/quotations/central/draft';

      await axios.post(`https://backend-pharmacy-5541.onrender.com${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMessage({ 
        text: userRole === 'lab_assistant' 
          ? 'Quotation request submitted for approval!' 
          : 'Draft quotation created successfully!', 
        type: 'success' 
      });

      // Reset form
      setChemicals([{ chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' }]);
      setEquipment([{ equipmentName: '', quantity: 0, unit: '', pricePerUnit: 0, specifications: '', remarks: '' }]);
      setGlassware([{ glasswareName: '', quantity: 0, unit: '', pricePerUnit: 0, condition: 'new', remarks: '' }]);
      setComments('');
      setQuotationType('chemicals');
    } catch (err) {
      console.error('Quotation creation failed:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to create quotation', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-2xl shadow-lg">
          <FlaskIcon className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1976D2]">
            {userRole === 'lab_assistant' ? 'Request Items' : 'Create Quotation'}
          </h3>
          <p className="text-[#2196F3] text-sm">
            {userRole === 'lab_assistant' 
              ? 'Submit item requirements'
              : 'Create item quotation'
            }
          </p>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-2xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {message.type === 'success' && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {message.type === 'error' && (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="font-medium text-sm">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Quotation Type Selector */}
        <div className="bg-white rounded-2xl border border-[#2196F3]/20 p-5 shadow-sm w-full">
          <label className="block text-sm font-semibold text-[#1976D2] mb-3">
            Quotation Type
          </label>
          <select
            value={quotationType}
            onChange={(e) => setQuotationType(e.target.value)}
            className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200"
          >
            <option value="chemicals">Chemicals Only</option>
            <option value="equipment">Equipment Only</option>
            <option value="glassware">Glassware Only</option>
            <option value="mixed">Mixed Items</option>
          </select>
        </div>

        {/* Chemicals Section */}
        {(quotationType === 'chemicals' || quotationType === 'mixed') && (
          <div className="space-y-5 w-full">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-[#1976D2] flex items-center">
                <FlaskIcon className="mr-2 w-5 h-5" />
                Chemical Details
              </h4>
              <span className="text-sm text-[#2196F3] bg-[#E3F2FD] px-3 py-1 rounded-full font-medium">
                {chemicals.length} item{chemicals.length !== 1 ? 's' : ''}
              </span>
            </div>

          {chemicals.map((chem, index) => (
            <div key={index} className={`relative bg-white rounded-2xl border-2 transition-all duration-200 shadow-sm ${
              chem.isMissingChemical 
                ? 'border-[#2196F3] bg-blue-50/30' 
                : 'border-[#2196F3]/20 hover:border-[#2196F3]/40'
            } w-full`}>
              {chem.isMissingChemical && (
                <div className="absolute -top-3 -right-3 bg-[#2196F3] text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                  Pre-filled
                </div>
              )}
              
              <div className="p-5 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4 w-full">
                  {/* Chemical Name */}
                  <div className="relative w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      Chemical Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter chemical name"
                      value={chem.chemicalName}
                      onChange={(e) => handleChemicalChange(index, 'chemicalName', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                      required
                      autoComplete="off"
                    />
                    
                    {/* Suggestion Dropdown */}
                    {(chem.chemicalName && getChemicalSuggestions(chem.chemicalName).length > 0) && (
                      <div className="absolute z-20 bg-white border border-[#2196F3]/30 rounded-2xl shadow-lg w-full mt-2 max-h-40 overflow-y-auto">
                        {getChemicalSuggestions(chem.chemicalName).map((suggestion) => (
                          <div
                            key={suggestion.chemicalName}
                            className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm flex justify-between items-center transition-colors duration-200 border-b border-[#2196F3]/10 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                            onClick={() => handleSuggestionClick(index, suggestion)}
                          >
                            <span className="font-medium text-[#1976D2]">{suggestion.chemicalName}</span>
                            <span className="text-xs text-[#2196F3] bg-blue-50 px-2 py-1 rounded-full">
                              Qty: {suggestion.quantity} {suggestion.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Low Quantity Suggestions */}
                    {availableChemicals.filter(chem => chem.quantity <= 10).length > 0 && index === 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-[#2196F3] mb-2 font-medium">💡 Suggested (low stock):</p>
                        <div className="flex flex-wrap gap-2">
                          {availableChemicals.filter(chem => chem.quantity <= 10).slice(0, 3).map((chemical) => (
                            <button
                              key={chemical._id}
                              type="button"
                              onClick={() => handleSuggestionClick(index, chemical)}
                              className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full hover:bg-amber-200 transition-all duration-200 border border-amber-300/50"
                              title={`Only ${chemical.quantity} remaining`}
                            >
                              {chemical.chemicalName} ({chemical.unit})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={chem.quantity}
                      onChange={(e) => handleChemicalChange(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                      required
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ml, g, kg, etc."
                      value={chem.unit}
                      onChange={(e) => handleChemicalChange(index, 'unit', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                      required
                    />
                  </div>

                  {/* Price Per Unit */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      {userRole === 'central_store_admin' ? 'Price/Unit *' : 'Price/Unit'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2196F3] font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={chem.pricePerUnit}
                        onChange={(e) => handleChemicalChange(index, 'pricePerUnit', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm disabled:bg-gray-50"
                        required={userRole === 'central_store_admin'}
                        disabled={userRole === 'lab_assistant'}
                      />
                    </div>
                  </div>
                </div>

                {/* Chemical Remarks */}
                <div className="mt-4 w-full">
                  <label className="block text-sm font-medium text-[#1976D2] mb-2 flex items-center">
                    <CommentIcon className="mr-2 w-4 h-4" />
                    Remarks
                  </label>
                  <textarea
                    placeholder="Add notes or comments for this chemical..."
                    value={chem.remarks}
                    onChange={(e) => handleChemicalChange(index, 'remarks', e.target.value)}
                    className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 resize-none text-sm"
                    rows="2"
                  />
                </div>

                {/* Remove Chemical Button */}
                {chemicals.length > 1 && (
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="flex items-center text-red-600 text-sm hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-2xl transition-all duration-200 border border-red-200"
                    >
                      <TrashIcon className="mr-2 w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Chemical Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addChemical}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] text-[#1976D2] rounded-2xl font-medium hover:from-[#2196F3] hover:to-[#1976D2] hover:text-white transition-all duration-200 border border-[#2196F3]/30 hover:border-[#2196F3] shadow-sm"
            >
              <AddIcon className="w-5 h-5" />
              <span>Add Chemical</span>
            </button>
          </div>
        </div>
        )}

        {/* Equipment Section */}
        {(quotationType === 'equipment' || quotationType === 'mixed') && (
          <div className="space-y-5 w-full">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-[#1976D2] flex items-center">
                <EquipmentIcon className="mr-3 w-5 h-5" />
                Equipment Items
                <span className="ml-3 px-2 py-1 bg-[#E3F2FD] text-[#2196F3] rounded-full text-xs font-medium">
                  {equipment.length}
                </span>
              </h4>
            </div>

            {equipment.map((eq, index) => (
              <div key={index} className="relative bg-white rounded-2xl border-2 border-[#2196F3]/20 hover:border-[#2196F3]/40 transition-all duration-200 shadow-sm w-full">
                <div className="p-5 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4 w-full">
                    {/* Equipment Name */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Equipment Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter equipment name"
                        value={eq.equipmentName}
                        onChange={(e) => handleEquipmentChange(index, 'equipmentName', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={eq.quantity}
                        onChange={(e) => handleEquipmentChange(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={eq.unit}
                        onChange={(e) => handleEquipmentChange(index, 'unit', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 text-sm"
                        required
                      >
                        <option value="">Select unit</option>
                        <option value="piece">Piece</option>
                        <option value="set">Set</option>
                        <option value="unit">Unit</option>
                        <option value="kit">Kit</option>
                      </select>
                    </div>

                    {/* Price Per Unit */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        {userRole === 'central_store_admin' ? 'Price/Unit *' : 'Price/Unit'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2196F3] font-medium">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={eq.pricePerUnit}
                          onChange={(e) => handleEquipmentChange(index, 'pricePerUnit', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm disabled:bg-gray-50"
                          required={userRole === 'central_store_admin'}
                          disabled={userRole === 'lab_assistant'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="mb-4 w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      Specifications
                    </label>
                    <textarea
                      placeholder="Equipment specifications and requirements..."
                      value={eq.specifications}
                      onChange={(e) => handleEquipmentChange(index, 'specifications', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 resize-none text-sm"
                      rows="2"
                    />
                  </div>

                  {/* Equipment Remarks */}
                  <div className="mt-4 w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2 flex items-center">
                      <CommentIcon className="mr-2 w-4 h-4" />
                      Remarks
                    </label>
                    <textarea
                      placeholder="Add notes or comments for this equipment..."
                      value={eq.remarks}
                      onChange={(e) => handleEquipmentChange(index, 'remarks', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 resize-none text-sm"
                      rows="2"
                    />
                  </div>

                  {/* Remove Equipment Button */}
                  {equipment.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        className="flex items-center text-red-600 text-sm hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-2xl transition-all duration-200 border border-red-200"
                      >
                        <TrashIcon className="mr-2 w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Equipment Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addEquipment}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] text-[#1976D2] rounded-2xl font-medium hover:from-[#2196F3] hover:to-[#1976D2] hover:text-white transition-all duration-200 border border-[#2196F3]/30 hover:border-[#2196F3] shadow-sm"
              >
                <AddIcon className="w-5 h-5" />
                <span>Add Equipment</span>
              </button>
            </div>
          </div>
        )}

        {/* Glassware Section */}
        {(quotationType === 'glassware' || quotationType === 'mixed') && (
          <div className="space-y-5 w-full">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-[#1976D2] flex items-center">
                <GlasswareIcon className="mr-3 w-5 h-5" />
                Glassware Items
                <span className="ml-3 px-2 py-1 bg-[#E3F2FD] text-[#2196F3] rounded-full text-xs font-medium">
                  {glassware.length}
                </span>
              </h4>
            </div>

            {glassware.map((glass, index) => (
              <div key={index} className="relative bg-white rounded-2xl border-2 border-[#2196F3]/20 hover:border-[#2196F3]/40 transition-all duration-200 shadow-sm w-full">
                <div className="p-5 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4 w-full">
                    {/* Glassware Name */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Glassware Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter glassware name"
                        value={glass.glasswareName}
                        onChange={(e) => handleGlasswareChange(index, 'glasswareName', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={glass.quantity}
                        onChange={(e) => handleGlasswareChange(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={glass.unit}
                        onChange={(e) => handleGlasswareChange(index, 'unit', e.target.value)}
                        className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 text-sm"
                        required
                      >
                        <option value="">Select unit</option>
                        <option value="piece">Piece</option>
                        <option value="set">Set</option>
                        <option value="ml">mL</option>
                        <option value="l">L</option>
                        <option value="kit">Kit</option>
                      </select>
                    </div>

                    {/* Price Per Unit */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-[#1976D2] mb-2">
                        {userRole === 'central_store_admin' ? 'Price/Unit *' : 'Price/Unit'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2196F3] font-medium">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={glass.pricePerUnit}
                          onChange={(e) => handleGlasswareChange(index, 'pricePerUnit', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm disabled:bg-gray-50"
                          required={userRole === 'central_store_admin'}
                          disabled={userRole === 'lab_assistant'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="mb-4 w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2">
                      Condition
                    </label>
                    <select
                      value={glass.condition}
                      onChange={(e) => handleGlasswareChange(index, 'condition', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="replacement">Replacement</option>
                    </select>
                  </div>

                  {/* Glassware Remarks */}
                  <div className="mt-4 w-full">
                    <label className="block text-sm font-medium text-[#1976D2] mb-2 flex items-center">
                      <CommentIcon className="mr-2 w-4 h-4" />
                      Remarks
                    </label>
                    <textarea
                      placeholder="Add notes or comments for this glassware..."
                      value={glass.remarks}
                      onChange={(e) => handleGlasswareChange(index, 'remarks', e.target.value)}
                      className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 resize-none text-sm"
                      rows="2"
                    />
                  </div>

                  {/* Remove Glassware Button */}
                  {glassware.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => removeGlassware(index)}
                        className="flex items-center text-red-600 text-sm hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-2xl transition-all duration-200 border border-red-200"
                      >
                        <TrashIcon className="mr-2 w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Glassware Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addGlassware}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] text-[#1976D2] rounded-2xl font-medium hover:from-[#2196F3] hover:to-[#1976D2] hover:text-white transition-all duration-200 border border-[#2196F3]/30 hover:border-[#2196F3] shadow-sm"
              >
                <AddIcon className="w-5 h-5" />
                <span>Add Glassware</span>
              </button>
            </div>
          </div>
        )}

        {/* General Comments */}
        <div className="bg-white rounded-2xl border border-[#2196F3]/20 p-5 shadow-sm w-full">
          <label className="block text-sm font-medium text-[#1976D2] mb-3 flex items-center">
            <CommentIcon className="mr-2 w-4 h-4" />
            General Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-4 py-3 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 resize-none text-sm"
            placeholder="Additional comments for the quotation..."
            rows="3"
          />
        </div>

        {/* Total Price Summary - Central Store Admin Only */}
        {userRole === 'central_store_admin' && (
          <div className="bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] rounded-2xl border border-[#2196F3]/30 p-5 shadow-sm">
            <h4 className="text-md font-semibold text-[#1976D2] mb-3 flex items-center">
              💰 Summary
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-[#2196F3] font-medium text-sm">Total Price:</span>
              <span className="text-xl font-bold text-[#1976D2]">₹{calculateTotalPrice()}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-6 w-full">
          <button
            type="submit"
            disabled={loading}
            className={`w-full max-w-md px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg ${
              loading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white hover:from-[#1976D2] hover:to-[#1565C0] hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <FlaskIcon className="w-5 h-5" />
                <span>{userRole === 'lab_assistant' ? 'Submit Request' : 'Create Draft'}</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;