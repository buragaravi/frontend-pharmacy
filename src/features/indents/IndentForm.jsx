// IndentForm.jsx - Enhanced to support chemicals, equipment, and glassware
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

const IndentForm = ({ userRole, userId, labId }) => {
  const [indentType, setIndentType] = useState('chemicals');
  const [chemicals, setChemicals] = useState([
    { chemicalName: '', quantity: 0, unit: '', remarks: '' },
  ]);
  const [equipment, setEquipment] = useState([
    { equipmentName: '', quantity: 0, unit: '', specifications: '', remarks: '' },
  ]);
  const [glassware, setGlassware] = useState([
    { glasswareName: '', quantity: 0, unit: '', condition: 'new', remarks: '' },
  ]);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [availableGlassware, setAvailableGlassware] = useState([]);
  const [lowQuantityChemicals, setLowQuantityChemicals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [comments, setComments] = useState('');
  const [missingChemicalsLoaded, setMissingChemicalsLoaded] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        // Fetch chemicals
        const chemRes = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedChemicals = chemRes.data.sort((a, b) => a.chemicalName.localeCompare(b.chemicalName));
        setAvailableChemicals(sortedChemicals);
        const lowQuantity = sortedChemicals.filter(chem => chem.quantity < 100);
        setLowQuantityChemicals(lowQuantity);

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

  useEffect(() => {
    // Load missing items from localStorage only for lab assistants
    if (!missingChemicalsLoaded && userRole === 'lab_assistant') {
      // Load missing chemicals
      const missingChemicals = JSON.parse(localStorage.getItem('indentMissingChemicals')) || [];
      
      // Load missing equipment
      const missingEquipment = JSON.parse(localStorage.getItem('indentMissingEquipment')) || [];
      
      // Load missing glassware
      const missingGlassware = JSON.parse(localStorage.getItem('indentMissingGlassware')) || [];

      let hasPrefilledItems = false;
      let messageText = 'Missing items have been pre-filled:';

      // Pre-fill chemicals
      if (missingChemicals.length > 0) {
        const initialChemicals = missingChemicals.map(chem => ({
          chemicalName: chem.chemicalName,
          quantity: chem.requiredQuantity || 1,
          unit: chem.unit || '',
          remarks: '',
          isMissingChemical: true
        }));
        setChemicals([...initialChemicals, { chemicalName: '', quantity: 0, unit: '', remarks: '' }]);
        hasPrefilledItems = true;
        messageText += ` ${missingChemicals.length} chemicals`;
      }

      // Pre-fill equipment
      if (missingEquipment.length > 0) {
        const initialEquipment = missingEquipment.map(eq => ({
          equipmentName: eq.equipmentName || eq.name,
          quantity: eq.requiredQuantity || 1,
          unit: eq.unit || 'pieces',
          specifications: eq.specifications || '',
          remarks: '',
          isMissingEquipment: true
        }));
        setEquipment([...initialEquipment, { equipmentName: '', quantity: 0, unit: '', specifications: '', remarks: '' }]);
        hasPrefilledItems = true;
        messageText += hasPrefilledItems && missingChemicals.length > 0 ? `, ${missingEquipment.length} equipment` : ` ${missingEquipment.length} equipment`;
      }

      // Pre-fill glassware
      if (missingGlassware.length > 0) {
        const initialGlassware = missingGlassware.map(glass => ({
          glasswareName: glass.glasswareName || glass.name,
          quantity: glass.requiredQuantity || 1,
          unit: glass.unit || 'pieces',
          condition: glass.condition || 'new',
          remarks: '',
          isMissingGlassware: true
        }));
        setGlassware([...initialGlassware, { glasswareName: '', quantity: 0, unit: '', condition: 'new', remarks: '' }]);
        hasPrefilledItems = true;
        messageText += hasPrefilledItems && (missingChemicals.length > 0 || missingEquipment.length > 0) ? `, ${missingGlassware.length} glassware` : ` ${missingGlassware.length} glassware`;
      }

      // Set appropriate tab if items were pre-filled
      if (hasPrefilledItems) {
        if (missingChemicals.length > 0) {
          setIndentType('chemicals');
        } else if (missingEquipment.length > 0) {
          setIndentType('equipment');
        } else if (missingGlassware.length > 0) {
          setIndentType('glassware');
        }

        setMissingChemicalsLoaded(true);
        messageText += '. Please complete the information.';
        setMessage({
          text: messageText,
          type: 'info'
        });

        // Clear localStorage after loading
        localStorage.removeItem('indentMissingChemicals');
        localStorage.removeItem('indentMissingEquipment');
        localStorage.removeItem('indentMissingGlassware');
      }
    }
  }, [userRole, missingChemicalsLoaded]);

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
    // If user is typing chemicalName, try to auto-fill unit if available
    if (field === 'chemicalName') {
      const match = availableChemicals.find(c => c.chemicalName.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        updated[index].unit = match.unit;
      }
    }
    setChemicals(updated);
  };

  const handleEquipmentChange = (index, field, value) => {
    const updated = [...equipment];
    updated[index][field] = value;
    if (field === 'equipmentName') {
      const match = availableEquipment.find(eq => eq.name.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        updated[index].unit = match.unit || 'pieces';
      }
    }
    setEquipment(updated);
  };

  const handleGlasswareChange = (index, field, value) => {
    const updated = [...glassware];
    updated[index][field] = value;
    if (field === 'glasswareName') {
      const match = availableGlassware.find(glass => glass.name.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        updated[index].unit = match.unit || 'pieces';
      }
    }
    setGlassware(updated);
  };

  const handleChemicalSuggestionClick = (index, chemical) => {
    const updated = [...chemicals];
    updated[index] = {
      ...updated[index],
      chemicalName: chemical.chemicalName,
      unit: chemical.unit,
      quantity: updated[index].isMissingChemical ? updated[index].quantity : chemical.quantity,
      remarks: chemical.quantity < 100
        ? `Low stock alert: Only ${chemical.quantity} ${chemical.unit} remaining`
        : updated[index].remarks
    };
    setChemicals(updated);
  };

  const handleEquipmentSuggestionClick = (index, equipmentItem) => {
    const updated = [...equipment];
    updated[index] = {
      ...updated[index],
      equipmentName: equipmentItem.name,
      unit: equipmentItem.unit || 'pieces',
      specifications: equipmentItem.specifications || '',
    };
    setEquipment(updated);
  };

  const handleGlasswareSuggestionClick = (index, glasswareItem) => {
    const updated = [...glassware];
    updated[index] = {
      ...updated[index],
      glasswareName: glasswareItem.name,
      unit: glasswareItem.unit || 'pieces',
    };
    setGlassware(updated);
  };

  const addChemicalField = () => {
    setChemicals([
      ...chemicals,
      { chemicalName: '', quantity: 0, unit: '', remarks: '' },
    ]);
  };

  const addEquipmentField = () => {
    setEquipment([
      ...equipment,
      { equipmentName: '', quantity: 0, unit: '', specifications: '', remarks: '' },
    ]);
  };

  const addGlasswareField = () => {
    setGlassware([
      ...glassware,
      { glasswareName: '', quantity: 0, unit: '', condition: 'new', remarks: '' },
    ]);
  };

  const removeChemicalField = (index) => {
    if (chemicals.length === 1) return;
    const updated = chemicals.filter((_, i) => i !== index);
    setChemicals(updated);
  };

  const removeEquipmentField = (index) => {
    if (equipment.length === 1) return;
    const updated = equipment.filter((_, i) => i !== index);
    setEquipment(updated);
  };

  const removeGlasswareField = (index) => {
    if (glassware.length === 1) return;
    const updated = glassware.filter((_, i) => i !== index);
    setGlassware(updated);
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

    if (hasChemicals && chemicals.some(chem => chem.chemicalName.trim() && !chem.unit.trim())) {
      setMessage({ text: 'Unit is required for all chemicals', type: 'error' });
      return false;
    }

    // Validate equipment
    if (hasEquipment && equipment.some(eq => eq.equipmentName.trim() && (!eq.quantity || parseFloat(eq.quantity) <= 0))) {
      setMessage({ text: 'Valid positive quantity is required for all equipment', type: 'error' });
      return false;
    }

    if (hasEquipment && equipment.some(eq => eq.equipmentName.trim() && !eq.unit.trim())) {
      setMessage({ text: 'Unit is required for all equipment', type: 'error' });
      return false;
    }

    // Validate glassware
    if (hasGlassware && glassware.some(glass => glass.glasswareName.trim() && (!glass.quantity || parseFloat(glass.quantity) <= 0))) {
      setMessage({ text: 'Valid positive quantity is required for all glassware', type: 'error' });
      return false;
    }

    if (hasGlassware && glassware.some(glass => glass.glasswareName.trim() && !glass.unit.trim())) {
      setMessage({ text: 'Unit is required for all glassware', type: 'error' });
      return false;
    }

    return true;
  };

  const preparePayload = () => {
    const payload = {
      createdBy: userId,
      createdByRole: userRole,
      comments: comments || undefined,
      labId,
      status: 'pending'
    };

    // Add only non-empty items
    const validChemicals = chemicals.filter(chem => chem.chemicalName.trim());
    const validEquipment = equipment.filter(eq => eq.equipmentName.trim());
    const validGlassware = glassware.filter(glass => glass.glasswareName.trim());

    if (validChemicals.length > 0) {
      payload.chemicals = validChemicals.map(chem => ({
        chemicalName: chem.chemicalName,
        quantity: parseInt(chem.quantity),
        unit: chem.unit,
        remarks: typeof chem.remarks === 'string' ? chem.remarks.trim() : ''
      }));
    }

    if (validEquipment.length > 0) {
      payload.equipment = validEquipment.map(eq => ({
        equipmentName: eq.equipmentName,
        quantity: parseInt(eq.quantity),
        unit: eq.unit,
        specifications: typeof eq.specifications === 'string' ? eq.specifications.trim() : '',
        remarks: typeof eq.remarks === 'string' ? eq.remarks.trim() : ''
      }));
    }

    if (validGlassware.length > 0) {
      payload.glassware = validGlassware.map(glass => ({
        glasswareName: glass.glasswareName,
        quantity: parseInt(glass.quantity),
        unit: glass.unit,
        condition: glass.condition,
        remarks: typeof glass.remarks === 'string' ? glass.remarks.trim() : ''
      }));
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
      await axios.post('https://backend-pharmacy-5541.onrender.com/api/indents/lab', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({
        text: 'Indent submitted for approval!',
        type: 'success'
      });
      // Reset all forms
      setChemicals([{ chemicalName: '', quantity: 0, unit: '', remarks: '' }]);
      setEquipment([{ equipmentName: '', quantity: 0, unit: '', specifications: '', remarks: '' }]);
      setGlassware([{ glasswareName: '', quantity: 0, unit: '', condition: 'new', remarks: '' }]);
      setComments('');
      setMissingChemicalsLoaded(false);
    } catch (err) {
      console.error('Indent creation failed:', err);
      setMessage({
        text: err.response?.data?.message || 'Failed to create indent',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white backdrop-blur-sm border border-[#0B3861]/20 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#0B3861] mb-2">Create Indent Request</h3>
        <p className="text-gray-600">Request chemicals, equipment, or glassware for your lab</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Type Selection Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg">
          <button
            type="button"
            onClick={() => setIndentType('chemicals')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              indentType === 'chemicals'
                ? 'bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white shadow-md'
                : 'text-[#0B3861] hover:bg-white hover:shadow-sm'
            }`}
          >
            <FlaskIcon />
            <span>Chemicals</span>
            {chemicals.some(c => c.isMissingChemical) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {chemicals.filter(c => c.isMissingChemical).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIndentType('equipment')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              indentType === 'equipment'
                ? 'bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white shadow-md'
                : 'text-[#0B3861] hover:bg-white hover:shadow-sm'
            }`}
          >
            <EquipmentIcon />
            <span>Equipment</span>
            {equipment.some(e => e.isMissingEquipment) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {equipment.filter(e => e.isMissingEquipment).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIndentType('glassware')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              indentType === 'glassware'
                ? 'bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white shadow-md'
                : 'text-[#0B3861] hover:bg-white hover:shadow-sm'
            }`}
          >
            <GlasswareIcon />
            <span>Glassware</span>
            {glassware.some(g => g.isMissingGlassware) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {glassware.filter(g => g.isMissingGlassware).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Chemicals Section */}
        {indentType === 'chemicals' && (
          <div className="space-y-6 mb-6">
            <h4 className="text-lg font-semibold text-[#0B3861] flex items-center">
              <FlaskIcon className="mr-2" />
              Chemical Requests
            </h4>
            
            {/* Low quantity suggestions */}
            {lowQuantityChemicals.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-orange-800 mb-2">Low Stock Alerts</h5>
                <div className="flex flex-wrap gap-2">
                  {lowQuantityChemicals.map((chemical) => (
                    <button
                      key={chemical._id}
                      type="button"
                      onClick={() => handleChemicalSuggestionClick(0, chemical)}
                      className="text-xs px-3 py-1 bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors"
                      title={`Only ${chemical.quantity} ${chemical.unit} remaining`}
                    >
                      {chemical.chemicalName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chemicals.map((chem, index) => (
              <div key={index} className={`bg-gradient-to-r from-[#0B3861]/5 to-[#1E88E5]/5 rounded-lg p-4 border ${
                chem.isMissingChemical ? 'border-2 border-[#64B5F6] bg-gradient-to-r from-blue-50 to-blue-100' : 'border-[#0B3861]/20'
              }`}>
                {chem.isMissingChemical && (
                  <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">⚠️ Missing Chemical Item - Pre-filled from inventory check</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Chemical Name *</label>
                    <input
                      type="text"
                      placeholder="Enter chemical name"
                      value={chem.chemicalName}
                      onChange={(e) => handleChemicalChange(index, 'chemicalName', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                      autoComplete="off"
                    />
                    {/* Suggestion dropdown */}
                    {(chem.chemicalName && getChemicalSuggestions(chem.chemicalName).length > 0) && (
                      <div className="absolute z-10 bg-white border border-[#0B3861]/30 rounded-lg shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                        {getChemicalSuggestions(chem.chemicalName).map((suggestion) => (
                          <div
                            key={suggestion.chemicalName}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm flex justify-between"
                            onClick={() => handleChemicalSuggestionClick(index, suggestion)}
                          >
                            <span>{suggestion.chemicalName}</span>
                            <span className="text-xs text-gray-500">Qty: {suggestion.quantity} {suggestion.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={chem.quantity}
                      onChange={(e) => handleChemicalChange(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Unit *</label>
                    <input
                      type="text"
                      placeholder="Unit (ml, g, etc.)"
                      value={chem.unit}
                      onChange={(e) => handleChemicalChange(index, 'unit', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-[#0B3861] mb-1 flex items-center">
                    <CommentIcon className="mr-1" />
                    Remarks
                  </label>
                  <textarea
                    placeholder="Add any notes, instructions or comments..."
                    value={chem.remarks}
                    onChange={(e) => handleChemicalChange(index, 'remarks', e.target.value)}
                    className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                    rows="2"
                  />
                </div>
                {chemicals.length > 1 && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => removeChemicalField(index)}
                      className="flex items-center text-red-600 text-sm hover:text-red-800 transition-colors"
                    >
                      <TrashIcon className="mr-1" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addChemicalField}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#0B3861]/10 to-[#1E88E5]/10 text-[#0B3861] rounded-lg font-medium hover:from-[#0B3861]/20 hover:to-[#1E88E5]/20 transition-all duration-200 border border-[#0B3861]/20"
            >
              <AddIcon className="mr-2" />
              Add Another Chemical
            </button>
          </div>
        )}

        {/* Equipment Section */}
        {indentType === 'equipment' && (
          <div className="space-y-6 mb-6">
            <h4 className="text-lg font-semibold text-[#0B3861] flex items-center">
              <EquipmentIcon className="mr-2" />
              Equipment Requests
            </h4>
            
            {equipment.map((eq, index) => (
              <div key={index} className={`bg-gradient-to-r from-[#0B3861]/5 to-[#1E88E5]/5 rounded-lg p-4 border ${
                eq.isMissingEquipment ? 'border-2 border-[#64B5F6] bg-gradient-to-r from-blue-50 to-blue-100' : 'border-[#0B3861]/20'
              }`}>
                {eq.isMissingEquipment && (
                  <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">⚠️ Missing Equipment Item - Pre-filled from inventory check</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Equipment Name *</label>
                    <input
                      type="text"
                      placeholder="Enter equipment name"
                      value={eq.equipmentName}
                      onChange={(e) => handleEquipmentChange(index, 'equipmentName', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                      autoComplete="off"
                    />
                    {/* Suggestion dropdown */}
                    {(eq.equipmentName && getEquipmentSuggestions(eq.equipmentName).length > 0) && (
                      <div className="absolute z-10 bg-white border border-[#0B3861]/30 rounded-lg shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                        {getEquipmentSuggestions(eq.equipmentName).map((suggestion) => (
                          <div
                            key={suggestion.name}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                            onClick={() => handleEquipmentSuggestionClick(index, suggestion)}
                          >
                            <span>{suggestion.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      value={eq.quantity}
                      onChange={(e) => handleEquipmentChange(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Unit *</label>
                    <input
                      type="text"
                      placeholder="pieces, sets, etc."
                      value={eq.unit}
                      onChange={(e) => handleEquipmentChange(index, 'unit', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Specifications</label>
                    <textarea
                      placeholder="Technical specifications, model, etc."
                      value={eq.specifications}
                      onChange={(e) => handleEquipmentChange(index, 'specifications', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1 flex items-center">
                      <CommentIcon className="mr-1" />
                      Remarks
                    </label>
                    <textarea
                      placeholder="Additional notes or instructions..."
                      value={eq.remarks}
                      onChange={(e) => handleEquipmentChange(index, 'remarks', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      rows="2"
                    />
                  </div>
                </div>
                {equipment.length > 1 && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => removeEquipmentField(index)}
                      className="flex items-center text-red-600 text-sm hover:text-red-800 transition-colors"
                    >
                      <TrashIcon className="mr-1" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addEquipmentField}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#0B3861]/10 to-[#1E88E5]/10 text-[#0B3861] rounded-lg font-medium hover:from-[#0B3861]/20 hover:to-[#1E88E5]/20 transition-all duration-200 border border-[#0B3861]/20"
            >
              <AddIcon className="mr-2" />
              Add Another Equipment
            </button>
          </div>
        )}

        {/* Glassware Section */}
        {indentType === 'glassware' && (
          <div className="space-y-6 mb-6">
            <h4 className="text-lg font-semibold text-[#0B3861] flex items-center">
              <GlasswareIcon className="mr-2" />
              Glassware Requests
            </h4>
            
            {glassware.map((glass, index) => (
              <div key={index} className={`bg-gradient-to-r from-[#0B3861]/5 to-[#1E88E5]/5 rounded-lg p-4 border ${
                glass.isMissingGlassware ? 'border-2 border-[#64B5F6] bg-gradient-to-r from-blue-50 to-blue-100' : 'border-[#0B3861]/20'
              }`}>
                {glass.isMissingGlassware && (
                  <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">⚠️ Missing Glassware Item - Pre-filled from inventory check</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Glassware Name *</label>
                    <input
                      type="text"
                      placeholder="Enter glassware name"
                      value={glass.glasswareName}
                      onChange={(e) => handleGlasswareChange(index, 'glasswareName', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                      autoComplete="off"
                    />
                    {/* Suggestion dropdown */}
                    {(glass.glasswareName && getGlasswareSuggestions(glass.glasswareName).length > 0) && (
                      <div className="absolute z-10 bg-white border border-[#0B3861]/30 rounded-lg shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                        {getGlasswareSuggestions(glass.glasswareName).map((suggestion) => (
                          <div
                            key={suggestion.name}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                            onClick={() => handleGlasswareSuggestionClick(index, suggestion)}
                          >
                            <span>{suggestion.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      value={glass.quantity}
                      onChange={(e) => handleGlasswareChange(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Unit *</label>
                    <input
                      type="text"
                      placeholder="pieces, sets, etc."
                      value={glass.unit}
                      onChange={(e) => handleGlasswareChange(index, 'unit', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Condition</label>
                    <select
                      value={glass.condition}
                      onChange={(e) => handleGlasswareChange(index, 'condition', e.target.value)}
                      className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                    >
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-[#0B3861] mb-1 flex items-center">
                    <CommentIcon className="mr-1" />
                    Remarks
                  </label>
                  <textarea
                    placeholder="Additional notes or instructions..."
                    value={glass.remarks}
                    onChange={(e) => handleGlasswareChange(index, 'remarks', e.target.value)}
                    className="w-full px-4 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                    rows="2"
                  />
                </div>
                {glassware.length > 1 && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => removeGlasswareField(index)}
                      className="flex items-center text-red-600 text-sm hover:text-red-800 transition-colors"
                    >
                      <TrashIcon className="mr-1" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addGlasswareField}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#0B3861]/10 to-[#1E88E5]/10 text-[#0B3861] rounded-lg font-medium hover:from-[#0B3861]/20 hover:to-[#1E88E5]/20 transition-all duration-200 border border-[#0B3861]/20"
            >
              <AddIcon className="mr-2" />
              Add Another Glassware
            </button>
          </div>
        )}

        {/* General Comments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0B3861] mb-2 flex items-center">
            <CommentIcon className="mr-2" />
            General Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-4 py-3 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
            placeholder="Any additional comments for the entire indent request..."
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              loading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#0B3861] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#2196F3] text-white shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Submit Indent Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IndentForm;
