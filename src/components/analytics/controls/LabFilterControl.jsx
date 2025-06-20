import React from 'react';
import Select from 'react-select';
import { generateLabColors } from '../utils/colorPalette';

const LabFilterControl = ({ labs, value, onChange, isMulti = false }) => {
  const options = labs.map(lab => ({
    value: lab.id,
    label: lab.name,
    code: lab.code
  }));

  const labColors = generateLabColors(labs.map(l => l.code));

  const formatOptionLabel = ({ label, code }, { context }) => (
    <div className="lab-option">
      <span 
        className="lab-color" 
        style={{ backgroundColor: labColors[options.findIndex(o => o.code === code)] }}
      />
      {label}
      {context === 'menu' && <span className="lab-code">{code}</span>}
    </div>
  );

  return (
    <div className="lab-filter-control">
      <Select
        isMulti={isMulti}
        options={options}
        value={value}
        onChange={onChange}
        formatOptionLabel={formatOptionLabel}
        placeholder={`Select lab${isMulti ? 's' : ''}...`}
        classNamePrefix="lab-select"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '42px'
          }),
          option: (base, { data, isSelected }) => ({
            ...base,
            backgroundColor: isSelected 
              ? '#e6f7ff' 
              : 'white',
            paddingLeft: '30px',
            position: 'relative',
            ':before': {
              content: '""',
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: labColors[options.findIndex(o => o.code === data.code)]
            }
          })
        }}
      />
    </div>
  );
};

export default LabFilterControl;