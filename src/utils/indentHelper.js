// Utility functions for handling missing items and indent creation

/**
 * Save missing chemicals to localStorage for indent creation
 * @param {Array} missingChemicals - Array of missing chemical objects
 */
export const saveMissingChemicalsForIndent = (missingChemicals) => {
  try {
    const existing = JSON.parse(localStorage.getItem('indentMissingChemicals')) || [];
    
    // Merge with existing and remove duplicates
    const merged = [...existing];
    missingChemicals.forEach(newChem => {
      const exists = merged.find(existing => 
        existing.chemicalName.toLowerCase() === newChem.chemicalName.toLowerCase()
      );
      if (!exists) {
        merged.push({
          chemicalName: newChem.chemicalName,
          requiredQuantity: newChem.requiredQuantity || newChem.quantity || 1,
          unit: newChem.unit,
          currentQuantity: newChem.currentQuantity || 0,
          reason: newChem.reason || 'Missing from inventory'
        });
      }
    });
    
    localStorage.setItem('indentMissingChemicals', JSON.stringify(merged));
    console.log('Missing chemicals saved for indent:', merged);
  } catch (error) {
    console.error('Error saving missing chemicals for indent:', error);
  }
};

/**
 * Save missing equipment to localStorage for indent creation
 * @param {Array} missingEquipment - Array of missing equipment objects
 */
export const saveMissingEquipmentForIndent = (missingEquipment) => {
  try {
    const existing = JSON.parse(localStorage.getItem('indentMissingEquipment')) || [];
    
    // Merge with existing and remove duplicates
    const merged = [...existing];
    missingEquipment.forEach(newEq => {
      const exists = merged.find(existing => 
        (existing.equipmentName || existing.name).toLowerCase() === (newEq.equipmentName || newEq.name).toLowerCase()
      );
      if (!exists) {
        merged.push({
          equipmentName: newEq.equipmentName || newEq.name,
          requiredQuantity: newEq.requiredQuantity || newEq.quantity || 1,
          unit: newEq.unit || 'pieces',
          specifications: newEq.specifications || '',
          currentQuantity: newEq.currentQuantity || 0,
          reason: newEq.reason || 'Missing from inventory'
        });
      }
    });
    
    localStorage.setItem('indentMissingEquipment', JSON.stringify(merged));
    console.log('Missing equipment saved for indent:', merged);
  } catch (error) {
    console.error('Error saving missing equipment for indent:', error);
  }
};

/**
 * Save missing glassware to localStorage for indent creation
 * @param {Array} missingGlassware - Array of missing glassware objects
 */
export const saveMissingGlasswareForIndent = (missingGlassware) => {
  try {
    const existing = JSON.parse(localStorage.getItem('indentMissingGlassware')) || [];
    
    // Merge with existing and remove duplicates
    const merged = [...existing];
    missingGlassware.forEach(newGlass => {
      const exists = merged.find(existing => 
        (existing.glasswareName || existing.name).toLowerCase() === (newGlass.glasswareName || newGlass.name).toLowerCase()
      );
      if (!exists) {
        merged.push({
          glasswareName: newGlass.glasswareName || newGlass.name,
          requiredQuantity: newGlass.requiredQuantity || newGlass.quantity || 1,
          unit: newGlass.unit || 'pieces',
          condition: newGlass.condition || 'new',
          currentQuantity: newGlass.currentQuantity || 0,
          reason: newGlass.reason || 'Missing from inventory'
        });
      }
    });
    
    localStorage.setItem('indentMissingGlassware', JSON.stringify(merged));
    console.log('Missing glassware saved for indent:', merged);
  } catch (error) {
    console.error('Error saving missing glassware for indent:', error);
  }
};

/**
 * Clear all missing items from localStorage
 */
export const clearMissingItemsForIndent = () => {
  try {
    localStorage.removeItem('indentMissingChemicals');
    localStorage.removeItem('indentMissingEquipment');
    localStorage.removeItem('indentMissingGlassware');
    console.log('All missing items cleared from localStorage');
  } catch (error) {
    console.error('Error clearing missing items:', error);
  }
};

/**
 * Get count of missing items saved for indent
 * @returns {Object} - Count of missing items by type
 */
export const getMissingItemsCounts = () => {
  try {
    const chemicals = JSON.parse(localStorage.getItem('indentMissingChemicals')) || [];
    const equipment = JSON.parse(localStorage.getItem('indentMissingEquipment')) || [];
    const glassware = JSON.parse(localStorage.getItem('indentMissingGlassware')) || [];
    
    return {
      chemicals: chemicals.length,
      equipment: equipment.length,
      glassware: glassware.length,
      total: chemicals.length + equipment.length + glassware.length
    };
  } catch (error) {
    console.error('Error getting missing items counts:', error);
    return { chemicals: 0, equipment: 0, glassware: 0, total: 0 };
  }
};

/**
 * Navigate to indent creation page with missing items
 * @param {Function} navigate - React Router navigate function
 */
export const navigateToIndentWithMissingItems = (navigate) => {
  const counts = getMissingItemsCounts();
  if (counts.total > 0) {
    navigate('/indent');
    return true;
  }
  return false;
};
