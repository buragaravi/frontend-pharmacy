import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

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
  const [fileType, setFileType] = useState('csv');
  const [csvError, setCsvError] = useState('');
  const [unregisteredProducts, setUnregisteredProducts] = useState([]);
  const [showProductFormModal, setShowProductFormModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, productsRes, voucherRes] = await Promise.all([
          axios.get(`${API_BASE}/vendors`),
          axios.get(`${API_BASE}/products/category/${category}`),
          axios.get(`${API_BASE}/vouchers/next?category=invoice`)
        ]);
        setVendors(vendorsRes.data.vendors || []);
        setProducts(productsRes.data.data || []);
        setVoucherId(voucherRes.data.voucherId || '');
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [category]);

  // Handle product selection
  const handleProductSelect = (idx, productId) => {
    const product = products.find(p => p._id === productId);
    setLineItems(items => items.map((item, i) =>
      i === idx ? {
        ...item,
        productId: product._id,
        name: product.name,
        variant: product.variant || product.unit,
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

  // File handling
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = fileType === 'csv' 
          ? Papa.parse(e.target.result, { header: true }).data
          : XLSX.read(e.target.result, { type: 'array' }).SheetNames
              .map(name => XLSX.utils.sheet_to_json(XLSX.read(e.target.result, { type: 'array' }).Sheets[name]))
              .flat();

        processFileData(data);
      } catch (err) {
        setCsvError('Failed to parse file. Please check the format.');
      }
    };
    fileType === 'csv' ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
  };

  const processFileData = (data) => {
    if (!Array.isArray(data)) {
      setCsvError('Invalid file format');
      return;
    }

    const missingProducts = [];
    const newItems = data.map(row => {
      const product = products.find(p => p.name === row.productName);
      if (!product && row.productName) missingProducts.push(row.productName);
      
      return {
        productId: product?._id || '',
        name: product?.name || row.productName || '',
        variant: product?.variant || '',
        thresholdValue: product?.thresholdValue || '',
        quantity: row.quantity || '',
        totalPrice: row.totalPrice || '',
        pricePerUnit: row.pricePerUnit || (row.quantity && row.totalPrice ? (row.totalPrice / row.quantity).toFixed(2) : '')
      };
    });

    setLineItems(newItems);
    setUnregisteredProducts(missingProducts.filter(Boolean));
    if (missingProducts.length) {
      setCsvError(`${missingProducts.length} products not found in system`);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
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

    try {
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

      const res = await axios.post(`${API_BASE}/invoices/${category}`, payload);
      
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
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to create invoice',
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-4 md:p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">Create {getCategoryName()} Invoice</h1>
              <p className="text-blue-100">Voucher ID: {voucherId || 'Loading...'}</p>
            </div>
            <div className="mt-2 md:mt-0 bg-blue-700 px-3 py-1 rounded-full text-sm">
              Total: ₹{totalInvoicePrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-800 mb-2">Vendor Information</label>
                {selectedVendor ? (
                  <div className="space-y-2">
                    <p className="font-medium">{selectedVendor.name}</p>
                    <p className="text-sm text-gray-600">Code: {selectedVendor.vendorCode}</p>
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value=""
                    onChange={(e) => setSelectedVendor(vendors.find(v => v._id === e.target.value))}
                    required
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Invoice Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-800 mb-2">Invoice Details</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                      ];
                      if (fileType === 'csv') {
                        const csv = Papa.unparse(sampleData);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sample_import.csv';
                        a.click();
                      } else {
                        const ws = XLSX.utils.json_to_sheet(sampleData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Sample");
                        XLSX.writeFile(wb, 'sample_import.xlsx');
                      }
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
                      <li key={idx}>{name}</li>
                    ))}
                    {unregisteredProducts.length > 3 && (
                      <li>+ {unregisteredProducts.length - 3} more</li>
                    )}
                  </ul>
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
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        value={item.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        required
                      >
                        <option value="">Select product...</option>
                        {products
                          .filter(p => !lineItems.some(li => li.productId === p._id && li.productId !== item.productId))
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

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>{error}</div>
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

      {/* Product Registration Modal */}
      {showProductFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Register New Product</h3>
                    <ProductForm
                      product={null}
                      initialData={{ 
                        name: unregisteredProducts[0] || '',
                        category,
                        variant: ''
                      }}
                      onCreate={(product) => {
                        setProducts([...products, product]);
                        setUnregisteredProducts(unregisteredProducts.filter(p => p !== product.name));
                        if (unregisteredProducts.length <= 1) {
                          setShowProductFormModal(false);
                        }
                      }}
                      onClose={() => setShowProductFormModal(false)}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowProductFormModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceOtherProductsForm;