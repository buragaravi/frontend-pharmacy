import React from 'react';
import { jwtDecode } from 'jwt-decode';

// Icon components
const FlaskIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.618v.786a2 2 0 002 2h12a2 2 0 002-2v-.786c0-.824-.393-1.596-1.072-2.19z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4H7zM7 3v4h10V3" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const QuotationCard = ({ quotation, onViewDetails }) => {
    const token = localStorage.getItem('token');
    const decodedToken = token ? jwtDecode(token) : null;
    const userRole = decodedToken?.user?.role;
    
    // Calculate totals for display
    const calculateTotals = () => {
        const chemicalTotal = quotation.chemicals?.reduce((sum, chem) => sum + (chem.pricePerUnit * chem.quantity || 0), 0) || 0;
        const equipmentTotal = quotation.equipment?.reduce((sum, eq) => sum + (eq.pricePerUnit * eq.quantity || 0), 0) || 0;
        const glasswareTotal = quotation.glassware?.reduce((sum, glass) => sum + (glass.pricePerUnit * glass.quantity || 0), 0) || 0;
        const grandTotal = chemicalTotal + equipmentTotal + glasswareTotal;
        return grandTotal;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
            case 'pending': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
            case 'rejected': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
            case 'draft': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
            case 'allocated': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300';
            default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
        }
    };

    const getItemTypeInfo = () => {
        const chemicalCount = quotation.chemicals?.length || 0;
        const equipmentCount = quotation.equipment?.length || 0;
        const glasswareCount = quotation.glassware?.length || 0;
        
        const types = [];
        if (chemicalCount > 0) types.push(`${chemicalCount} Chemicals`);
        if (equipmentCount > 0) types.push(`${equipmentCount} Equipment`);
        if (glasswareCount > 0) types.push(`${glasswareCount} Glassware`);
        
        return types.join(' • ');
    };

    const getQuotationType = () => {
        const chemicalCount = quotation.chemicals?.length || 0;
        const equipmentCount = quotation.equipment?.length || 0;
        const glasswareCount = quotation.glassware?.length || 0;
        
        const typeCount = [chemicalCount > 0, equipmentCount > 0, glasswareCount > 0].filter(Boolean).length;
        
        if (typeCount > 1) return 'Mixed Items';
        if (chemicalCount > 0) return 'Chemical';
        if (equipmentCount > 0) return 'Equipment';
        if (glasswareCount > 0) return 'Glassware';
        return 'Unknown';
    };

    return (
        <div className="bg-white backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-4 hover:scale-[1.02]">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg">
                        <div className="flex space-x-1">
                            {quotation.chemicals?.length > 0 && <FlaskIcon />}
                            {quotation.equipment?.length > 0 && <EquipmentIcon />}
                            {quotation.glassware?.length > 0 && <GlasswareIcon />}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            Quotation #{quotation._id.slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600">{getQuotationType()}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                    {quotation.status?.toUpperCase()}
                </span>
            </div>

            {/* Item Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Items Summary</h4>
                <p className="text-sm text-blue-700">{getItemTypeInfo()}</p>
                <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-blue-600">Total Value:</span>
                    <span className="text-lg font-bold text-blue-800">₹{calculateTotals().toFixed(2)}</span>
                </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium text-gray-800">
                        {new Date(quotation.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <span className="text-gray-500">Lab:</span>
                    <p className="font-medium text-gray-800">{quotation.labId || 'N/A'}</p>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => onViewDetails(quotation)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                    <ViewIcon />
                    <span>View Details</span>
                </button>
            </div>
        </div>
    );
};

export default QuotationCard;
