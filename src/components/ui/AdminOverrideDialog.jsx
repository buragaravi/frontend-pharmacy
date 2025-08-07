import React, { useState } from 'react';
import { X, Shield, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../utils/dateValidation';

const AdminOverrideDialog = ({ 
  isOpen, 
  onClose, 
  experiment, 
  onConfirm,
  isLoading = false 
}) => {
  const [reason, setReason] = useState('');
  const [enable, setEnable] = useState(true);
  
  if (!isOpen || !experiment) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (enable && !reason.trim()) {
      return;
    }
    
    await onConfirm({
      reason: reason.trim(),
      enable
    });
    
    // Reset form
    setReason('');
    setEnable(true);
  };
  
  // Theme constants
  const THEME = {
    modalOverlay: 'bg-white/20 backdrop-blur-xl',
    card: 'bg-white/98 backdrop-blur-xl border border-blue-100/60 shadow-2xl shadow-blue-500/10',
    primaryText: 'text-[#1E3A8A]',
    secondaryText: 'text-[#3B82F6]',
    mutedText: 'text-slate-600',
    primaryBg: 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600',
    inputFocus: 'focus:ring-3 focus:ring-blue-200/50 focus:border-blue-400 transition-all duration-300',
    buttonShadow: 'shadow-lg shadow-blue-500/25'
  };
  
  return (
    <div className={`fixed inset-0 ${THEME.modalOverlay} flex items-center justify-center z-[999999] p-4`}>
      <div className={`${THEME.card} rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden ${THEME.buttonShadow}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${THEME.primaryText}`}>
                  Admin Override
                </h3>
                <p className={`text-sm ${THEME.mutedText} mt-1`}>
                  Override date restrictions for allocation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 p-2 rounded-xl transition-all duration-300"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Experiment Info */}
          <div className="mb-6 p-4 bg-blue-50/80 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className={`font-semibold ${THEME.primaryText}`}>
                  {experiment.experimentName}
                </h4>
                <p className={`text-sm ${THEME.mutedText}`}>
                  Experiment Date: {formatDate(experiment.date)}
                </p>
              </div>
            </div>
            
            {/* Current Override Status */}
            {experiment.allocationStatus?.adminOverride && (
              <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-800" />
                  <span className="font-medium text-blue-800">Currently Override Active</span>
                </div>
                <p className="text-sm text-blue-700">
                  Reason: {experiment.allocationStatus.overrideReason}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Set by: {experiment.allocationStatus.overrideBy} • 
                  {formatDate(experiment.allocationStatus.overrideAt)}
                </p>
              </div>
            )}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-4 p-4 bg-gray-50/80 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  checked={enable}
                  onChange={() => setEnable(true)}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`font-medium ${THEME.primaryText}`}>
                  Enable Override
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  checked={!enable}
                  onChange={() => setEnable(false)}
                  disabled={isLoading}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className={`font-medium ${THEME.primaryText}`}>
                  Disable Override
                </span>
              </label>
            </div>
            
            {/* Reason Input */}
            {enable && (
              <div>
                <label className={`block text-sm font-semibold ${THEME.secondaryText} mb-2`}>
                  Override Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter detailed reason for overriding date restrictions..."
                  required={enable}
                  disabled={isLoading}
                  rows={3}
                  className={`w-full px-4 py-3 border border-blue-200 rounded-xl ${THEME.inputFocus} resize-none bg-white/90 placeholder-gray-400`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be logged and visible to faculty members.
                </p>
              </div>
            )}
            
            {/* Warning */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {enable ? 'Override Responsibility' : 'Disable Override'}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {enable 
                      ? 'By enabling override, you accept responsibility for allowing allocation beyond the experiment date. This action will be logged and audited.'
                      : 'Disabling override will restore normal date validation rules for this experiment.'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading || (enable && !reason.trim())}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all duration-300 ${THEME.buttonShadow} ${
                  enable 
                    ? `${THEME.primaryBg} hover:from-[#2563EB] hover:to-[#1D4ED8]`
                    : `${THEME.danger} hover:from-rose-600 hover:to-rose-700`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {enable ? 'Enabling...' : 'Disabling...'}
                  </div>
                ) : (
                  enable ? 'Enable Override' : 'Disable Override'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminOverrideDialog;
