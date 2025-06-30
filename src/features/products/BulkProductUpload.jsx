import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Predefined units for dropdown with descriptive names
const UNIT_OPTIONS = [
  { value: 'mg', label: 'mg (Milligrams)' },
  { value: 'g', label: 'g (Grams)' },
  { value: 'kg', label: 'kg (Kilograms)' },
  { value: 'ml', label: 'ml (Milliliters)' },
  { value: 'L', label: 'L (Liters)' },
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'set', label: 'set (Sets)' },
  { value: 'box', label: 'box (Boxes)' },
  { value: 'pack', label: 'pack (Packs)' },
  { value: 'cap', label: 'cap (Capsules)' },
  { value: 'other', label: 'other (Other)' }
];

// Unit conversion mapping
const UNIT_CONVERSIONS = {
  'l': 'ml',      // Convert liters to milliliters
  'L': 'ml',      // Convert liters to milliliters
  'liter': 'ml',  // Convert liter to milliliters
  'liters': 'ml', // Convert liters to milliliters
  'g': 'g',       // Keep grams as grams
  'mg': 'mg',     // Keep milligrams as milligrams
  'gms': 'g',     // Convert grams to grams
  'gram': 'g',    // Convert gram to grams
  'grams': 'g',   // Convert grams to grams
  'cap': 'cap',   // Keep capsules as capsules
  'capsule': 'cap', // Convert capsule to capsules
  'capsules': 'cap' // Convert capsules to capsules
};

// Predefined variants for glassware/equipment
const VARIANT_PRESETS = {
  glassware: [
    '50ml', '100ml', '250ml', '500ml', '1000ml', 'other'
  ],
  equipment: [
    'Small', 'Medium', 'Large', 'other'
  ],
  others: ['Standard', 'other']
};

// Valid categories
const VALID_CATEGORIES = ['chemical', 'glassware', 'equipment', 'others'];

