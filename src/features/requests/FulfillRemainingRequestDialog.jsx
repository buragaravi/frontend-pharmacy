import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FulfillRemainingRequestDialog = ({ 
  request, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [unavailableChemicals, setUnavailableChemicals] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const token = localStorage.getItem('token');

  // Initialize quantities for remaining chemicals
  useEffect(() => {
    const initialQuantities = {};
    
    request.experiments.forEach(exp => {
      exp.chemicals.forEach(chem => {
        if (!chem.isAllocated) {
          const remaining = chem.quantity - (chem.allocatedQuantity || 0);
          initialQuantities[`${exp.experimentName}-${chem.chemicalName}`] = remaining;
        }
      });
    });
    
    setQuantities(initialQuantities);
  }, [request]);

  const handleQuantityChange = (expName, chemName, value) => {
    setQuantities(prev => ({
      ...prev,
      [`${expName}-${chemName}`]: Math.max(0, value)
    }));
  };

  const handleFulfillRemaining = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/requests/fulfill-remaining',
        {
          requestId: request._id,
          quantities
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.unfulfilled && response.data.unfulfilled.length > 0) {
        setUnavailableChemicals(response.data.unfulfilled);
        setShowConfirmation(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error fulfilling remaining request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceFulfill = async () => {
    setLoading(true);
    try {
      await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/requests/fulfill-remaining',
        {
          requestId: request._id,
          quantities,
          force: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Error force fulfilling remaining request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQuotationList = () => {
    const existing = JSON.parse(localStorage.getItem('quotationMissingChemicals')) || [];
    const combined = [...existing, ...unavailableChemicals];
    localStorage.setItem('quotationMissingChemicals', JSON.stringify(combined));
    alert('Unavailable chemicals added to quotation list.');
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Fulfill Remaining Chemicals</h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            This request has been partially fulfilled. Below are the remaining chemicals that need allocation.
          </p>
          
          <div className="border rounded-md p-4">
            {request.experiments.map((exp, expIdx) => (
              <div key={expIdx} className="mb-4 last:mb-0">
                <h4 className="font-semibold">{exp.experimentName}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(exp.date).toLocaleDateString()} | Course: {exp.courseId?.courseName} ({exp.courseId?.courseCode}) | Batch: {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchName} ({exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchCode}) - {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.academicYear}
                </p>
                
                <ul className="space-y-3">
                  {exp.chemicals.map((chem, chemIdx) => {
                    if (chem.isAllocated) return null;
                    
                    const remaining = chem.quantity - (chem.allocatedQuantity || 0);
                    const key = `${exp.experimentName}-${chem.chemicalName}`;
                    
                    return (
                      <li key={chemIdx} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{chem.chemicalName}</span>
                          <span className="text-gray-600 ml-2">
                            (Remaining: {remaining} {chem.unit})
                          </span>
                          {chem.allocatedQuantity > 0 && (
                            <span className="text-green-600 ml-2">
                              (Already allocated: {chem.allocatedQuantity})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={quantities[key] || ''}
                            onChange={(e) => handleQuantityChange(
                              exp.experimentName,
                              chem.chemicalName,
                              parseInt(e.target.value) || 0
                            )}
                            className="w-24 px-2 py-1 border rounded"
                          />
                          <span className="text-sm text-gray-500">
                            / {remaining}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {showConfirmation && unavailableChemicals.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-red-600 mb-2">Unavailable Chemicals:</h4>
            <ul className="list-disc ml-6 text-sm text-gray-800 mb-4">
              {unavailableChemicals.map((chem, i) => (
                <li key={i}>
                  {chem.chemicalName}: Required {chem.requiredQuantity}, Available {chem.availableQuantity} – {chem.reason}
                </li>
              ))}
            </ul>
            
            <div className="flex gap-3">
              <button
                onClick={handleForceFulfill}
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed with Partial Fulfillment'}
              </button>
              <button
                onClick={handleAddToQuotationList}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Add to Quotation List
              </button>
            </div>
          </div>
        )}

        {!showConfirmation && (
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleFulfillRemaining}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Fulfill Remaining'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-black"
          disabled={loading}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FulfillRemainingRequestDialog;