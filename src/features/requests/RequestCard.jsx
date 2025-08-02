import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CourseInfoBadge from './CourseInfoBadge';
import { useResponsiveColors } from '../../hooks/useResponsiveColors';
import SafeButton from '../../components/SafeButton';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-green-100 text-green-800',
  partially_fulfilled: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  pending: 'Pending Admin Approval',
  approved: 'Approved - Ready for Allocation',
  rejected: 'Rejected by Admin',
  fulfilled: 'Fulfilled',
  partially_fulfilled: 'Partially Fulfilled',
  completed: 'Completed',
};

const RequestCard = ({ request, onClick, actionButton, className = '', showStatus = true, onStatusClick, userRole }) => {
  // Color utilities for cross-platform compatibility
  const { getSafeBackground, getSafeBackdrop } = useResponsiveColors();
  
  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-all border border-gray-200 ${className}`}
      style={getSafeBackground('light', '#ffffff')}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Lab {request.labId}</h3>
          <p className="text-xs text-gray-500">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
          {/* Course and Batch Information */}
          <div className="mt-2">
            <CourseInfoBadge request={request} />
          </div>
        </div>
        {showStatus && (
          <span 
            className={`px-2 py-1 text-xs rounded-full font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 ${STATUS_COLORS[request.status]} ${onStatusClick ? 'animate-pulse hover:animate-none' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onStatusClick) {
                onStatusClick(request.status);
              }
            }}
            title={STATUS_LABELS[request.status] || "Click to filter by this status"}
          >
            {STATUS_LABELS[request.status] || request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {request.experiments.map((exp, index) => (
          <div key={exp._id || index} className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-start mb-2">
              <h4 className={`text-sm font-medium ${THEME.secondaryText}`}>{exp.experimentName}</h4>
              <div className="text-xs text-gray-500">
                {exp.courseId?.courseName && exp.courseId?.batches?.find(batch => batch._id === exp.batchId) && (
                  <span>
                    {exp.courseId.courseName} - {exp.courseId.batches.find(batch => batch._id === exp.batchId)?.batchName}
                  </span>
                )}
              </div>
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
        courseId: PropTypes.object,
        batchId: PropTypes.string,
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
  onStatusClick: PropTypes.func,
  userRole: PropTypes.string,
};

RequestCard.defaultProps = {
  actionButton: null,
  className: '',
  showStatus: true,
  onStatusClick: null,
  userRole: null,
};

export default RequestCard;