const BulkProductUpload = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Function to normalize and convert units
  const normalizeUnit = (unit) => {
    if (!unit) return '';
    
    const unitLower = unit.toString().toLowerCase().trim();
    
    // Check if unit needs conversion
    if (UNIT_CONVERSIONS[unitLower]) {
      return UNIT_CONVERSIONS[unitLower];
    }
    
    // If unit is already in our standard format, return as is
    const standardUnits = UNIT_OPTIONS.map(u => u.value);
    if (standardUnits.includes(unitLower)) {
      return unitLower;
    }
    
    // Return original unit if no conversion found
    return unit;
  };

  // Function to handle variant processing
  const processVariant = (variant, category) => {
    if (!variant || variant.toString().trim() === '') {
      return { variant: '', customVariant: '' };
    }
    
    const variantStr = variant.toString().trim();
    const categoryVariants = VARIANT_PRESETS[category] || [];
    
    // Check if variant exists in predefined list (excluding 'other')
    const predefinedVariants = categoryVariants.filter(v => v !== 'other');
    if (predefinedVariants.includes(variantStr)) {
      return { variant: variantStr, customVariant: '' };
    }
    
    // If variant doesn't exist in predefined list, use 'other' and set custom
    return { variant: 'other', customVariant: variantStr };
  };

  // Function to handle unit processing
  const processUnit = (unit) => {
    if (!unit || unit.toString().trim() === '') {
      return { unit: '', customUnit: '' };
    }
    
    const normalizedUnit = normalizeUnit(unit);
    const standardUnits = UNIT_OPTIONS.map(u => u.value);
    
    // Check if normalized unit exists in predefined list (excluding 'other')
    const predefinedUnits = standardUnits.filter(u => u !== 'other');
    if (predefinedUnits.includes(normalizedUnit)) {
      return { unit: normalizedUnit, customUnit: '' };
    }
    
    // If unit doesn't exist in predefined list, use 'other' and set custom
    return { unit: 'other', customUnit: normalizedUnit };
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setErrors(['Please select a valid Excel file (.xlsx, .xls) or CSV file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    parseExcelFile(selectedFile);
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setErrors(['Excel file must have at least a header row and one data row']);
          return;
        }

        const headers = jsonData[0].map(header => header ? header.toString().toLowerCase().trim() : '');
        const rows = jsonData.slice(1);

        const products = rows.map((row, index) => {
          const product = {
            name: '',
            unit: '',
            customUnit: '',
            thresholdValue: 0,
            category: 'chemical',
            subCategory: '',
            variant: '',
            customVariant: '',
            rowIndex: index + 2 // Excel row number (1-based + header)
          };

          // Map Excel columns to product fields
          headers.forEach((header, colIndex) => {
            const value = row[colIndex];
            if (value !== undefined && value !== null) {
              const stringValue = value.toString().trim();
              
              switch (header) {
                case 'name':
                case 'product name':
                case 'productname':
                  product.name = stringValue;
                  break;
                case 'unit':
                case 'units':
                  // Apply unit processing with auto-selection of 'other'
                  const unitResult = processUnit(stringValue);
                  product.unit = unitResult.unit;
                  product.customUnit = unitResult.customUnit;
                  break;
                case 'threshold':
                case 'threshold value':
                case 'thresholdvalue':
                  product.thresholdValue = parseFloat(stringValue) || 0;
                  break;
                case 'category':
                case 'product category':
                case 'productcategory':
                  const categoryLower = stringValue.toLowerCase();
                  if (VALID_CATEGORIES.includes(categoryLower)) {
                    product.category = categoryLower;
                  }
                  break;
                case 'subcategory':
                case 'sub category':
                  product.subCategory = stringValue;
                  break;
                case 'variant':
                case 'variants':
                  // Apply variant processing with auto-selection of 'other'
                  const variantResult = processVariant(stringValue, product.category);
                  product.variant = variantResult.variant;
                  product.customVariant = variantResult.customVariant;
                  break;
              }
            }
          });

          // Handle missing variants for non-chemical products
          if (product.category !== 'chemical' && !product.variant && !product.customVariant) {
            product.variant = 'Not applicable';
          }

          return product;
        }).filter(product => product.name.trim() !== ''); // Remove empty rows

        setParsedProducts(products);
        
        if (products.length === 0) {
          setErrors(['No valid products found in the Excel file. Please ensure the file has a header row with column names like "name", "unit", "threshold", "category", etc.']);
        }
      } catch (error) {
        setErrors(['Error parsing Excel file: ' + error.message]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...parsedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setParsedProducts(updatedProducts);
  };

  const validateProducts = () => {
    const newErrors = [];
    
    parsedProducts.forEach((product, index) => {
      if (!product.name.trim()) {
        newErrors.push(`Row ${product.rowIndex}: Product name is required`);
      }
      
      if (product.category === 'chemical' && !product.unit.trim() && !product.customUnit.trim()) {
        newErrors.push(`Row ${product.rowIndex}: Unit is required for chemical products`);
      }
      
      if (product.category !== 'chemical' && !product.variant.trim() && !product.customVariant.trim() && product.variant !== 'Not applicable') {
        newErrors.push(`Row ${product.rowIndex}: Variant is required for non-chemical products`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleUpload = async () => {
    if (!validateProducts()) {
      return;
    }

    setIsUploading(true);
    setErrors([]);      try {
        const token = localStorage.getItem('token');
        // Prepare products data for upload
        const productsForUpload = parsedProducts.map(product => ({
          name: product.name,
          unit: product.unit === 'other' ? product.customUnit : product.unit,
          thresholdValue: product.thresholdValue,
          category: product.category,
          subCategory: product.subCategory,
          variant: product.variant === 'other' ? product.customVariant : product.variant
        }));

        const response = await axios.post(
          'https://backend-pharmacy-5541.onrender.com/api/products/bulk',
          { products: productsForUpload },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

      setUploadResults(response.data);
      
      if (response.data.results.created.length > 0) {
        onSuccess && onSuccess(response.data);
      }
    } catch (error) {
      setErrors([error.response?.data?.message || 'Error uploading products']);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedProducts([]);
    setUploadResults(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderProductRow = (product, index) => (
    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Name */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={product.category}
            onChange={(e) => handleProductChange(index, 'category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {VALID_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Unit (for chemical) */}
        {product.category === 'chemical' && (
          <>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                value={product.unit}
                onChange={(e) => handleProductChange(index, 'unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select unit</option>
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
            {product.unit === 'other' && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Unit *</label>
                <input
                  type="text"
                  value={product.customUnit || ''}
                  onChange={(e) => handleProductChange(index, 'customUnit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter custom unit"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Variant (for non-chemical) */}
        {product.category !== 'chemical' && (
          <>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
              <select
                value={product.variant}
                onChange={(e) => handleProductChange(index, 'variant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select variant</option>
                <option value="Not applicable">Not applicable</option>
                {(VARIANT_PRESETS[product.category] || []).map(variant => (
                  <option key={variant} value={variant}>{variant}</option>
                ))}
              </select>
            </div>
            {product.variant === 'other' && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Variant *</label>
                <input
                  type="text"
                  value={product.customVariant || ''}
                  onChange={(e) => handleProductChange(index, 'customVariant', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter custom variant"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Threshold Value */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
          <input
            type="number"
            value={product.thresholdValue}
            onChange={(e) => handleProductChange(index, 'thresholdValue', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>

        {/* Sub Category */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
          <input
            type="text"
            value={product.subCategory}
            onChange={(e) => handleProductChange(index, 'subCategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-h-[75vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200 z-10">
        <h2 className="text-2xl font-semibold text-gray-800">Bulk Product Upload</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* File Upload Section */}
      {!parsedProducts.length && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Excel File
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Supported formats: .xlsx, .xls, .csv
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Expected columns: name, unit, threshold, category, subcategory, variant
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-1">Auto-Processing Features:</p>
              <p className="text-xs text-blue-600">• Units not in predefined list will auto-select "other" with custom value</p>
              <p className="text-xs text-blue-600">• Variants not in predefined list will auto-select "other" with custom value</p>
              <p className="text-xs text-blue-600">• Missing variants for non-chemical products will be set to "Not applicable"</p>
              <p className="text-xs text-blue-600">• Unit conversions: 'l'→'ml', 'grams'→'g', 'capsules'→'cap'</p>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, index) => (
            <p key={index} className="text-red-700 text-sm">{error}</p>
          ))}
        </div>
      )}

      {/* Upload Results */}
      {uploadResults && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Upload Results</h3>
          <p className="text-green-700 text-sm">{uploadResults.message}</p>
          {uploadResults.results.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-red-700 text-sm font-semibold">Errors:</p>
              {uploadResults.results.errors.map((error, index) => (
                <p key={index} className="text-red-600 text-xs ml-2">
                  Row {error.index + 1}: {error.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parsed Products */}
      {parsedProducts.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Review Products ({parsedProducts.length} items)
            </h3>
            <div className="space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Products'}
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {parsedProducts.map((product, index) => renderProductRow(product, index))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductUpload; 