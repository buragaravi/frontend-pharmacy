export const generateLabColors = (labs) => {
    const labColors = {
      'central-store': '#3498db',
      'LAB01': '#2ecc71',
      'LAB02': '#e74c3c',
      'LAB03': '#f39c12',
      'LAB04': '#9b59b6',
      'LAB05': '#1abc9c',
      'LAB06': '#d35400',
      'LAB07': '#34495e',
      'LAB08': '#16a085'
    };
    
    return labs.map(lab => labColors[lab] || '#95a5a6');
  };
  
  export const chemicalCategoryColors = {
    'Acid': '#e74c3c',
    'Base': '#3498db',
    'Solvent': '#2ecc71',
    'Salt': '#f39c12',
    'Organic': '#9b59b6',
    'Inorganic': '#34495e',
    'Other': '#95a5a6'
  };