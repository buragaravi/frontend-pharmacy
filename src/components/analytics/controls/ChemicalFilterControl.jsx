import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { chemicalCategoryColors } from '../utils/colorPalette';

const ChemicalFilterControl = ({ chemicals, value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Group chemicals by category
  const groupedOptions = useMemo(() => {
    const categories = {};
    
    chemicals.forEach(chem => {
      if (!categories[chem.category]) {
        categories[chem.category] = {
          label: chem.category,
          options: []
        };
      }
      categories[chem.category].options.push({
        value: chem._id,
        label: `${chem.name} (${chem.stock} ${chem.unit})`,
        stock: chem.stock,
        unit: chem.unit,
        category: chem.category
      });
    });
    
    return Object.values(categories);
  }, [chemicals]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return groupedOptions;
    
    return groupedOptions
      .map(group => ({
        ...group,
        options: group.options.filter(opt => 
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(group => group.options.length > 0);
  }, [groupedOptions, searchTerm]);

  // Custom option and group styling
  const formatOptionLabel = ({ label, stock, unit, category }) => (
    <div className="chemical-option">
      <span 
        className="category-indicator" 
        style={{ backgroundColor: chemicalCategoryColors[category] || '#ccc' }}
      />
      <span className="chemical-name">{label.split(' (')[0]}</span>
      <span className="chemical-stock">{stock} {unit}</span>
    </div>
  );

  const formatGroupLabel = (group) => (
    <div className="chemical-group">
      <span 
        className="group-color" 
        style={{ backgroundColor: chemicalCategoryColors[group.label] || '#ccc' }}
      />
      <span>{group.label}</span>
      <span className="group-count">{group.options.length} chemicals</span>
    </div>
  );

  return (
    <div className="chemical-filter-control">
      <Select
        isMulti
        options={filteredOptions}
        value={value}
        onChange={onChange}
        onInputChange={setSearchTerm}
        formatOptionLabel={formatOptionLabel}
        formatGroupLabel={formatGroupLabel}
        placeholder="Filter by chemical..."
        classNamePrefix="chemical-select"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null
        }}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '42px',
            borderColor: '#ddd',
            '&:hover': {
              borderColor: '#aaa'
            }
          }),
          menu: (base) => ({
            ...base,
            zIndex: 100
          }),
          multiValue: (base, { data }) => ({
            ...base,
            backgroundColor: chemicalCategoryColors[data.category] + '20',
            borderLeft: `3px solid ${chemicalCategoryColors[data.category] || '#ccc'}`
          })
        }}
      />
    </div>
  );
};

export default ChemicalFilterControl;