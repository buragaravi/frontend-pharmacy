import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white',
  border: 'border-[#BCE0FD]',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-[#0B3861] focus:border-[#0B3861]'
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
};

const RequestCard = ({ request, onClick, actionButton, className = '', showStatus = true }) => {
  return (
    <div 
      className={`${THEME.card} p-4 rounded-lg cursor-pointer transition-all ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`text-sm font-medium ${THEME.primaryText}`}>Lab {request.labId}</h3>
          <p className="text-xs text-gray-500">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        {showStatus && (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[request.status]}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {request.experiments.map((exp, index) => (
          <div key={exp._id || index} className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-start mb-2">
              <h4 className={`text-sm font-medium ${THEME.secondaryText}`}>{exp.experimentName}</h4>
              <span className="text-xs text-gray-500">{exp.session}</span>
            </div>
            <div className="space-y-1">
              {exp.chemicals && exp.chemicals.length > 0 && (
                <div>
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Chemicals</div>
                  {exp.chemicals.map((chem, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{chem.chemicalName}</span>
                      <span className="text-gray-600">
                        {chem.quantity} {chem.unit}
                        {chem.isAllocated && (
                          <span className="ml-1 text-green-600">({chem.allocatedQuantity} allocated)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {exp.glassware && exp.glassware.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Glassware</div>                  {exp.glassware.map((glass, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{glass.name || glass.glasswareName || 'N/A'}</span>
                      <span className="text-gray-600">
                        {glass.quantity} {glass.unit || glass.variant || ''}
                        {glass.isAllocated && (
                          <span className="ml-1 text-green-600">(Allocated)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {exp.equipment && exp.equipment.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Equipment</div>
                  {exp.equipment.map((eq, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{eq.name} ({eq.variant})</span>
                      <span className="text-gray-600">
                        {eq.quantity}
                        {eq.isAllocated && (
                          <span className="ml-1 text-green-600">(Allocated)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {actionButton && (
        <div className="mt-4 flex justify-end">
          {actionButton}
        </div>
      )}
    </div>
  );
};

RequestCard.propTypes = {
  request: PropTypes.shape({
    labId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    experiments: PropTypes.arrayOf(
      PropTypes.shape({
        experimentName: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        session: PropTypes.string.isRequired,
        chemicals: PropTypes.arrayOf(
          PropTypes.shape({
            chemicalName: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            unit: PropTypes.string.isRequired,
            allocatedQuantity: PropTypes.number,
            isAllocated: PropTypes.bool,
            allocationHistory: PropTypes.arrayOf(PropTypes.object),
            _id: PropTypes.object
          })
        ).isRequired,
        glassware: PropTypes.arrayOf(
          PropTypes.shape({
            glasswareName: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            unit: PropTypes.string,
            isAllocated: PropTypes.bool,
            _id: PropTypes.object
          })
        ),
        equipment: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            variant: PropTypes.string,
            quantity: PropTypes.number.isRequired,
            isAllocated: PropTypes.bool,
            _id: PropTypes.object
          })
        ),
        _id: PropTypes.object
      })
    ).isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  actionButton: PropTypes.node,
  className: PropTypes.string,
  showStatus: PropTypes.bool,
};

RequestCard.defaultProps = {
  actionButton: null,
  className: '',
  showStatus: true,
};

export default RequestCard;