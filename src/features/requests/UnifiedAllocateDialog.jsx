import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import EquipmentQRScanner from '../equipment/EquipmentQRScanner';

const THEME = {
  card: 'bg-white',
  border: 'border-[#BCE0FD]',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-[#0B3861] focus:border-[#0B3861]'
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
        return updated;      } else {
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
        <div key={exp._id} className="mb-2">
          <div className="font-semibold text-sm mb-1">{exp.experimentName}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exp.chemicals?.map(chem => (
              <div key={chem._id} className="flex items-center gap-2 border p-2 rounded">
                <span className="flex-1">{chem.chemicalName} ({chem.quantity} {chem.unit})</span>
                {chem.isAllocated ? (
                  <span className="text-green-600 text-xs font-semibold">Allocated</span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={chem.quantity}
                    placeholder="Qty"
                    className="w-20 border rounded px-2 py-1 text-xs"
                    value={chemicals.find(c => c.chemicalMasterId === chem.chemicalMasterId && c.experimentId === exp._id)?.quantity || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setChemicals(prev => {
                        const filtered = prev.filter(c => !(c.chemicalMasterId === chem.chemicalMasterId && c.experimentId === exp._id));
                        return val > 0 ? [...filtered, { experimentId: exp._id, chemicalMasterId: chem.chemicalMasterId, quantity: val }] : filtered;
                      });
                    }}
                  />
                )}
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
        <div key={exp._id} className="mb-2">
          <div className="font-semibold text-sm mb-1">{exp.experimentName}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">            {exp.glassware?.map(glass => (
              <div key={glass._id} className="flex items-center gap-2 border p-2 rounded">
                <span className="flex-1">{glass.name || glass.glasswareName || 'N/A'} ({glass.quantity})</span>
                {glass.isAllocated ? (
                  <span className="text-green-600 text-xs font-semibold">Allocated</span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={glass.quantity}
                    placeholder="Qty"
                    className="w-20 border rounded px-2 py-1 text-xs"
                    value={glassware.find(g => g.glasswareId === glass.glasswareId && g.experimentId === exp._id)?.quantity || ''}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setGlassware(prev => {
                        const filtered = prev.filter(g => !(g.glasswareId === glass.glasswareId && g.experimentId === exp._id));
                        return val > 0 ? [...filtered, { experimentId: exp._id, glasswareId: glass.glasswareId, quantity: val }] : filtered;
                      });
                    }}
                  />
                )}
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
        <div key={exp._id} className="mb-2">
          <div className="font-semibold text-sm mb-1">{exp.experimentName}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exp.equipment?.map(eq => {
              const eqKey = `${exp._id}_${eq.name}_${eq.variant}`;
              const eqState = equipment.find(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant) || { itemIds: [] };
              const unfulfilled = eq.quantity - (eqState.itemIds?.length || 0);
              // Ensure we always have an array of length eq.quantity for itemIds
              const itemIdsArr = Array.from({ length: eq.quantity }, (_, i) => eqState.itemIds?.[i] || '');
              return (
                <div key={eq._id} className="border p-2 rounded flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="flex-1">{eq.name} ({eq.variant}) x {eq.quantity}</span>
                    {eq.isAllocated ? (
                      <span className="text-green-600 text-xs font-semibold">Allocated</span>
                    ) : null}
                  </div>
                  {!eq.isAllocated && (
                    <div className="flex flex-col gap-2 mt-1">
                      {itemIdsArr.map((itemId, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Enter Item ID #${idx + 1}`}
                            className="w-32 border rounded px-2 py-1 text-xs"
                            value={itemId}
                            onChange={e => {
                              const val = e.target.value.trim();
                              setEquipment(prev => {
                                const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                let newArr = prev.slice();
                                if (eqIdx === -1) {
                                  // Add new entry
                                  const itemIds = Array.from({ length: eq.quantity }, (_, i) => i === idx ? val : '');
                                  newArr.push({ experimentId: exp._id, name: eq.name, variant: eq.variant, itemIds });
                                } else {
                                  // Update existing
                                  const itemIds = (newArr[eqIdx].itemIds || Array(eq.quantity).fill('')).slice();
                                  itemIds[idx] = val;
                                  newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                }
                                return newArr;
                              });
                            }}
                          />
                          <button
                            className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs"
                            onClick={() => setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: !s[`${eqKey}_${idx}`] }))}
                          >
                            {scanning[`${eqKey}_${idx}`] ? 'Stop Scan' : 'Scan QR'}
                          </button>
                          {itemId && (
                            <button
                              className="ml-1 text-red-500 hover:text-red-700"
                              onClick={() => setEquipment(prev => {
                                const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                if (eqIdx === -1) return prev;
                                let newArr = prev.slice();
                                const itemIds = (newArr[eqIdx].itemIds || Array(eq.quantity).fill('')).slice();
                                itemIds[idx] = '';
                                newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                return newArr;
                              })}
                            >&#215;</button>
                          )}                          {scanning[`${eqKey}_${idx}`] && (
                            <div className="mt-2">
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
                          )}
                        </div>
                      ))}
                      <span className="text-xs text-gray-500 ml-2">Unfulfilled: {unfulfilled}</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${THEME.card} rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-6">
          <h3 className={`text-xl font-bold ${THEME.primaryText}`}>Allocate Request Items</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* TODO: Render allocation forms for chemicals, glassware, equipment */}
        <div className="flex flex-col gap-6">
          <div>
            <h4 className="font-semibold mb-2">Chemicals</h4>
            {renderChemicals()}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Glassware</h4>
            {renderGlassware()}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Equipment</h4>
            {renderEquipment()}
          </div>
        </div>
        <div className="flex justify-end mt-8 gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium">Cancel</button>
          <button onClick={handleAllocate} disabled={loading} className={`px-4 py-2 rounded ${THEME.primaryBg} text-white font-medium ${loading ? 'opacity-60' : ''}`}>Allocate</button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAllocateDialog;
