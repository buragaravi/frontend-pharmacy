import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useLabs from '../../hooks/useLabs';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Glassmorphic theme constants
const THEME = {
  background: 'bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-100/90',
  card: 'bg-white/20 backdrop-blur-xl border border-white/30',
  cardHover: 'hover:bg-white/30 hover:border-white/40',
  text: {
    primary: 'text-slate-700',
    secondary: 'text-slate-600',
    accent: 'text-blue-600',
  },
  button: {
    primary: 'bg-blue-500/80 hover:bg-blue-600/90 text-white backdrop-blur-sm',
    secondary: 'bg-white/20 hover:bg-white/30 text-slate-700 backdrop-blur-sm border border-white/30',
    danger: 'bg-red-500/80 hover:bg-red-600/90 text-white backdrop-blur-sm',
  },
  input: 'bg-white/20 border border-white/30 text-slate-700 placeholder-slate-500 backdrop-blur-sm',
  shadow: 'shadow-xl shadow-blue-500/10',
};

const AllocateChemicalForm = () => {
  // Fetch labs dynamically
  const { labs, loading: labsLoading } = useLabs();
  
  const fileInputRef = useRef(null);
  const [labId, setLabId] = useState('');
  const [chemicals, setChemicals] = useState([{ chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [unavailableChemicals, setUnavailableChemicals] = useState([]);

  const token = localStorage.getItem('token');

  // Helper: Merge chemicals by displayName, sum quantities, keep earliest expiry
  const mergeChemicalsByDisplayName = (chemList) => {
    const merged = {};
    chemList.forEach((chem) => {
      const displayName = chem.displayName || chem.chemicalName;
      if (!merged[displayName]) {
        merged[displayName] = {
          ...chem,
          quantity: Number(chem.quantity),
          expiryDate: chem.expiryDate,
        };
      } else {
        merged[displayName].quantity += Number(chem.quantity);
        // Keep the earliest expiry date
        if (
          chem.expiryDate &&
          (!merged[displayName].expiryDate ||
            new Date(chem.expiryDate) < new Date(merged[displayName].expiryDate))
        ) {
          merged[displayName].expiryDate = chem.expiryDate;
        }
      }
    });
    // Remove duplicate chemicalMasterId/unit if they differ (shouldn't happen, but safe)
    return Object.values(merged);
  };

  useEffect(() => {
    const fetchAvailableChemicals = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Merge by displayName, sum quantities, keep earliest expiry
        const merged = mergeChemicalsByDisplayName(
          res.data.filter((chem) => chem.quantity > 0)
        ).sort((a, b) => (a.displayName || a.chemicalName).localeCompare(b.displayName || b.chemicalName));

        setAvailableChemicals(merged);
      } catch (err) {
        console.error('Failed to fetch chemicals:', err);
      }
    };

    fetchAvailableChemicals();
  }, [token]);

  const handleChemicalNameChange = (index, name) => {
    const updated = [...chemicals];
    updated[index].chemicalName = name;
    updated[index].quantity = 0;
    updated[index].chemicalMasterId = '';
    updated[index].unit = '';
    updated[index].expiryDate = '';

    // Find the merged chemical by displayName
    const selected = availableChemicals.find(
      (chem) =>
        (chem.displayName || chem.chemicalName).toLowerCase() === name.toLowerCase()
    );

    if (selected) {
      updated[index].chemicalMasterId = selected.chemicalMasterId;
      updated[index].unit = selected.unit;
      updated[index].expiryDate = selected.expiryDate; // Earliest expiry
    }

    setChemicals(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...chemicals];
    updated[index].quantity = value;
    setChemicals(updated);
  };

  const addChemicalRow = () => {
    setChemicals([...chemicals, { chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
  };

  const removeChemicalRow = (index) => {
    const updated = [...chemicals];
    updated.splice(index, 1);
    setChemicals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!labId) {
      return setMessage('Please select a lab.');
    }

    const allocations = chemicals
      .filter((c) => c.chemicalMasterId && c.quantity)
      .map((c) => ({
        chemicalMasterId: c.chemicalMasterId,
        chemicalName: c.chemicalName,
        quantity: parseFloat(c.quantity),
        expiryDate: c.expiryDate, // Send earliest expiry
      }));

    if (allocations.length === 0) {
      return setMessage('Please select at least one valid chemical and quantity.');
    }

    setLoading(true);

    try {
      const res = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/chemicals/allocate',
        { labId, allocations },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Chemicals allocated successfully!');
      setChemicals([{ chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel file upload and parsing
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!fileTypes.includes(file.type)) {
      setMessage('Please upload an Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setFileUploading(true);
    setMessage('');

    try {
      const data = await readExcelFile(file);
      processExcelData(data);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setMessage('Failed to process the Excel file. Please check the format.');
    } finally {
      setFileUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Read Excel file and return data
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Process Excel data and update chemicals state
  const processExcelData = (data) => {
    if (!data || data.length === 0) {
      setMessage('The uploaded file contains no data or is in an incorrect format.');
      return;
    }

    // Try to identify column names for chemical name and quantity
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Look for column names that might contain chemical name and quantity
    const nameColumn = columns.find(col => 
      col.toLowerCase().includes('name') || 
      col.toLowerCase().includes('chemical') ||
      col.toLowerCase().includes('item')
    );
    
    const quantityColumn = columns.find(col => 
      col.toLowerCase().includes('quantity') || 
      col.toLowerCase().includes('qty') ||
      col.toLowerCase().includes('amount')
    );

    if (!nameColumn || !quantityColumn) {
      setMessage('Could not identify chemical name and quantity columns in the Excel file.');
      return;
    }

    // Map Excel data to chemical objects
    const excelChemicals = data.map(row => ({
      chemicalName: row[nameColumn],
      quantity: parseFloat(row[quantityColumn]) || 0,
      chemicalMasterId: '',
      unit: '',
      expiryDate: ''
    })).filter(chem => chem.chemicalName && chem.chemicalName.trim() !== '');

    if (excelChemicals.length === 0) {
      setMessage('No valid chemical data found in the uploaded file.');
      return;
    }

    // Check which chemicals are available in inventory
    const unavailable = [];
    const updatedChemicals = excelChemicals.map(chem => {
      const found = availableChemicals.find(
        availChem => (availChem.displayName || availChem.chemicalName).toLowerCase() === chem.chemicalName.toLowerCase()
      );

      if (found) {
        return {
          ...chem,
          chemicalMasterId: found.chemicalMasterId,
          unit: found.unit,
          expiryDate: found.expiryDate
        };
      } else {
        unavailable.push(chem.chemicalName);
        return chem;
      }
    });

    setChemicals(updatedChemicals);
    setUnavailableChemicals(unavailable);

    if (unavailable.length > 0) {
      setMessage(`${unavailable.length} chemical(s) from your file are not available in inventory.`);
    } else {
      setMessage('Excel data loaded successfully!');
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-100/90 relative">
      {/* Floating bubbles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <div className="relative z-10 bg-white/20 backdrop-blur-xl border-b border-white/30 px-6 py-3">
        <div className="flex items-center text-sm text-slate-600">
          <span className="hover:text-blue-600 cursor-pointer">Admin Dashboard</span>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="hover:text-blue-600 cursor-pointer">Allocation</span>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-800 font-medium">Allocate Chemicals</span>
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-none mx-auto bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mx-6 mt-6">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-blue-800/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-1">Allocate Chemicals to Lab</h1>
                  <p className="text-blue-100 text-base">Distribute chemicals from central stock to laboratory units</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 bg-white/10 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6">
        {message && (
          <div className={`w-full p-4 rounded-xl mb-6 ${
            message.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 mr-2 ${
                  message.includes('success') ? 'text-green-500' : 'text-red-500'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {message.includes('success') ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Excel Upload Section */}
          <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bulk Upload Chemicals
            </h2>
            <p className="text-sm text-slate-600 mb-4">Upload an Excel file (.xlsx, .xls) or CSV file containing chemical names and quantities to allocate in bulk.</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={triggerFileUpload}
                disabled={fileUploading}
                className={`px-4 py-2 rounded-lg flex items-center ${fileUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {fileUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Excel File
                  </>
                )}
              </button>
              <span className="text-sm text-slate-500">Supported formats: .xlsx, .xls, .csv</span>
            </div>

            {/* Unavailable Chemicals Section */}
            {unavailableChemicals.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Unavailable Chemicals
                </h3>
                <p className="text-xs text-amber-700 mb-2">The following chemicals from your upload are not available in inventory:</p>
                <div className="max-h-32 overflow-y-auto">
                  <ul className="text-xs text-amber-800 list-disc pl-5 space-y-1">
                    {unavailableChemicals.map((chem, idx) => (
                      <li key={`unavailable-${idx}`}>{chem}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          {/* Lab Selection */}
          <div className="w-full bg-white rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Destination Lab</label>
            <select
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={labsLoading}
              required
            >
              <option value="">{labsLoading ? 'Loading labs...' : 'Choose a laboratory'}</option>
              {labs.map((lab) => (
                <option key={lab.labId} value={lab.labId}>
                  {lab.labId} - {lab.labName}
                </option>
              ))}
            </select>
          </div>

          {/* Chemical Selection */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-700">Chemical Selection</h3>
              <div className="text-sm text-gray-500">{chemicals.length} item(s)</div>
            </div>
            {chemicals.map((chemical, index) => {
              const isOutOfStock = chemical.chemicalName && !availableChemicals.some(
                (chem) =>
                  (chem.displayName || chem.chemicalName).toLowerCase() === chemical.chemicalName.toLowerCase() &&
                  chem.quantity > 0
              );

              return (
                <div key={index} className="w-full bg-white rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
                  <div className="w-full flex flex-wrap gap-4 items-end">
                    {/* Chemical Name */}
                    <div className="flex-1 min-w-[200px] max-w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chemical Name</label>
                      <input
                        list={`chemical-list-${index}`}
                        value={chemical.chemicalName}
                        onChange={(e) => handleChemicalNameChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Search chemical..."
                        required
                      />
                      <datalist id={`chemical-list-${index}`}>
                        {availableChemicals.map((chem) => (
                          <option
                            key={`${chem.chemicalMasterId}-${chem.displayName || chem.chemicalName}-${index}`}
                            value={chem.displayName || chem.chemicalName}
                          >
                            {(chem.displayName || chem.chemicalName)} ({chem.unit}) - {chem.quantity} in stock
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Quantity */}
                    <div className="flex-1 min-w-[150px] max-w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={chemical.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="0.00"
                          required
                        />
                        {chemical.unit && (
                          <span className="text-sm text-blue-600 font-medium px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                            {chemical.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {chemicals.length > 1 && (
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => removeChemicalRow(index)}
                          className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all duration-200 flex items-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-600">This chemical is currently out of stock.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-wrap gap-4 justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={addChemicalRow}
              className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl font-medium transition-all duration-200 flex items-center shadow-sm hover:shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Chemical
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center ${
                loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Allocating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Allocate Chemicals
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AllocateChemicalForm;