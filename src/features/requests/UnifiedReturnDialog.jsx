import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
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

const UnifiedReturnDialog = ({ request, onClose, onSuccess }) => {
  const [chemicals, setChemicals] = useState([]); // [{ experimentId, chemicalMasterId, quantity }]
  const [glassware, setGlassware] = useState([]); // [{ experimentId, glasswareId, quantity }]
  const [equipment, setEquipment] = useState([]); // [{ experimentId, name, variant, itemIds: [] }]
  const [scanning, setScanning] = useState({});
  const [loading, setLoading] = useState(false);

  // Handler for return submit
  const handleReturn = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare chemicals payload with proper chemical identification
      const chemicalsWithName = chemicals.map(c => {
        // Find the experiment and chemical to get the name and proper IDs
        const exp = request.experiments.find(e => e._id === c.experimentId || e.experimentId === c.experimentId);
        let chemName = c.chemicalName || ''; // Use stored name if available
        let finalChemicalMasterId = c.chemicalMasterId;
        
        if (exp && exp.chemicals) {
          // If we have uniqueKey, extract the index and find the exact chemical
          if (c.uniqueKey) {
            const keyParts = c.uniqueKey.split('_');
            const chemIndex = parseInt(keyParts[2]) || 0; // Extract index from uniqueKey
            const targetChem = exp.chemicals.filter(chem => chem.isAllocated && chem.allocatedQuantity > 0)[chemIndex];
            
            if (targetChem) {
              chemName = targetChem.chemicalName;
              finalChemicalMasterId = targetChem.chemicalMasterId;
            }
          }
          
          // Fallback: Try to find by chemicalId
          if (!chemName && c.chemicalId) {
            const chem = exp.chemicals.find(chem => chem._id === c.chemicalId);
            if (chem) {
              chemName = chem.chemicalName;
              finalChemicalMasterId = chem.chemicalMasterId;
            }
          }
          
          // Fallback: Try to find by chemicalMasterId if it exists
          if (!chemName && c.chemicalMasterId) {
            const chem = exp.chemicals.find(chem => chem.chemicalMasterId === c.chemicalMasterId);
            if (chem) {
              chemName = chem.chemicalName;
            }
          }
        }
        
        return { 
          experimentId: c.experimentId,
          chemicalMasterId: finalChemicalMasterId,
          chemicalId: c.chemicalId, // Include chemical ID for backend reference
          quantity: c.quantity,
          chemicalName: chemName,
          uniqueIdentifier: c.uniqueKey // Include unique key for debugging
        };
      });

      // Prepare glassware payload with proper glassware identification
      const glasswarePayload = glassware.map(g => {
        const exp = request.experiments.find(e => e._id === g.experimentId || e.experimentId === g.experimentId);
        let finalGlasswareId = g.glasswareId;
        
        if (exp && exp.glassware && !finalGlasswareId && g.glasswareItemId) {
          const glass = exp.glassware.find(glass => glass._id === g.glasswareItemId);
          if (glass) {
            finalGlasswareId = glass.glasswareId;
          }
        }
        
        return {
          experimentId: g.experimentId,
          glasswareId: finalGlasswareId,
          quantity: g.quantity
        };
      });
      
      // Debug: Log the payload before sending
      console.log('=== RETURN PAYLOAD DEBUG ===');
      console.log('Chemicals array:', chemicalsWithName);
      console.log('Glassware array:', glasswarePayload);
      console.log('Equipment array:', equipment);
      console.log('===========================');
      
      await axios.put(
        `https://backend-pharmacy-5541.onrender.com/api/requests/${request._id}/return-unified`,
        { 
          chemicals: chemicalsWithName, 
          glassware: glasswarePayload, 
          equipment 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await Swal.fire({
        icon: 'success',
        title: 'Return successful!',
        showConfirmButton: false,
        timer: 1500
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Return failed',
        text: err.response?.data?.msg || 'Return failed',
      });
    } finally {
      setLoading(false);
    }
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
            {exp.chemicals?.filter(chem => chem.isAllocated && (chem.allocatedQuantity > 0)).map((chem, chemIndex) => {
              // Create a unique key for each chemical input using index as well
              const uniqueKey = `${exp._id}_${chem._id}_${chemIndex}_${chem.chemicalMasterId || 'no-master-id'}`;
              
              return (
                <div key={uniqueKey} className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 ${THEME.cardHover}`}>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${THEME.primaryText}`}>{chem.chemicalName}</div>
                    <div className={`text-xs ${THEME.mutedText}`}>
                      Allocated: {chem.allocatedQuantity} {chem.unit}
                    </div>
                    {/* Show index for debugging duplicate names */}
                    <div className={`text-xs ${THEME.mutedText} opacity-60`}>
                      ID: {chem._id} | Index: #{chemIndex + 1}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2">
                    <input
                      type="number"
                      min={0}
                      max={chem.allocatedQuantity}
                      placeholder="Qty"
                      className={`w-20 sm:w-20 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-2 py-2 text-xs ${THEME.inputFocus} transition-all min-h-[40px]`}
                      value={
                        chemicals.find(c => 
                          c.experimentId === exp._id && 
                          ((c.chemicalMasterId && c.chemicalMasterId === chem.chemicalMasterId) || 
                           (c.chemicalId && c.chemicalId === chem._id) ||
                           (c.uniqueKey === uniqueKey))
                        )?.quantity || ''
                      }
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setChemicals(prev => {
                          // Remove any existing entry for this specific chemical using unique key
                          const filtered = prev.filter(c => c.uniqueKey !== uniqueKey);
                          
                          // Add new entry if value > 0
                          if (val > 0) {
                            const newEntry = {
                              experimentId: exp._id,
                              chemicalMasterId: chem.chemicalMasterId,
                              chemicalId: chem._id, // Always use chemical ID as primary identifier
                              uniqueKey: uniqueKey, // Use unique key as primary matcher
                              quantity: val,
                              chemicalName: chem.chemicalName,
                              chemicalIndex: chemIndex // Add index for additional uniqueness
                            };
                            return [...filtered, newEntry];
                          }
                          return filtered;
                        });
                      }}
                    />
                    <span className={`text-xs ${THEME.mutedText} min-w-[30px]`}>{chem.unit}</span>
                  </div>
                </div>
              );
            })}
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
            {exp.glassware?.filter(glass => {
              // More flexible filtering for glassware
              // Check if glass is allocated and has quantity in various places
              if (!glass.isAllocated) return false;
              
              // Check for allocatedQuantity on root object
              if (glass.allocatedQuantity > 0) return true;
              
              // Check for quantity in allocationHistory
              if (Array.isArray(glass.allocationHistory) && glass.allocationHistory.length > 0) {
                const lastAllocation = glass.allocationHistory[glass.allocationHistory.length - 1];
                if (lastAllocation.quantity > 0) return true;
              }
              
              // Fallback to quantity on root object
              if (glass.quantity > 0 && glass.allocatedQuantity === undefined) return true;
              
              return false;
            }).map(glass => {
              // Create a unique key for each glassware input
              const uniqueKey = `${exp._id}_${glass._id}_${glass.glasswareId || glass.glasswareMasterId || 'no-glassware-id'}`;
              
              return (
                <div key={uniqueKey} className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 ${THEME.cardHover}`}>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${THEME.primaryText}`}>{glass.glasswareName || glass.name}</div>
                    <div className={`text-xs ${THEME.mutedText}`}>
                      Allocated: {(() => {
                        // Show allocated quantity from various sources
                        if (glass.allocatedQuantity > 0) return glass.allocatedQuantity;
                        if (Array.isArray(glass.allocationHistory) && glass.allocationHistory.length > 0) {
                          const lastAllocation = glass.allocationHistory[glass.allocationHistory.length - 1];
                          return lastAllocation.quantity || 0;
                        }
                        return glass.quantity || 0;
                      })()}
                    </div>
                    {/* Debug info - remove in production */}
                    <div className={`text-xs ${THEME.mutedText} opacity-60`}>
                      ID: {glass._id} | History: {Array.isArray(glass.allocationHistory) ? glass.allocationHistory.length : 0} entries
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2">
                    <input
                      type="number"
                      min={0}
                      max={(() => {
                        // Calculate max quantity from various sources
                        if (glass.allocatedQuantity > 0) return glass.allocatedQuantity;
                        if (Array.isArray(glass.allocationHistory) && glass.allocationHistory.length > 0) {
                          const lastAllocation = glass.allocationHistory[glass.allocationHistory.length - 1];
                          return lastAllocation.quantity || 0;
                        }
                        return glass.quantity || 0;
                      })()}
                      placeholder="Qty"
                      className={`w-20 sm:w-20 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-2 py-2 text-xs ${THEME.inputFocus} transition-all min-h-[40px]`}
                      value={
                        glassware.find(g => 
                          g.experimentId === exp._id && 
                          ((g.glasswareId && (g.glasswareId === glass.glasswareId || g.glasswareId === glass.glasswareMasterId)) || 
                           (g.glasswareItemId && g.glasswareItemId === glass._id) ||
                           (!g.glasswareId && !g.glasswareItemId && g.uniqueKey === uniqueKey))
                        )?.quantity || ''
                      }
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setGlassware(prev => {
                          // Remove any existing entry for this specific glassware
                          const filtered = prev.filter(g => 
                            !(g.experimentId === exp._id && 
                              ((g.glasswareId && (g.glasswareId === glass.glasswareId || g.glasswareId === glass.glasswareMasterId)) || 
                               (g.glasswareItemId && g.glasswareItemId === glass._id) ||
                               (!g.glasswareId && !g.glasswareItemId && g.uniqueKey === uniqueKey)))
                          );
                          
                          // Add new entry if value > 0
                          if (val > 0) {
                            const newEntry = {
                              experimentId: exp._id,
                              glasswareId: glass.glasswareId || glass.glasswareMasterId,
                              glasswareItemId: glass._id, // Add glass item ID as backup
                              uniqueKey: uniqueKey, // Add unique key as fallback
                              quantity: val
                            };
                            return [...filtered, newEntry];
                          }
                          return filtered;
                        });
                      }}
                    />
                    <span className={`text-xs ${THEME.mutedText} min-w-[30px]`}>pcs</span>
                  </div>
                </div>
              );
            })}
            {/* Debug info - remove in production */}
            {(!exp.glassware || exp.glassware.length === 0) && (
              <div className={`text-xs ${THEME.mutedText} p-2 text-center`}>
                No glassware items found for this experiment
              </div>
            )}
            {exp.glassware && exp.glassware.length > 0 && 
             exp.glassware.filter(glass => glass.isAllocated && (glass.allocatedQuantity > 0 || (glass.quantity > 0 && glass.allocatedQuantity === undefined))).length === 0 && (
              <div className={`text-xs ${THEME.mutedText} p-2 text-center`}>
                No allocated glassware items available for return
              </div>
            )}
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
            {exp.equipment?.filter(eq => {
              // More flexible filtering for equipment
              // Check if equipment has allocated items either in allocationHistory or itemIds
              if (Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                return Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0;
              }
              // Fallback to itemIds or isAllocated
              return (eq.isAllocated && Array.isArray(eq.itemIds) && eq.itemIds.length > 0) ||
                     (eq.isAllocated && eq.allocatedQuantity > 0) ||
                     (Array.isArray(eq.itemIds) && eq.itemIds.length > 0);
            }).map(eq => {
              const eqKey = `${exp._id}_${eq.name}_${eq.variant}`;
              // Use last allocationHistory for itemIds
              let itemIdsArr = [];
              if (Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                itemIdsArr = lastAlloc.itemIds || [];
              } else {
                itemIdsArr = eq.itemIds || [];
              }
              
              // If no itemIds found, create placeholder based on allocated quantity
              if (itemIdsArr.length === 0 && eq.allocatedQuantity > 0) {
                itemIdsArr = Array(eq.allocatedQuantity).fill('');
              }
              
              const eqState = equipment.find(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant) || { itemIds: [] };
              
              return (
                <div key={eq._id} className={`${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-3 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${THEME.primaryText}`}>{eq.name}</div>
                      <div className={`text-xs ${THEME.mutedText}`}>{eq.variant}</div>
                    </div>
                    <div className={`text-xs ${THEME.mutedText} bg-white/50 px-2 py-1 rounded`}>
                      {itemIdsArr.length} items
                    </div>
                  </div>
                  <div className="space-y-2">
                    {itemIdsArr.length > 0 ? itemIdsArr.map((itemId, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Item ID #${idx + 1}`}
                            className={`flex-1 ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-3 py-2 text-xs ${THEME.inputFocus} transition-all min-h-[40px]`}
                            value={eqState.itemIds[idx] || itemId || ''}
                            onChange={e => {
                              const val = e.target.value.trim();
                              setEquipment(prev => {
                                const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                let newArr = prev.slice();
                                if (eqIdx === -1) {
                                  const itemIds = Array.from({ length: itemIdsArr.length }, (_, i) => i === idx ? val : (itemIdsArr[i] || ''));
                                  newArr.push({ experimentId: exp._id, name: eq.name, variant: eq.variant, itemIds });
                                } else {
                                  const itemIds = (newArr[eqIdx].itemIds || Array(itemIdsArr.length).fill('')).slice();
                                  itemIds[idx] = val;
                                  newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                }
                                return newArr;
                              });
                            }}
                          />
                          <div className="flex items-center gap-2 sm:gap-1">
                            <button
                              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[40px] min-w-[60px] ${
                                scanning[`${eqKey}_${idx}`] 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : `${THEME.secondaryBg} text-white hover:bg-[#42A5F5]`
                              }`}
                              onClick={() => setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: !s[`${eqKey}_${idx}`] }))}
                            >
                              {scanning[`${eqKey}_${idx}`] ? 'Stop' : 'QR'}
                            </button>
                            {(eqState.itemIds[idx] || itemId) && (
                              <button
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                                onClick={() => setEquipment(prev => {
                                  const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                  if (eqIdx === -1) return prev;
                                  let newArr = prev.slice();
                                  const itemIds = (newArr[eqIdx].itemIds || Array(itemIdsArr.length).fill('')).slice();
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
                        </div>
                        {scanning[`${eqKey}_${idx}`] && (
                          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999999] p-2 sm:p-4">
                            <div className="bg-white rounded-lg p-3 sm:p-4 max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-auto">
                              <EquipmentQRScanner
                                onScan={itemId => {
                                  // The EquipmentQRScanner already extracts the itemId string
                                  if (!itemId || typeof itemId !== 'string') {
                                    Swal.fire({
                                      icon: 'error',
                                      title: 'Invalid QR code data',
                                      text: 'Please scan a valid equipment QR code'
                                    });
                                    return;
                                  }
                                  
                                  // Update the specific input field that triggered the scan
                                  setEquipment(prev => {
                                    const eqIdx = prev.findIndex(e => e.experimentId === exp._id && e.name === eq.name && e.variant === eq.variant);
                                    let newArr = prev.slice();
                                    if (eqIdx === -1) {
                                      const itemIds = Array.from({ length: itemIdsArr.length }, (_, i) => i === idx ? itemId : (itemIdsArr[i] || ''));
                                      newArr.push({ experimentId: exp._id, name: eq.name, variant: eq.variant, itemIds });
                                    } else {
                                      const itemIds = (newArr[eqIdx].itemIds || Array(itemIdsArr.length).fill('')).slice();
                                      itemIds[idx] = itemId;
                                      newArr[eqIdx] = { ...newArr[eqIdx], itemIds };
                                    }
                                    return newArr;
                                  });
                                  
                                  // Close the scanner for this specific input
                                  setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: false }));
                                  
                                  // Show success message
                                  Swal.fire({
                                    icon: 'success',
                                    title: 'Equipment Scanned!',
                                    text: `Item ID ${itemId} added for return`,
                                    showConfirmButton: false,
                                    timer: 2000
                                  });
                                }}
                                onClose={() => setScanning(s => ({ ...s, [`${eqKey}_${idx}`]: false }))}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className={`text-xs ${THEME.mutedText} p-2 text-center`}>
                        No equipment items available for return
                      </div>
                    )}
                  </div>
                  {/* Debug info - remove in production */}
                  {itemIdsArr.length === 0 && (
                    <div className={`text-xs ${THEME.mutedText} p-2 text-center bg-yellow-50 rounded`}>
                      Equipment found but no item IDs available
                    </div>
                  )}
                </div>
              );
            })}
            {/* Debug info for no equipment */}
            {(!exp.equipment || exp.equipment.length === 0) && (
              <div className={`text-xs ${THEME.mutedText} p-2 text-center`}>
                No equipment items found for this experiment
              </div>
            )}
            {exp.equipment && exp.equipment.length > 0 && 
             exp.equipment.filter(eq => {
               if (Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                 const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                 return Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0;
               }
               return (eq.isAllocated && Array.isArray(eq.itemIds) && eq.itemIds.length > 0) ||
                      (eq.isAllocated && eq.allocatedQuantity > 0) ||
                      (Array.isArray(eq.itemIds) && eq.itemIds.length > 0);
             }).length === 0 && (
              <div className={`text-xs ${THEME.mutedText} p-2 text-center`}>
                No allocated equipment items available for return
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[999999]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
    >
      <div className={`${THEME.card} rounded-xl max-w-7xl w-full p-4 sm:p-6 max-h-[95vh] overflow-hidden relative z-[999999]`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200/50 gap-3 sm:gap-0">
          <h3 className={`text-base sm:text-lg font-semibold ${THEME.primaryText}`}>Return Request Items</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-full p-2 transition-colors self-start sm:self-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)] pr-1 sm:pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Chemicals Section */}
            <div className={`${THEME.card} rounded-lg p-3 sm:p-4`}>
              <h4 className={`text-xs sm:text-sm font-medium ${THEME.primaryText} mb-2 sm:mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Chemicals
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {renderChemicals()}
              </div>
            </div>

            {/* Glassware Section */}
            <div className={`${THEME.card} rounded-lg p-3 sm:p-4`}>
              <h4 className={`text-xs sm:text-sm font-medium ${THEME.primaryText} mb-2 sm:mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Glassware
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {renderGlassware()}
              </div>
            </div>

            {/* Equipment Section */}
            <div className={`${THEME.card} rounded-lg p-3 sm:p-4 lg:col-span-2 xl:col-span-1`}>
              <h4 className={`text-xs sm:text-sm font-medium ${THEME.primaryText} mb-2 sm:mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${THEME.secondaryBg}`}></div>
                Equipment
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {renderEquipment()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200/50 gap-2 sm:gap-3">
          <button 
            onClick={onClose} 
            className={`px-4 py-2 rounded-lg ${THEME.inputBg} ${THEME.mutedText} font-medium text-sm hover:bg-gray-200/80 transition-colors order-2 sm:order-1`}
          >
            Cancel
          </button>
          <button 
            onClick={handleReturn} 
            disabled={loading} 
            className={`px-6 py-2 rounded-lg ${THEME.primaryBg} text-white font-medium text-sm hover:bg-[#1A365D] transition-colors order-1 sm:order-2 min-h-[44px] ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Returning...' : 'Return Items'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReturnDialog;
