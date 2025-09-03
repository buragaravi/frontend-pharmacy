import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import ProductForm from '../products/ProductForm';
import SafeButton from '../../components/SafeButton';

// Add CSS for flash highlight animation
const flashHighlightStyle = `
  @keyframes flashHighlight {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  
  .flash-highlight {
    animation: flashHighlight 1s ease-in-out 2;
    border: 2px solid #ef4444 !important;
  }
`;

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const InvoiceOtherProductsForm = ({ category, onSuccess }) => {
  // Helper function to get category display name
  const getCategoryName = () => {
    const categoryNames = {
      glassware: 'Glassware',
      equipment: 'Equipment', 
      others: 'Other Products'
    };
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // ==================== STATE MANAGEMENT ====================
  // Vendor and Product Data
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [voucherId, setVoucherId] = useState('');
  
  // Add style tag for flash highlight animation
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = flashHighlightStyle;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Form Data
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [lineItems, setLineItems] = useState([
    { productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', warranty: '' }
  ]);
  
  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // File Upload State
  const [fileType, setFileType] = useState('csv');
  const [csvError, setCsvError] = useState('');
  const [unregisteredProducts, setUnregisteredProducts] = useState([]);
  
  // Product Registration Modal State
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [productFormIndex, setProductFormIndex] = useState(0);
  const [productFormError, setProductFormError] = useState('');
  const [productFormLoading, setProductFormLoading] = useState(false);

  // Draft Management State
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const DRAFT_KEY = `invoiceOtherProductsFormDraft_${category}`;

  // ==================== DATA FETCHING ====================

  // Fetch data on mount with comprehensive error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(''); // Clear previous errors
        const [vendorsRes, productsRes, voucherRes] = await Promise.all([
          axios.get(`${API_BASE}/vendors`),
          axios.get(`${API_BASE}/products/category/${category}`),
          axios.get(`${API_BASE}/vouchers/next?category=invoice`)
        ]);
        
        // Set vendors with error handling
        const vendorsList = vendorsRes.data?.vendors || vendorsRes.data?.data || vendorsRes.data || [];
        setVendors(Array.isArray(vendorsList) ? vendorsList : []);
        
        // Set products with error handling
        const productsList = productsRes.data?.data || productsRes.data || [];
        setProducts(Array.isArray(productsList) ? productsList : []);
        
        // Set voucher ID with error handling
        setVoucherId(voucherRes.data?.voucherId || voucherRes.data?.nextVoucherId || '');
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(`Failed to load initial data: ${err.response?.data?.message || err.message}`);
      }
    };
    fetchData();
  }, [category]);

  // ==================== EVENT HANDLERS ====================

  // Handle vendor select (lock after selection)
  const handleVendorSelect = (e) => {
    const vendorId = e.target.value;
    if (!vendorId) {
      setSelectedVendor(null);
      return;
    }
    const vendor = vendors.find(v => v._id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setError(''); // Clear any previous errors
    }
  };

  // Prevent duplicate product selection
  const selectedProductIds = lineItems.map(item => item.productId).filter(Boolean);

  // Handle product selection with error handling
  const handleProductSelect = (idx, productId) => {
    if (!productId) {
      setLineItems(items => items.map((item, i) =>
        i === idx ? {
          ...item,
          productId: '',
          name: '',
          variant: '',
          thresholdValue: '',
          quantity: '',
          totalPrice: '',
          pricePerUnit: '',
          warranty: item.warranty || ''  // Preserve warranty when clearing product
        } : item
      ));
      return;
    }
    
    const product = products.find(p => p._id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    
    setLineItems(items => items.map((item, i) =>
      i === idx ? {
        ...item,
        productId: product._id,
        name: product.name || '',
        variant: product.variant || product.unit || '',
        thresholdValue: product.thresholdValue || '',
        quantity: '',
        totalPrice: '',
        pricePerUnit: '',
        warranty: item.warranty || ''  // Preserve warranty when setting new product
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
      pricePerUnit: '',
      warranty: ''  // Add warranty field (optional)
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

  // ==================== FILE UPLOAD HANDLING ====================
  // Handle file upload with enhanced validation
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
      const totalPrice = normalizedRow['totalprice'] || normalizedRow['total'] || 0; // Default to '0' if missing
      const pricePerUnit = normalizedRow['priceperunit'] || 
        (quantity && totalPrice && Number(totalPrice) > 0 ? (Number(totalPrice) / Number(quantity)).toFixed(2) : '0');
      const warranty = normalizedRow['warranty'] || ''; // Optional warranty field

      processedItems.push({
        productId: product._id,
        name: product.name,
        variant: product.variant || product.unit || '',
        thresholdValue: product.thresholdValue,
        quantity: quantity.toString(),
        totalPrice: totalPrice.toString(),
        pricePerUnit: pricePerUnit.toString(),
        warranty: warranty // Include warranty in processed items
      });
    });

    setLineItems(processedItems.length > 0 ? 
      processedItems : 
      [{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', warranty: '' }]
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

  // Function to find duplicate product IDs in line items
  const findDuplicateProductIds = () => {
    const productIds = lineItems.map(item => item.productId).filter(id => id); // Filter out empty IDs
    const uniqueIds = new Set();
    const duplicateIds = [];
    
    productIds.forEach(id => {
      if (uniqueIds.has(id)) {
        duplicateIds.push(id);
      } else {
        uniqueIds.add(id);
      }
    });
    
    return [...new Set(duplicateIds)]; // Return unique duplicate IDs
  };

  // ==================== FORM SUBMISSION ====================
  // Handle form submission with comprehensive validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Form validation
    if (!selectedVendor) {
      setError('Please select a vendor');
      setSubmitting(false);
      return;
    }
    
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      setSubmitting(false);
      return;
    }
    
    if (!invoiceDate) {
      setError('Please select an invoice date');
      setSubmitting(false);
      return;
    }
    
    if (lineItems.length === 0 || !lineItems.some(item => item.productId && item.quantity && item.totalPrice)) {
      setError('Please add at least one valid line item');
      setSubmitting(false);
      return;
    }
    
    // Check for duplicate products
    const duplicateIds = findDuplicateProductIds();
    if (duplicateIds.length > 0) {
      setError('Please fix duplicate products before submitting.');
      
      // Scroll to the first duplicate item
      setTimeout(() => {
        const firstDuplicateIndex = lineItems.findIndex(item => item.productId === duplicateIds[0]);
        const lineItemElements = document.querySelectorAll('.line-item-container');
        
        if (lineItemElements[firstDuplicateIndex]) {
          lineItemElements[firstDuplicateIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          lineItemElements[firstDuplicateIndex].classList.add('flash-highlight');
          setTimeout(() => {
            lineItemElements[firstDuplicateIndex].classList.remove('flash-highlight');
          }, 2000);
        }
      }, 100);
      
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const invoiceData = {
        vendorId: selectedVendor._id,
        voucherId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        lineItems: lineItems
          .filter(item => item.productId && item.quantity && item.totalPrice)
          .map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            totalPrice: Number(item.totalPrice),
            pricePerUnit: Number(item.pricePerUnit) || 0,
            warranty: item.warranty || null  // Include warranty field
          })),
        totalAmount: totalInvoicePrice,
        category
      };

      const response = await axios.post(`${API_BASE}/invoices/${category}`, invoiceData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Invoice created successfully!');
      
      // Clear form
      setSelectedVendor(null);
      setInvoiceNumber('');
      setInvoiceDate('');
      setLineItems([{
        productId: '', name: '', variant: '', thresholdValue: '', 
        quantity: '', totalPrice: '', pricePerUnit: '', warranty: ''
      }]);
      
      // Clear draft
      localStorage.removeItem(DRAFT_KEY);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

    } catch (err) {
      console.error('Invoice submission error:', err);
      setError(err.response?.data?.message || 'Failed to create invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate sample file - Enhanced version
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
        totalPrice: 800,
        vendor: "ABC Suppliers"
      },
      {
        productName: "Test Tube",
        quantity: 10,
        totalPrice: 500,
        vendor: "ABC Suppliers"
      }
    ];

    if (fileType === 'csv') {
      const csv = Papa.unparse(sampleData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sample-${category}-invoice.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, getCategoryName());
        XLSX.writeFile(workbook, `sample-${category}-invoice.xlsx`);
      } catch (error) {
        setCsvError('Failed to generate Excel file');
      }
    }
  };

  // ==================== DRAFT MANAGEMENT ====================
  // Save draft to localStorage (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      const draft = {
        selectedVendor,
        invoiceNumber,
        invoiceDate,
        lineItems,
        fileType
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(handler);
  }, [selectedVendor, invoiceNumber, invoiceDate, lineItems, fileType, DRAFT_KEY]);

  // Rehydrate draft on mount
  useEffect(() => {
    // Only show prompt if draft exists AND has meaningful data
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        const hasData = (
          (data.selectedVendor && Object.keys(data.selectedVendor).length > 0) ||
          data.invoiceNumber ||
          data.invoiceDate ||
          (Array.isArray(data.lineItems) && data.lineItems.some(item => 
            item.productId || item.name || item.variant || item.quantity || item.totalPrice || item.pricePerUnit || item.warranty
          ))
        );
        
        if (hasData) {
          // Restore the data
          if (data.selectedVendor) setSelectedVendor(data.selectedVendor);
          if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
          if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
          if (data.lineItems) setLineItems(data.lineItems);
          if (data.fileType) setFileType(data.fileType);
          // Show the draft prompt
          setShowDraftPrompt(true);
        }
      } catch {}
    }
  }, [DRAFT_KEY]);

  // Handle draft actions
  const handleContinueDraft = () => {
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftPrompt(false);
    setSelectedVendor(null);
    setInvoiceNumber('');
    setInvoiceDate('');
    setLineItems([{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', warranty: '' }]);
  };

  // Warn on tab close if draft exists with meaningful data
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const data = JSON.parse(draft);
          const hasData = (
            (data.selectedVendor && Object.keys(data.selectedVendor).length > 0) ||
            data.invoiceNumber ||
            data.invoiceDate ||
            (Array.isArray(data.lineItems) && data.lineItems.some(item => 
              item.productId || item.name || item.variant || item.quantity || item.totalPrice || item.pricePerUnit || item.warranty
            ))
          );
          
          if (hasData) {
            e.preventDefault();
            e.returnValue = '';
          }
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [DRAFT_KEY]);

  // ==================== PRODUCT REGISTRATION ====================
  // Product registration logic with enhanced error handling
  const handleCreateProductFromInvoice = async (productData) => {
    setProductFormLoading(true);
    setProductFormError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/products`, productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newProduct = res.data.data || res.data;
      setProducts(prev => [...prev, newProduct]);
      
      // Remove the successfully registered product from unregistered list
      setUnregisteredProducts(prev => 
        prev.filter((_, i) => i !== productFormIndex)
      );
      
      // If there are more products to register, move to next
      if (productFormIndex < unregisteredProducts.length - 1) {
        setProductFormIndex(i => i + 1);
      } else {
        setShowProductFormModal(false);
        setProductFormIndex(0);
      }
    } catch (err) {
      setProductFormError(err.response?.data?.message || 'Failed to register product');
    } finally {
      setProductFormLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Draft Prompt Dialog */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200 my-4">
            <div className="text-xl font-bold mb-3 text-gray-800">Continue where you left off?</div>
            <div className="mb-6 text-gray-600">A draft {getCategoryName().toLowerCase()} invoice was found. Would you like to continue editing it or discard?</div>
            <div className="flex justify-center gap-4">
              <SafeButton 
                variant="primary"
                onClick={() => setShowDraftPrompt(false)}
              >
                Continue Editing
              </SafeButton>
              <SafeButton 
                variant="secondary"
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setShowDraftPrompt(false);
                  setSelectedVendor(null);
                  setInvoiceNumber('');
                  setInvoiceDate('');
                  setLineItems([{ productId: '', name: '', variant: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', warranty: '' }]);
                }}
              >
                Discard Draft
              </SafeButton>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-none mx-auto bg-white overflow-hidden relative">
        {/* Enhanced Header Section */}
        <div className="relative p-2 rounded-3xl mt-4 text-white overflow-hidden bg-blue-600">
          <div className="absolute inset-0 bg-blue-800/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md">
                  {/* Dynamic icon based on category */}
                  {category === 'glassware' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                    </svg>
                  )}
                  {category === 'equipment' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {category === 'others' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold mb-2">
                    {getCategoryName()} Invoice
                  </h1>
                  <p className="text-blue-100 text-lg">Create and manage your {getCategoryName().toLowerCase()} invoices</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="px-6 py-3 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md">
                  <div className="text-sm text-blue-100">Voucher ID</div>
                  <div className="text-lg font-bold">{voucherId || 'Loading...'}</div>
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

        {/* Form Content */}
        <div className="p-6 bg-white/80 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Enhanced Alert Messages */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-lg shadow-sm flex items-start">
                <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-xs font-medium">
                  {error}
                  {error && error.includes('duplicate') && (
                    <button 
                      type="button"
                      onClick={() => {
                        const duplicateIds = findDuplicateProductIds();
                        if (duplicateIds.length > 0) {
                          const firstDuplicateIndex = lineItems.findIndex(item => item.productId === duplicateIds[0]);
                          if (firstDuplicateIndex !== -1) {
                            const element = document.querySelectorAll('.line-item-container')[firstDuplicateIndex];
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.classList.add('flash-highlight');
                              setTimeout(() => {
                                element.classList.remove('flash-highlight');
                              }, 2000);
                            }
                          }
                        }
                      }}
                      className="block mt-2 text-blue-600 hover:text-blue-800 underline text-xs font-medium"
                    >
                      Click here to view duplicate items
                    </button>
                  )}
                </div>
              </div>
            )}
            {success && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-3 py-2 rounded-lg shadow-sm flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-xs font-medium">{success}</div>
              </div>
            )}

            {/* Enhanced Single Row: Vendor, Invoice & File Upload Section */}
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                
                {/* Vendor Information */}
                <div className="order-1">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800">Vendor Information</h3>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Vendor *
                      </label>
                      {selectedVendor ? (
                        <div className="space-y-2">
                          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="font-medium text-gray-800 text-xs sm:text-sm">{selectedVendor.name || 'Unknown Vendor'}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              <div>Vendor Code: <span className="font-mono font-medium">{selectedVendor.vendorCode || 'N/A'}</span></div>
                              {selectedVendor.companyName && (
                                <div className="mt-1 hidden sm:block">Company: {selectedVendor.companyName}</div>
                              )}
                              {selectedVendor.contactNumber && (
                                <div className="mt-1 hidden md:block">Contact: {selectedVendor.contactNumber}</div>
                              )}
                              {selectedVendor.email && (
                                <div className="mt-1 hidden lg:block">Email: {selectedVendor.email}</div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedVendor(null)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors duration-200 text-xs"
                          >
                            Change Vendor
                          </button>
                        </div>
                      ) : (
                        <select
                          value=""
                          onChange={handleVendorSelect}
                          required
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs sm:text-sm"
                        >
                          <option value="">Choose a vendor...</option>
                          {vendors.length > 0 ? vendors.map(vendor => (
                            <option key={vendor._id} value={vendor._id}>
                              {vendor.name}{vendor.companyName ? ` - ${vendor.companyName}` : ''}
                            </option>
                          )) : (
                            <option value="" disabled>No vendors available</option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="order-2 sm:order-2">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1 bg-green-100 rounded-md">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800">Invoice Details</h3>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Voucher ID
                      </label>
                      <input
                        type="text"
                        value={voucherId}
                        disabled
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-600 font-mono text-xs sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Invoice Date *
                      </label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 text-xs sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Invoice Number *
                      </label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 text-xs sm:text-sm"
                        placeholder="Enter invoice number"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="order-3 sm:order-3 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800">Bulk Import from File</h3>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">File Format</label>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            className="form-radio h-3 w-3 text-blue-600"
                            name="fileType"
                            value="csv"
                            checked={fileType === 'csv'}
                            onChange={() => setFileType('csv')}
                          />
                          <span className="ml-1 text-xs font-medium">CSV</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            className="form-radio h-3 w-3 text-blue-600"
                            name="fileType"
                            value="excel"
                            checked={fileType === 'excel'}
                            onChange={() => setFileType('excel')}
                          />
                          <span className="ml-1 text-xs font-medium">Excel</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Upload File</label>
                      <label className="flex flex-col items-center justify-center w-full h-12 sm:h-16 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className="w-3 sm:w-4 h-3 sm:h-4 mb-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-xs text-blue-600 font-medium">Click to upload</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{fileType === 'csv' ? 'CSV' : 'XLSX/XLS'} files</p>
                        </div>
                        <input
                          type="file"
                          accept={fileType === 'csv' ? '.csv' : '.xlsx,.xls'}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    <div className="hidden md:block">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Template Guide</label>
                      <div className="bg-blue-100/50 p-2 rounded-lg h-10 sm:h-12 flex flex-col justify-center">
                        <h4 className="text-xs font-medium text-blue-800 mb-1">Required:</h4>
                        <div className="text-xs text-blue-700">
                          <p>• Name, Quantity, Total Price</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {csvError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <svg className="w-3 h-3 text-red-500 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-red-700">{csvError}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fully Responsive Line Items Section */}
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-blue-100 rounded-md">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-800">{category.charAt(0).toUpperCase() + category.slice(1)} Products</h3>
              </div>
              
              {/* Mobile Layout (320px - 639px) */}
              <div className="block sm:hidden space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={idx} className={`line-item-container bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border ${duplicateProductIds.has(item.productId) ? 'border-red-500 bg-red-50' : 'border-gray-200'} relative shadow-sm`}>
                    {duplicateProductIds.has(item.productId) && (
                      <div className="absolute -top-3 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Duplicate Product
                      </div>
                    )}
                    {/* Remove button for mobile */}
                    {lineItems.length > 1 && (
                      <button 
                        type="button" 
                        className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 z-10" 
                        onClick={() => removeLineItem(idx)} 
                        title="Remove product"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Mobile Grid Layout */}
                    <div className="grid grid-cols-2 gap-2 pr-6">
                      {/* Product Selection - Full Width */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          required
                          className="w-full px-2 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                        >
                          <option value="">Select product...</option>
                          {products
                            .filter(p => !selectedProductIds.includes(p._id) || p._id === item.productId)
                            .map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      {/* Variant field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Variant</label>
                        <input
                          type="text"
                          value={item.variant}
                          onChange={(e) => handleLineItemChange(idx, 'variant', e.target.value)}
                          className="w-full px-2 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                          placeholder="Variant"
                        />
                      </div>
                      
                      {/* Threshold field removed as requested */}
                      
                      {/* Quantity & Total Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          required
                          min="1"
                          step="0.01"
                          className="w-full px-2 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                          placeholder="Qty"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total (₹) *</label>
                        <input
                          type="number"
                          value={item.totalPrice}
                          onChange={(e) => handleLineItemChange(idx, 'totalPrice', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                          placeholder="Total"
                        />
                      </div>
                      
                      {/* Unit Price - Readonly */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                        <input 
                          type="text" 
                          className="w-full px-2 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-600 text-xs" 
                          value={item.pricePerUnit ? `₹${item.pricePerUnit}` : ''} 
                          readOnly 
                          placeholder="Auto-calculated"
                        />
                      </div>
                      
                      {/* Warranty for mobile */}
                      {(category === 'equipment' || category === 'glassware') && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Warranty <span className="text-gray-500">(Optional)</span>
                          </label>
                          <input
                            type="date"
                            value={item.warranty}
                            onChange={(e) => handleLineItemChange(idx, 'warranty', e.target.value)}
                            className="w-full px-2 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tablet and Desktop Layout (640px+) */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <div className="space-y-2" style={{ minWidth: (category === 'equipment' || category === 'glassware') ? '1200px' : '1000px' }}>
                    {lineItems.map((item, idx) => (
                      <div key={idx} className={`line-item-container grid gap-1 sm:gap-2 items-end bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2 border ${duplicateProductIds.has(item.productId) ? 'border-red-500 bg-red-50' : 'border-gray-200'} relative hover:shadow-md transition-shadow duration-200 ${
                        (category === 'equipment' || category === 'glassware') 
                          ? 'grid-cols-12 md:grid-cols-14 lg:grid-cols-16 xl:grid-cols-18 2xl:grid-cols-20' 
                          : 'grid-cols-12 md:grid-cols-14 lg:grid-cols-16'
                      }`}>
                        {duplicateProductIds.has(item.productId) && (
                          <div className="absolute -top-3 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            Duplicate Product
                          </div>
                        )}
                        
                        {/* Product Selection */}
                        <div className={`${(category === 'equipment' || category === 'glassware') ? 'col-span-4 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-4' : 'col-span-4 md:col-span-3 lg:col-span-4'}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            required
                            className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                          >
                            <option value="">Select...</option>
                            {products
                              .filter(p => !selectedProductIds.includes(p._id) || p._id === item.productId)
                              .map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        {/* Variant */}
                        <div className={`${(category === 'equipment' || category === 'glassware') ? 'col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2' : 'col-span-2 md:col-span-2 lg:col-span-2'}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Variant</label>
                          <input
                            type="text"
                            value={item.variant}
                            onChange={(e) => handleLineItemChange(idx, 'variant', e.target.value)}
                            className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                            placeholder="Variant"
                          />
                        </div>
                        
                        {/* Threshold field removed as requested */}
                        
                        {/* Quantity */}
                        <div className={`${(category === 'equipment' || category === 'glassware') ? 'col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3' : 'col-span-3 md:col-span-3 lg:col-span-3'}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                            required
                            min="1"
                            step="0.01"
                            className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                            placeholder="Qty"
                          />
                        </div>
                        
                        {/* Total Price */}
                        <div className={`${(category === 'equipment' || category === 'glassware') ? 'col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2' : 'col-span-2 md:col-span-2 lg:col-span-2'}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total (₹)</label>
                          <input
                            type="number"
                            value={item.totalPrice}
                            onChange={(e) => handleLineItemChange(idx, 'totalPrice', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                            placeholder="Total"
                          />
                        </div>
                        
                        {/* Price Per Unit */}
                        <div className={`${(category === 'equipment' || category === 'glassware') ? 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2' : 'col-span-1 md:col-span-2 lg:col-span-2'}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                          <input 
                            type="text" 
                            className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-600 text-xs" 
                            value={item.pricePerUnit ? `₹${item.pricePerUnit}` : ''} 
                            readOnly 
                            placeholder="Auto"
                          />
                        </div>
                        
                        {/* Warranty (only for equipment and glassware) */}
                        {(category === 'equipment' || category === 'glassware') && (
                          <div className="col-span-12 md:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5 md:col-start-auto">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Warranty <span className="text-gray-500">(Optional)</span>
                            </label>
                            <input
                              type="date"
                              value={item.warranty}
                              onChange={(e) => handleLineItemChange(idx, 'warranty', e.target.value)}
                              className="w-full px-1 sm:px-2 py-1.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs"
                            />
                          </div>
                        )}
                        
                        {/* Remove button */}
                        {lineItems.length > 1 && (
                          <button 
                            type="button" 
                            className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 z-10" 
                            onClick={() => removeLineItem(idx)} 
                            title="Remove product"
                          >
                            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fully Responsive Total and Submit Section */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-2 sm:p-3 md:p-4 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                <div className="text-lg sm:text-xl font-bold text-blue-800 order-2 sm:order-1">
                  Total: ₹{totalInvoicePrice.toFixed(2)}
                </div>
                
                {/* Buttons Container - Always side by side */}
                <div className="flex flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                  {/* Add Product Button - Show on all screens */}
                  <SafeButton
                    type="button"
                    onClick={addLineItem}
                    variant="success"
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden xs:inline">Add Product</span>
                    <span className="xs:hidden">Add</span>
                  </SafeButton>
                  
                  {/* Submit Button */}
                  <SafeButton
                    type="submit"
                    disabled={submitting || !selectedVendor || !invoiceNumber || !invoiceDate || lineItems.some(item => !item.productId || !item.quantity || !item.totalPrice)}
                    variant="primary"
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-3 sm:h-4 w-3 sm:w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden xs:inline">Creating Invoice...</span>
                        <span className="xs:hidden">Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden xs:inline">Create Invoice</span>
                        <span className="xs:hidden">Create</span>
                      </>
                    )}
                  </SafeButton>
                </div>
              </div>
            </div>

            {/* Enhanced Unregistered Products Alert */}
            {unregisteredProducts.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-medium text-yellow-800 mb-1">
                      Unregistered Products Found
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      {unregisteredProducts.length} products from your file are not registered in the system.
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 mb-3">
                      <h4 className="font-medium text-yellow-800 mb-2 text-sm">Products to Register:</h4>
                      <ul className="list-disc pl-4 text-sm text-yellow-700 space-y-0.5">
                        {unregisteredProducts.slice(0, 5).map((product, idx) => (
                          <li key={idx}>{typeof product === 'string' ? product : product.name}</li>
                        ))}
                        {unregisteredProducts.length > 5 && (
                          <li className="text-yellow-600">... and {unregisteredProducts.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                    <SafeButton
                      type="button"
                      onClick={() => {
                        setProductFormIndex(0);
                        setShowProductFormModal(true);
                      }}
                      variant="warning"
                      size="sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Register Missing Products
                    </SafeButton>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Enhanced Product Registration Modal */}
      {showProductFormModal && unregisteredProducts.length > 0 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 relative my-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-600 text-white p-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">
                    Register {getCategoryName()} Product
                  </h3>
                  <p className="text-blue-100 mt-1 text-sm">
                    {productFormIndex + 1} of {unregisteredProducts.length} products
                  </p>
                </div>
                <SafeButton
                  onClick={() => setShowProductFormModal(false)}
                  variant="secondary"
                  size="sm"
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </SafeButton>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {productFormError && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-start">
                  <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm font-medium">{productFormError}</div>
                </div>
              )}

              <ProductForm
                category={category}
                initialData={unregisteredProducts[productFormIndex]}
                onSubmit={handleCreateProductFromInvoice}
                submitting={productFormLoading}
                onClose={() => setShowProductFormModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceOtherProductsForm;