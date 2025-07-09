import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import EquipmentQRScanner from '../equipment/EquipmentQRScanner';

const THEME = {
  card: 'bg-white/95 backdrop-blur-md border border-[#BCE0FD]/30 shadow-xl',
  border: 'border-[#BCE0FD]/20',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  mutedText: 'text-gray-600',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputBg: 'bg-gray-50/80',
  inputBorder: 'border-[#BCE0FD]/30',
  inputFocus: 'focus:ring-2 focus:ring-[#0B3861]/20 focus:border-[#0B3861]',
  cardHover: 'hover:bg-gray-50/50 transition-colors duration-200'
};

const UnifiedAllocateDialog = ({ request, onClose, onSuccess }) => {
  const [chemicals, setChemicals] = useState([]); // [{ experimentId, chemicalMasterId, quantity }]
  const [glassware, setGlassware] = useState([]); // [{ experimentId, glasswareId, quantity }]
  const [equipment, setEquipment] = useState([]); // [{ experimentId, name, variant, itemIds: [] }]
  const [scanning, setScanning] = useState({}); // { [expId_name_variant]: true/false }
  const [loading, setLoading] = useState(false);

  // Helper to update equipment itemIds
  const handleAddEquipmentItemId = (experimentId, name, variant, itemId) => {
    setEquipment(prev => {
      const idx = prev.findIndex(e => e.experimentId === experimentId && e.name === name && e.variant === variant);
      if (idx !== -1) {
        const itemIds = prev[idx].itemIds.includes(itemId) ? prev[idx].itemIds : [...prev[idx].itemIds, itemId];
        const updated = [...prev];
        updated[idx] = { ...prev[idx], itemIds };
        return updated;
      } else {
        return [...prev, { experimentId, name, variant, itemIds: [itemId] }];
      }
    });
  };

  // Handler for allocation submit
  const handleAllocate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://backend-pharmacy-5541.onrender.com/api/requests/${request._id}/allocate-unified`,
        { chemicals, glassware, equipment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Allocation successful!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper: get experiment name by id
  const getExperimentName = (expId) => {
    const exp = request.experiments.find(e => e._id === expId || e.experimentId === expId);
    return exp ? exp.experimentName : '';
  };

  // --- CHEMICALS UI ---
  const renderChemicals = () => (
    <div className="space-y-2">
      {request.experiments.map(exp => (
        <div key={exp._id} className="space-y-2">
          <div className={`text-xs font-medium ${THEME.secondaryText} uppercase tracking-wide`}>
            {exp.experimentName}
          </div>
          <div className="space-y-2">
            {exp.chemicals?.map(chem => (
              <div key={chem._id} className={`flex items-center gap-2 ${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 ${THEME.cardHover}`}>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${THEME.primaryText}`}>{chem.chemicalName}</div>
                  <div className={`text-xs ${THEME.mutedText}`}>
                    Required: {chem.quantity} {chem.unit}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chem.isAllocated ? (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      Allocated
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={chem.quantity}
                        placeholder="Qty"
                        className={`w-20 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-2 py-1 text-xs ${THEME.inputFocus} transition-all`}
                        value={chemicals.find(c => c.chemicalMasterId === chem.chemicalMasterId && c.experimentId === exp._id)?.quantity || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setChemicals(prev => {
                            const filtered = prev.filter(c => !(c.chemicalMasterId === chem.chemicalMasterId && c.experimentId === exp._id));
                            return val > 0 ? [...filtered, { experimentId: exp._id, chemicalMasterId: chem.chemicalMasterId, quantity: val }] : filtered;
                          });
                        }}
                      />
                      <span className={`text-xs ${THEME.mutedText}`}>{chem.unit}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // --- GLASSWARE UI ---
  const renderGlassware = () => (
    <div className="space-y-2">
      {request.experiments.map(exp => (
        <div key={exp._id} className="space-y-2">
          <div className={`text-xs font-medium ${THEME.secondaryText} uppercase tracking-wide`}>
            {exp.experimentName}
          </div>
          <div className="space-y-2">
            {exp.glassware?.map(glass => (
              <div key={glass._id} className={`flex items-center gap-2 ${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 ${THEME.cardHover}`}>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${THEME.primaryText}`}>{glass.name || glass.glasswareName || 'N/A'}</div>
                  <div className={`text-xs ${THEME.mutedText}`}>
                    Required: {glass.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {glass.isAllocated ? (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      Allocated
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={glass.quantity}
                        placeholder="Qty"
                        className={`w-20 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-2 py-1 text-xs ${THEME.inputFocus} transition-all`}
                        value={glassware.find(g => g.glasswareId === glass.glasswareId && g.experimentId === exp._id)?.quantity || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setGlassware(prev => {
                            const filtered = prev.filter(g => !(g.glasswareId === glass.glasswareId && g.experimentId === exp._id));
                            return val > 0 ? [...filtered, { experimentId: exp._id, glasswareId: glass.glasswareId, quantity: val }] : filtered;
                          });
                        }}
                      />
                      <span className={`text-xs ${THEME.mutedText}`}>pcs</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // --- EQUIPMENT UI ---
  const renderEquipment = () => (
    <div className="space-y-2">
      {request.experiments.map(exp => (
        <div key={exp._id} className="space-y-2">
          <div className={`text-xs font-medium ${THEME.secondaryText} uppercase tracking-wide`}>
            {exp.experimentName}
          </div>
          <div className="space-y-2">
            {exp.equipment?.map(eq => {
              const eqKey = `${exp._id}_${eq.name}_${eq.variant}`;
              const eqState = equipment.find(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant) || { itemIds: [] };
              const unfulfilled = eq.quantity - (eqState.itemIds?.length || 0);
              // Ensure we always have an array of length eq.quantity for itemIds
              const itemIdsArr = Array.from({ length: eq.quantity }, (_, i) => eqState.itemIds?.[i] || '');
              return (
                <div key={eq._id} className={`${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${THEME.primaryText}`}>{eq.name}</div>
                      <div className={`text-xs ${THEME.mutedText}`}>{eq.variant} × {eq.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {eq.isAllocated ? (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          Allocated
                        </span>
                      ) : (
                        <div className={`text-xs ${THEME.mutedText} bg-white/50 px-2 py-1 rounded`}>
                          {unfulfilled} unfulfilled
                        </div>
                      )}
                    </div>
                  </div>
                  {!eq.isAllocated && (
                    <div className="space-y-2">
                      {itemIdsArr.map((itemId, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={`Item ID #${idx + 1}`}
                              className={`flex-1 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-3 py-2 text-xs ${THEME.inputFocus} transition-all`}
                              value={itemId}
                              onChange={e => {
                                const val = e.target.value.trim();
                                setEquipment(prev => {
                                  const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                  let newArr = prev.slice();
                                  if (eqIdx === -1) {
                                    const itemIds = Array.from({ length: eq.quantity }, (_, i) => i === idx ? val : '');
                                    newArr.push({ experimentId: exp._id, name: eq.name, variant: eq.variant, itemIds });
                                  } else {
                                    const itemIds = (newArr[eqIdx].itemIds || Array(eq.quantity).fill('')).slice();
                                    itemIds[idx] = val;
                                    newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                  }
                                  return newArr;
                                });
                              }}
                            />
                            <button
                              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                scanning[`${eqKey}_${idx}`] 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : `${THEME.secondaryBg} text-white hover:bg-[#42A5F5]`
                              }`}
                              onClick={() => setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: !s[`${eqKey}_${idx}`] }))}
                            >
                              {scanning[`${eqKey}_${idx}`] ? 'Stop' : 'QR'}
                            </button>
                            {itemId && (
                              <button
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                                onClick={() => setEquipment(prev => {
                                  const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                  if (eqIdx === -1) return prev;
                                  let newArr = prev.slice();
                                  const itemIds = (newArr[eqIdx].itemIds || Array(eq.quantity).fill('')).slice();
                                  itemIds[idx] = '';
                                  newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                  return newArr;
                                })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {scanning[`${eqKey}_${idx}`] && (
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999999] p-2 sm:p-4">
                              <div className="bg-white/95 backdrop-blur-md border border-[#BCE0FD]/30 shadow-xl rounded-lg p-3 sm:p-4 max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-auto">
                                <EquipmentQRScanner
                                  onScan={itemId => {
                                    // The EquipmentQRScanner already extracts the itemId string
                                    if (!itemId || typeof itemId !== 'string') {
                                      toast.error('Invalid QR code data');
                                      return;
                                    }
                                    
                                    // Update the specific input field that triggered the scan
                                    setEquipment(prev => {
                                      const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                      let newArr = prev.slice();
                                      if (eqIdx === -1) {
                                        const itemIds = Array.from({ length: eq.quantity }, (_, i) => i === idx ? itemId : '');
                                        newArr.push({ experimentId: exp._id, name: eq.name, variant: eq.variant, itemIds });
                                      } else {
                                        const itemIds = (newArr[eqIdx].itemIds || Array(eq.quantity).fill('')).slice();
                                        itemIds[idx] = itemId;
                                        newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                      }
                                      return newArr;
                                    });
                                    
                                    // Close the scanner for this specific input
                                    setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: false }));
                                    toast.success(`Equipment ID ${itemId} added successfully!`);
                                  }}
                                  onClose={() => setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: false }))}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[99999]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
    >
      <div className={`${THEME.card} rounded-xl max-w-7xl w-full p-4 sm:p-6 max-h-[95vh] overflow-hidden relative z-[99999]`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/50">
          <h3 className={`text-lg font-semibold ${THEME.primaryText}`}>Allocate Request Items</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-full p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] pr-2">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chemicals Section */}
            <div className={`${THEME.card} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium ${THEME.primaryText} mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Chemicals
              </h4>
              <div className="space-y-3">
                {renderChemicals()}
              </div>
            </div>

            {/* Glassware Section */}
            <div className={`${THEME.card} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium ${THEME.primaryText} mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Glassware
              </h4>
              <div className="space-y-3">
                {renderGlassware()}
              </div>
            </div>

            {/* Equipment Section */}
            <div className={`${THEME.card} rounded-lg p-4`}>
              <h4 className={`text-sm font-medium ${THEME.primaryText} mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Equipment
              </h4>
              <div className="space-y-3">
                {renderEquipment()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200/50 gap-3">
          <button 
            onClick={onClose} 
            className={`px-4 py-2 rounded-lg ${THEME.inputBg} ${THEME.mutedText} font-medium text-sm hover:bg-gray-200/80 transition-colors`}
          >
            Cancel
          </button>
          <button 
            onClick={handleAllocate} 
            disabled={loading} 
            className={`px-6 py-2 rounded-lg ${THEME.primaryBg} text-white font-medium text-sm hover:bg-[#1A365D] transition-colors ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Allocating...' : 'Allocate Items'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAllocateDialog;
