import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import ProductForm from '../products/ProductForm';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const InvoiceOtherProductsForm = ({ category, onSuccess }) => {
  // State management
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [voucherId, setVoucherId] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [lineItems, setLineItems] = useState([
    { productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileType, setFileType] = useState('csv');
  const [csvError, setCsvError] = useState('');
  const [unregisteredProducts, setUnregisteredProducts] = useState([]);
  
  // Product registration modal state
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [productFormIndex, setProductFormIndex] = useState(0);
  const [productFormError, setProductFormError] = useState('');
  const [productFormLoading, setProductFormLoading] = useState(false);

  // Draft functionality
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const DRAFT_KEY = `invoiceOtherProductsFormDraft_${category}`;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, productsRes, voucherRes] = await Promise.all([
          axios.get(`${API_BASE}/vendors`),
          axios.get(`${API_BASE}/products/category/${category}`),
          axios.get(`${API_BASE}/vouchers/next?category=invoice`)
        ]);
        setVendors(vendorsRes.data.vendors || vendorsRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setVoucherId(voucherRes.data.voucherId || voucherRes.data.nextVoucherId || '');
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load initial data');
      }
    };
    fetchData();
  }, [category]);

  // Handle vendor select (lock after selection)
  const handleVendorSelect = (e) => {
    const vendor = vendors.find(v => v._id === e.target.value);
    setSelectedVendor(vendor);
  };

  // Prevent duplicate product selection
  const selectedProductIds = lineItems.map(item => item.productId).filter(Boolean);

  // Handle product selection
  const handleProductSelect = (idx, productId) => {
    const product = products.find(p => p._id === productId);
    setLineItems(items => items.map((item, i) =>
      i === idx ? {
        ...item,
        productId: product._id,
        name: product.name,
        variant: product.variant || product.unit || '',
        thresholdValue: product.thresholdValue,
        quantity: '',
        totalPrice: '',
        pricePerUnit: ''
      } : item
    ));
  };

  // Handle line item changes
  const handleLineItemChange = (idx, field, value) => {
    setLineItems(items => items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      
      // Auto-calculate price per unit
      if (field === 'quantity' || field === 'totalPrice') {
        const qty = Number(field === 'quantity' ? value : item.quantity);
        const total = Number(field === 'totalPrice' ? value : item.totalPrice);
        updated.pricePerUnit = qty && total ? (total / qty).toFixed(2) : '';
      }
      return updated;
    }));
  };

  // Add/remove line items
  const addLineItem = () => {
    setLineItems([...lineItems, { 
      productId: '', 
      name: '', 
      variant: '', 
      thresholdValue: '', 
      quantity: '', 
      totalPrice: '', 
      pricePerUnit: '' 
    }]);
  };

  const removeLineItem = (idx) => {
    if (lineItems.length > 1) {
      setLineItems(items => items.filter((_, i) => i !== idx));
    }
  };

  // Calculate total invoice price
  const totalInvoicePrice = lineItems.reduce(
    (sum, item) => sum + (Number(item.totalPrice) || 0),
    0
  );

  // File handling - Enhanced version like InvoiceForm
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvError('');
    setUnregisteredProducts([]);
    
    // Validate file extension based on selected fileType
    if (fileType === 'csv' && !file.name.match(/\.(csv)$/i)) {
      setCsvError('Please select a valid CSV file');
      return;
    }
    if (fileType === 'excel' && !file.name.match(/\.(xlsx|xls)$/i)) {
      setCsvError('Please select a valid Excel file (.xlsx, .xls)');
      return;
    }

    if (fileType === 'csv') {
      parseCSV(file);
    } else {
      parseExcel(file);
    }
  };

  // Parse CSV file
  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvError('CSV parsing errors: ' + results.errors.map(e => e.message).join(', '));
          return;
        }
        processFileData(results.data);
      },
      error: (error) => {
        setCsvError('Failed to parse CSV: ' + error.message);
      }
    });
  };

  // Parse Excel file
  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        processFileData(jsonData);
      } catch (error) {
        setCsvError('Failed to parse Excel file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process data from either CSV or Excel - Enhanced version
  const processFileData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setCsvError('No data found in file');
      return;
    }

    // Define required and optional fields
    const requiredFields = ['productName', 'quantity'];
    const optionalFields = ['vendor', 'invoiceNumber', 'invoiceDate', 'pricePerUnit', 'totalPrice', 'variant', 'unit'];
    
    // Check for missing required fields
    const missingFields = requiredFields.filter(field => 
      !Object.keys(data[0]).some(key => key.toLowerCase() === field.toLowerCase())
    );
    
    if (missingFields.length > 0) {
      setCsvError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    const missingProducts = [];
    const processedItems = [];
    
    data.forEach(row => {
      // Normalize field names (case-insensitive)
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase()] = row[key];
      });

      const productName = normalizedRow['productname'] || normalizedRow['product'] || '';
      const productVariant = normalizedRow['variant'] || normalizedRow['unit'] || '';
      if (!productName) return;

      // First try to find product by name and variant
      let product = null;
      if (productVariant) {
        product = products.find(p => 
          p.name.toLowerCase() === productName.toLowerCase() && 
          (p.variant || p.unit || '').toLowerCase() === productVariant.toLowerCase()
        );
      }
      
      // If no variant match, try to find by name only
      if (!product) {
        product = products.find(p => 
          p.name.toLowerCase() === productName.toLowerCase()
        );
      }

      if (!product) {
        const productIdentifier = productVariant ? `${productName} (${productVariant})` : productName;
        missingProducts.push(productIdentifier);
        return;
      }

      const quantity = normalizedRow['quantity'] || '';
      const totalPrice = normalizedRow['totalprice'] || normalizedRow['total'] || '0'; // Default to '0' if missing
      const pricePerUnit = normalizedRow['priceperunit'] || 
        (quantity && totalPrice && Number(totalPrice) > 0 ? (Number(totalPrice) / Number(quantity)).toFixed(2) : '0');

      processedItems.push({
        productId: product._id,
        name: product.name,
        variant: product.variant || product.unit || '',
        thresholdValue: product.thresholdValue,
        quantity: quantity.toString(),
        totalPrice: totalPrice.toString(),
        pricePerUnit: pricePerUnit.toString()
      });
    });

    setLineItems(processedItems.length > 0 ? 
      processedItems : 
      [{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '' }]
    );
    
    setUnregisteredProducts([...new Set(missingProducts)]); // Remove duplicates
    
    // Extract optional fields if available
    const firstRow = data[0];
    const normalizedFirstRow = {};
    Object.keys(firstRow).forEach(key => {
      normalizedFirstRow[key.toLowerCase()] = firstRow[key];
    });

    // Auto-fill vendor if found
    if (!selectedVendor && normalizedFirstRow['vendor']) {
      const foundVendor = vendors.find(v => 
        v.name.toLowerCase().includes(normalizedFirstRow['vendor'].toLowerCase())
      );
      if (foundVendor) {
        setSelectedVendor(foundVendor);
      }
    }
    
    // Auto-fill invoice fields
    if (normalizedFirstRow['invoicenumber'] && !invoiceNumber) {
      setInvoiceNumber(normalizedFirstRow['invoicenumber']);
    }
    if (normalizedFirstRow['invoicedate'] && !invoiceDate) {
      setInvoiceDate(normalizedFirstRow['invoicedate']);
    }
  };

  // Form submission - Enhanced version
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Enhanced validation
    if (!selectedVendor) {
      setError('Please select a vendor');
      setSubmitting(false);
      return;
    }

    if (!invoiceNumber || !invoiceDate) {
      setError('Invoice number and date are required');
      setSubmitting(false);
      return;
    }

    if (lineItems.some(item => !item.productId || !item.quantity || !item.totalPrice)) {
      setError('All line items must have a product, quantity, and total price');
      setSubmitting(false);
      return;
    }

    // Check for duplicate products
    const productIds = lineItems.map(item => item.productId);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      setError('Duplicate products found. Please remove duplicate entries.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        vendorId: selectedVendor._id,
        vendorName: selectedVendor.name,
        invoiceNumber,
        invoiceDate,
        totalInvoicePrice,
        lineItems: lineItems.map(item => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          thresholdValue: item.thresholdValue,
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          pricePerUnit: Number(item.pricePerUnit)
        }))
      };

      const res = await axios.post(`${API_BASE}/invoices/${category}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Clear draft on successful submission
      localStorage.removeItem(DRAFT_KEY);
      
      // --- Equipment: Show QR codes for each item if present ---
      if (category === 'equipment' && res.data.qrCodes && Array.isArray(res.data.qrCodes)) {
        Swal.fire({
          icon: 'success',
          title: 'Equipment Invoice Created',
          html: `<div style='max-height:300px;overflow:auto;'>` +
            res.data.qrCodes.map(qr =>
              `<div style='margin-bottom:8px;'><img src='${qr.qrCodeImage}' style='width:80px;height:80px;'/><br/><small>${qr.itemId || ''}</small></div>`
            ).join('') +
            `</div><div style='margin-top:8px;'>Invoice #${res.data.invoiceId || ''} created successfully!</div>`,
          confirmButtonColor: '#3b82f6',
          width: 500
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Invoice Created',
          text: `Invoice #${res.data.invoiceId} has been created successfully!`,
          confirmButtonColor: '#3b82f6'
        });
      }

      // Reset form
      setLineItems([{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '' }]);
      setInvoiceNumber('');
      setInvoiceDate('');
      setSelectedVendor(null);
      setSuccess(`${getCategoryName()} invoice created successfully!`);
      
      onSuccess?.();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create invoice';
      setError(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get category display name
  const getCategoryName = () => {
    switch (category) {
      case 'glassware': return 'Glassware';
      case 'equipment': return 'Equipment';
      default: return 'Other Products';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Draft prompt modal */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="text-lg font-semibold mb-2">Continue where you left off?</div>
            <div className="mb-4 text-gray-600 text-sm">A draft {getCategoryName()} invoice was found. Would you like to continue editing it or discard?</div>
            <div className="flex justify-center gap-4">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" 
                onClick={handleContinueDraft}
              >
                Continue
              </button>
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors" 
                onClick={handleDiscardDraft}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-blue-600 p-4 md:p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-700/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Create {getCategoryName()} Invoice</h1>
                <p className="text-blue-100">Voucher ID: {voucherId || 'Loading...'}</p>
              </div>
              <div className="mt-2 md:mt-0 bg-blue-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-blue-500/30">
                Total: ₹{totalInvoicePrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Section - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-blue-800 mb-2">Vendor Information</label>
                {selectedVendor ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800">{selectedVendor.name}</p>
                    <p className="text-sm text-gray-600">Code: <span className="font-mono">{selectedVendor.vendorCode}</span></p>
                    <button
                      type="button"
                      onClick={() => setSelectedVendor(null)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Change Vendor
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    value=""
                    onChange={handleVendorSelect}
                    required
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Invoice Info - Enhanced */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-blue-800 mb-2">Invoice Details</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-0">Bulk Import Products</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-600"
                        checked={fileType === 'csv'}
                        onChange={() => setFileType('csv')}
                      />
                      <span className="ml-2 text-sm">CSV</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-600"
                        checked={fileType === 'excel'}
                        onChange={() => setFileType('excel')}
                      />
                      <span className="ml-2 text-sm">Excel</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleData = [
                        { productName: "Sample Product", quantity: 10, totalPrice: 1000, pricePerUnit: 100 }
                      ];  // Generate sample file - Enhanced version
  const generateSampleFile = () => {
    const sampleData = [
      {
        productName: "Sample Glass Beaker",
        variant: "250ml",
        quantity: 5,
        totalPrice: 1250,
        pricePerUnit: 250,
        vendor: "ABC Suppliers",
        invoiceNumber: "INV-2024-001",
        invoiceDate: "2024-01-15"
      },
      {
        productName: "Laboratory Equipment",
        variant: "Digital",
        quantity: 2,
        vendor: "ABC Suppliers"
      },
      {
        productName: "Test Tube",
        quantity: 10,
        vendor: "ABC Suppliers"
      }
    ];

    if (fileType === 'csv') {
      const csv = Papa.unparse(sampleData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample_${category}_import.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sample");
      XLSX.writeFile(wb, `sample_${category}_import.xlsx`);
    }
  };

  // --- DRAFT LOGIC ---
  // Save draft to localStorage (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      const draftData = {
        selectedVendor,
        invoiceNumber,
        invoiceDate,
        lineItems,
        fileType,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }, 500); // Debounce: 500ms
    
    return () => clearTimeout(handler);
  }, [selectedVendor, invoiceNumber, invoiceDate, lineItems, fileType, DRAFT_KEY]);

  // Rehydrate draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        // Only show prompt if draft is recent (within 24 hours)
        if (Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) {
          setShowDraftPrompt(true);
        }
      } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, [DRAFT_KEY]);

  // Handle draft actions
  const handleContinueDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        setSelectedVendor(draftData.selectedVendor);
        setInvoiceNumber(draftData.invoiceNumber || '');
        setInvoiceDate(draftData.invoiceDate || '');
        setLineItems(draftData.lineItems || [{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '' }]);
        setFileType(draftData.fileType || 'csv');
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftPrompt(false);
  };

  // Warn on tab close if draft exists
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [DRAFT_KEY]);

  // Product registration logic
  const handleCreateProductFromInvoice = async (productData) => {
    setProductFormLoading(true);
    setProductFormError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/products`, productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newProduct = response.data.data;
      setProducts(prev => [...prev, newProduct]);
      
      // Remove from unregistered list
      const currentProductName = unregisteredProducts[productFormIndex];
      setUnregisteredProducts(prev => prev.filter(name => name !== currentProductName));
      
      // Move to next product or close modal
      if (productFormIndex + 1 < unregisteredProducts.length) {
        setProductFormIndex(prev => prev + 1);
      } else {
        setShowProductFormModal(false);
        setProductFormIndex(0);
      }
      
      setSuccess(`Product "${newProduct.name}" registered successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      setProductFormError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setProductFormLoading(false);
    }
  };
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Download Sample
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex-1">
                  <div className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                    <input
                      type="file"
                      accept={fileType === 'csv' ? '.csv' : '.xlsx,.xls'}
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <strong>Tip:</strong> Include a 'variant' column for products with different variants (e.g., sizes, types). 
                Products are matched by both name and variant for accurate selection.
              </div>

              {csvError && (
                <div className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {csvError}
                </div>
              )}

              {unregisteredProducts.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-yellow-700 text-sm font-medium mb-1">
                    {unregisteredProducts.length} unregistered product(s) found
                  </div>
                  <ul className="list-disc pl-5 text-yellow-700 text-sm">
                    {unregisteredProducts.slice(0, 3).map((name, idx) => (
                      <li key={idx} className="break-words">{name}</li>
                    ))}
                    {unregisteredProducts.length > 3 && (
                      <li>+ {unregisteredProducts.length - 3} more</li>
                    )}
                  </ul>
                  <div className="mt-2 text-xs text-yellow-600">
                    Note: Products are matched by name and variant. Make sure both match exactly.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductFormModal(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Register Missing Products
                  </button>
                </div>
              )}
            </div>

            {/* Line Items Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Products</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Product
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white p-3 rounded-lg border border-gray-200 relative">
                    {/* Product Selection */}
                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">Product</label>
                      <select
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={item.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        required
                      >
                        <option value="">Select product...</option>
                        {products
                          .filter(p => !selectedProductIds.includes(p._id) || p._id === item.productId)
                          .map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} {p.variant ? `(${p.variant})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Variant (readonly) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Variant</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded border border-gray-200 bg-gray-50 text-gray-600"
                        value={item.variant}
                        readOnly
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    {/* Total Price */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Total Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        value={item.totalPrice}
                        onChange={(e) => handleLineItemChange(idx, 'totalPrice', e.target.value)}
                        required
                      />
                    </div>

                    {/* Price Per Unit (readonly) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Unit Price (₹)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded border border-gray-200 bg-gray-50 text-gray-600"
                        value={item.pricePerUnit}
                        readOnly
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      aria-label="Remove product"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Success/Error Messages */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start border border-red-200">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg flex items-start border border-green-200">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>{success}</div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Create {getCategoryName()} Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Registration Modal - Enhanced */}
      {showProductFormModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto backdrop-blur-sm bg-black/30">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative mt-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Register New {getCategoryName()} Product</h3>
                <button 
                  onClick={() => setShowProductFormModal(false)} 
                  className="text-gray-400 hover:text-gray-700 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              {unregisteredProducts.length > 1 && (
                <div className="mb-4 text-sm text-gray-500 bg-blue-50 p-2 rounded">
                  Registering: {unregisteredProducts[productFormIndex]} 
                  ({productFormIndex + 1} of {unregisteredProducts.length})
                </div>
              )}
              
              <ProductForm
                product={null}
                onCreate={handleCreateProductFromInvoice}
                onUpdate={() => {}}
                onClose={() => setShowProductFormModal(false)}
                initialName={unregisteredProducts[productFormIndex] || ''}
                initialCategory={category}
              />
              
              {productFormError && (
                <div className="mt-3 text-center text-red-600 text-sm">{productFormError}</div>
              )}
              
              {productFormLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating product...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceOtherProductsForm;