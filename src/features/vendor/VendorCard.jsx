import React from 'react';

const VendorCard = ({ vendor, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col justify-between h-full transition hover:shadow-lg">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-blue-800 truncate">{vendor.name}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">{vendor.vendorCode}</span>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          {vendor.address && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 text-blue-400"><i className="fas fa-map-marker-alt" /></span>
              <span className="truncate">{vendor.address.street}, {vendor.address.city}</span>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 text-blue-400"><i className="fas fa-phone" /></span>
              <span>{vendor.phone}</span>
            </div>
          )}
          {vendor.website && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 text-blue-400"><i className="fas fa-globe" /></span>
              <a
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {vendor.website.replace(/(^\w+:|^)\/\//, '')}
              </a>
            </div>
          )}
          {vendor.description && (
            <div className="text-gray-500 text-xs mt-2 line-clamp-3">{vendor.description}</div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition text-sm"
          onClick={() => onEdit(vendor)}
        >
          <i className="fas fa-edit mr-1" /> Edit
        </button>
        <button
          className="px-4 py-1 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition text-sm"
          onClick={() => onDelete(vendor._id)}
        >
          <i className="fas fa-trash mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

export default VendorCard;