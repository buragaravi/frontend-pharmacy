import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiPlus, FiSave, FiFile, FiTrash2, FiDownload, FiRefreshCw } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const UnifiedInvoiceForm = () => {
  // Category state
  const [activeCategory, setActiveCategory] = useState('chemical');
  
  // Common form state
  const [formData, setFormData] = useState({
    vendor: '',
    invoiceNumber: '',
    invoiceDate: '',
    totalAmount: '',
    description: '',
    status: 'pending'
  });

  // Additional state for vendors and products
  const [vendors, setVendors] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [voucherId, setVoucherId] = useState('');

  // Product items state
  const [items, setItems] = useState([]);
  
  // Draft management
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showProductRegistration, setShowProductRegistration] = useState(false);
  
  // Product registration state
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    casNumber: '',
    catalogNumber: '',
    purity: '',
    grade: '',
    molecularFormula: '',
    molecularWeight: '',
    physicalState: '',
    storageCondition: '',
    hazardClass: '',
    supplier: '',
    type: '',
    specifications: '',
    model: '',
    serialNumber: '',
    warranty: '',
    calibrationDate: '',
    nextCalibrationDate: '',
    material: '',
    capacity: '',
    dimensions: '',
    weight: '',
    manufacturer: '',
    category: ''
  });

  // Category definitions
  const categories = [
    { id: 'chemical', label: 'Chemicals', icon: '🧪' },
    { id: 'glassware', label: 'Glassware', icon: '🧊' },
    { id: 'equipment', label: 'Equipment', icon: '⚙️' },
    { id: 'others', label: 'Others', icon: '📦' }
  ];

  // Dynamic field configurations for different categories
  const getFieldsForCategory = (category) => {
    const commonFields = ['name', 'brand', 'quantity', 'unitPrice', 'totalPrice'];
    
    switch (category) {
      case 'chemical':
        return [
          ...commonFields,
          'casNumber', 'catalogNumber', 'purity', 'grade', 
          'molecularFormula', 'molecularWeight', 'physicalState', 
          'storageCondition', 'hazardClass', 'supplier'
        ];
      case 'glassware':
        return [
          ...commonFields,
          'type', 'material', 'capacity', 'dimensions', 'grade'
        ];
      case 'equipment':
        return [
          ...commonFields,
          'model', 'serialNumber', 'specifications', 'warranty',
          'calibrationDate', 'nextCalibrationDate'
        ];
      case 'others':
        return [
          ...commonFields,
          'type', 'specifications', 'weight', 'dimensions', 'manufacturer'
        ];
      default:
        return commonFields;
    }
  };

  const getProductRegistrationFields = (category) => {
    switch (category) {
      case 'chemical':
        return [
          'name', 'brand', 'casNumber', 'catalogNumber', 'purity', 'grade',
          'molecularFormula', 'molecularWeight', 'physicalState',
          'storageCondition', 'hazardClass', 'supplier'
        ];
      case 'glassware':
        return [
          'name', 'brand', 'type', 'material', 'capacity', 'dimensions', 'grade'
        ];
      case 'equipment':
        return [
          'name', 'brand', 'model', 'serialNumber', 'specifications',
          'warranty', 'calibrationDate', 'nextCalibrationDate'
        ];
      case 'others':
        return [
          'name', 'brand', 'type', 'specifications', 'weight',
          'dimensions', 'manufacturer', 'category'
        ];
      default:
        return ['name', 'brand'];
    }
  };

  // Load drafts on component mount
  useEffect(() => {
    loadSavedDrafts();
    loadInitialData();
  }, []);

  // Load initial data (vendors, products, voucher ID)
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [vendorsRes, productsRes, voucherRes] = await Promise.all([
        axios.get(`${API_BASE}/vendors`),
        axios.get(`${API_BASE}/products/category/${activeCategory}`),
        axios.get(`${API_BASE}/vouchers/next?category=invoice`)
      ]);

      setVendors(vendorsRes.data || []);
      setAvailableProducts(productsRes.data || []);
      setVoucherId(voucherRes.data.voucherId || voucherRes.data.nextVoucherId || '');
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load products when category changes
  useEffect(() => {
    if (activeCategory) {
      loadProductsForCategory();
    }
  }, [activeCategory]);

  const loadProductsForCategory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/products/category/${activeCategory}`);
      setAvailableProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products for category');
    }
  };

  // Load saved drafts from localStorage
  const loadSavedDrafts = () => {
    try {
      const drafts = localStorage.getItem('invoiceDrafts');
      if (drafts) {
        setSavedDrafts(JSON.parse(drafts));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const draft = {
        id: currentDraftId || Date.now(),
        name: `Draft ${new Date().toLocaleString()}`,
        category: activeCategory,
        formData,
        items,
        savedAt: new Date().toISOString()
      };

      const existingDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
      const updatedDrafts = currentDraftId
        ? existingDrafts.map(d => d.id === currentDraftId ? draft : d)
        : [...existingDrafts, draft];

      localStorage.setItem('invoiceDrafts', JSON.stringify(updatedDrafts));
      setSavedDrafts(updatedDrafts);
      setCurrentDraftId(draft.id);
      setIsDraftMode(true);
      
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Load draft
  const loadDraft = (draft) => {
    setActiveCategory(draft.category);
    setFormData(draft.formData);
    setItems(draft.items);
    setCurrentDraftId(draft.id);
    setIsDraftMode(true);
    toast.success('Draft loaded successfully!');
  };

  // Delete draft
  const deleteDraft = (draftId) => {
    try {
      const updatedDrafts = savedDrafts.filter(d => d.id !== draftId);
      localStorage.setItem('invoiceDrafts', JSON.stringify(updatedDrafts));
      setSavedDrafts(updatedDrafts);
      
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
        setIsDraftMode(false);
      }
      
      toast.success('Draft deleted successfully!');
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // Clear items when switching categories
    setItems([]);
    setErrors({});
    // Load products for new category
    loadProductsForCategory();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      brand: '',
      quantity: '',
      unitPrice: '',
      totalPrice: 0,
      // Add category-specific fields with empty values
      ...getFieldsForCategory(activeCategory).reduce((acc, field) => {
        if (!['name', 'brand', 'quantity', 'unitPrice', 'totalPrice'].includes(field)) {
          acc[field] = '';
        }
        return acc;
      }, {})
    };
    
    setItems(prev => [...prev, newItem]);
  };

  // Remove item
  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle item input changes
  const handleItemChange = (itemId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate total price for quantity and unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
          const unitPrice = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
          updatedItem.totalPrice = (quantity * unitPrice).toFixed(2);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return items.reduce((total, item) => total + (parseFloat(item.totalPrice) || 0), 0).toFixed(2);
  };

  // Update total amount when items change
  useEffect(() => {
    const total = calculateTotalAmount();
    setFormData(prev => ({
      ...prev,
      totalAmount: total
    }));
  }, [items]);

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setIsLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('The uploaded file is empty');
        return;
      }

      // Map CSV/Excel data to items based on category
      const mappedItems = jsonData.map((row, index) => ({
        id: Date.now() + index,
        name: row.name || row.Name || row.product_name || '',
        brand: row.brand || row.Brand || row.manufacturer || '',
        quantity: row.quantity || row.Quantity || row.qty || '',
        unitPrice: row.unit_price || row.unitPrice || row['Unit Price'] || row.price || '',
        totalPrice: 0,
        // Map category-specific fields
        ...getFieldsForCategory(activeCategory).reduce((acc, field) => {
          if (!['name', 'brand', 'quantity', 'unitPrice', 'totalPrice'].includes(field)) {
            acc[field] = row[field] || row[field.toLowerCase()] || row[field.toUpperCase()] || '';
          }
          return acc;
        }, {})
      }));

      // Calculate total prices
      const itemsWithTotals = mappedItems.map(item => ({
        ...item,
        totalPrice: ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)
      }));

      setItems(itemsWithTotals);
      setUploadedFile(file);
      toast.success(`Successfully imported ${itemsWithTotals.length} items from ${file.name}`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing the uploaded file');
    } finally {
      setIsLoading(false);
    }
  };

  // Product registration handlers
  const handleProductRegistrationChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const registerProduct = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      const requiredFields = ['name', 'brand'];
      const missingFields = requiredFields.filter(field => !newProduct[field].trim());
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare product data based on category
      const productData = {
        ...newProduct,
        category: activeCategory
      };

      // Make API call to register the product
      const response = await axios.post(`${API_BASE}/products`, productData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Product registered successfully!');
      
      // Refresh available products
      loadProductsForCategory();
      
      // Reset form and close modal
      setNewProduct({
        name: '',
        brand: '',
        casNumber: '',
        catalogNumber: '',
        purity: '',
        grade: '',
        molecularFormula: '',
        molecularWeight: '',
        physicalState: '',
        storageCondition: '',
        hazardClass: '',
        supplier: '',
        type: '',
        specifications: '',
        model: '',
        serialNumber: '',
        warranty: '',
        calibrationDate: '',
        nextCalibrationDate: '',
        material: '',
        capacity: '',
        dimensions: '',
        weight: '',
        manufacturer: '',
        category: ''
      });
      setShowProductRegistration(false);
    } catch (error) {
      console.error('Error registering product:', error);
      toast.error(error.response?.data?.message || 'Failed to register product');
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required';
    if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = 'Invoice number is required';
    if (!formData.invoiceDate) newErrors.invoiceDate = 'Invoice date is required';
    if (items.length === 0) newErrors.items = 'At least one item is required';
    
    // Validate items
    items.forEach((item, index) => {
      if (!item.name.trim()) newErrors[`item_${index}_name`] = 'Product name is required';
      if (!item.quantity || parseFloat(item.quantity) <= 0) newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) newErrors[`item_${index}_unitPrice`] = 'Valid unit price is required';
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const submissionData = {
        vendor: formData.vendor,
        invoiceNumber: formData.invoiceNumber || voucherId,
        invoiceDate: formData.invoiceDate,
        totalAmount: parseFloat(calculateTotalAmount()),
        description: formData.description,
        status: formData.status,
        category: activeCategory,
        items: items.map(item => ({
          ...item,
          totalPrice: parseFloat(item.totalPrice) || 0
        }))
      };
      
      // Make API call to submit the invoice
      const response = await axios.post(`${API_BASE}/invoices`, submissionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Invoice submitted successfully!');
      
      // Get new voucher ID for next invoice
      try {
        const voucherRes = await axios.get(`${API_BASE}/vouchers/next?category=invoice`);
        setVoucherId(voucherRes.data.voucherId || voucherRes.data.nextVoucherId || '');
      } catch (voucherError) {
        console.error('Error getting next voucher ID:', voucherError);
      }
      
      // Reset form
      setFormData({
        vendor: '',
        invoiceNumber: '',
        invoiceDate: '',
        totalAmount: '',
        description: '',
        status: 'pending'
      });
      setItems([]);
      setUploadedFile(null);
      setCurrentDraftId(null);
      setIsDraftMode(false);
      setErrors({});
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to submit invoice');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vendor: '',
      invoiceNumber: '',
      invoiceDate: '',
      totalAmount: '',
      description: '',
      status: 'pending'
    });
    setItems([]);
    setUploadedFile(null);
    setCurrentDraftId(null);
    setIsDraftMode(false);
    setErrors({});
  };

  // Download template functionality
  const downloadTemplate = () => {
    const templateData = [getFieldsForCategory(activeCategory).reduce((acc, field) => {
      acc[field] = '';
      return acc;
    }, {})];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeCategory}_template`);
    XLSX.writeFile(wb, `${activeCategory}_invoice_template.xlsx`);
    toast.success('Template downloaded successfully!');
  };

  // Product search functionality
  const handleProductSearch = (itemId, searchTerm) => {
    if (!searchTerm) return;
    
    const matchedProduct = availableProducts.find(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matchedProduct) {
      // Auto-fill item with product data
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            name: matchedProduct.name,
            brand: matchedProduct.brand,
            ...getFieldsForCategory(activeCategory).reduce((acc, field) => {
              if (matchedProduct[field] && !['quantity', 'unitPrice', 'totalPrice'].includes(field)) {
                acc[field] = matchedProduct[field];
              }
              return acc;
            }, {})
          };
        }
        return item;
      }));
      toast.success('Product details auto-filled!');
    }
  };

  // Render field input based on field type
  const renderFieldInput = (item, field, value) => {
    const fieldConfig = {
      quantity: { type: 'number', step: '0.01', min: '0' },
      unitPrice: { type: 'number', step: '0.01', min: '0' },
      totalPrice: { type: 'number', step: '0.01', disabled: true },
      molecularWeight: { type: 'number', step: '0.01', min: '0' },
      purity: { type: 'number', step: '0.01', min: '0', max: '100' },
      calibrationDate: { type: 'date' },
      nextCalibrationDate: { type: 'date' },
      physicalState: { 
        type: 'select', 
        options: ['Solid', 'Liquid', 'Gas', 'Powder', 'Crystal', 'Gel']
      },
      storageCondition: { 
        type: 'select', 
        options: ['Room Temperature', 'Refrigerated (2-8°C)', 'Frozen (-20°C)', 'Dry Place', 'Dark Place', 'Inert Atmosphere']
      },
      hazardClass: { 
        type: 'select', 
        options: ['Class 1 - Explosives', 'Class 2 - Gases', 'Class 3 - Flammable Liquids', 'Class 4 - Flammable Solids', 'Class 5 - Oxidizing Substances', 'Class 6 - Toxic Substances', 'Class 7 - Radioactive', 'Class 8 - Corrosive', 'Class 9 - Miscellaneous']
      },
      grade: { 
        type: 'select', 
        options: ['ACS Grade', 'Reagent Grade', 'Technical Grade', 'Pharmaceutical Grade', 'HPLC Grade', 'GC Grade', 'Analytical Grade']
      }
    };

    const config = fieldConfig[field] || { type: 'text' };

    if (config.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleItemChange(item.id, field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select {field}</option>
          {config.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={config.type}
        value={value}
        onChange={(e) => handleItemChange(item.id, field, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        step={config.step}
        min={config.min}
        max={config.max}
        disabled={config.disabled}
        placeholder={`Enter ${field}`}
      />
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
        <p className="text-gray-600">Create invoices for chemicals, glassware, equipment, and other products</p>
      </div>

      {/* Category Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                activeCategory === category.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-medium">{category.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Draft Management */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Draft Management</h3>
          <div className="flex gap-2">
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save Draft
            </button>
            {isDraftMode && (
              <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                Draft Mode
              </span>
            )}
          </div>
        </div>
        
        {savedDrafts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedDrafts.map(draft => (
              <div key={draft.id} className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{draft.name}</h4>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Category: {categories.find(c => c.id === draft.category)?.label}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Saved: {new Date(draft.savedAt).toLocaleString()}
                </p>
                <button
                  onClick={() => loadDraft(draft)}
                  className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Load Draft
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Invoice Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher ID
              </label>
              <input
                type="text"
                value={voucherId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <select
                name="vendor"
                value={formData.vendor}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vendor ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor.name}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {errors.vendor && <p className="text-red-500 text-sm mt-1">{errors.vendor}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber || voucherId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter invoice number"
              />
              {errors.invoiceNumber && <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.invoiceDate && <p className="text-red-500 text-sm mt-1">{errors.invoiceDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                readOnly
                placeholder="Auto-calculated"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter invoice description"
              />
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">File Upload</h2>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Download Template
            </button>
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload Excel or CSV file
            </p>
            <p className="text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
            
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiFile className="text-green-600" />
                    <span className="text-green-700 font-medium">{uploadedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Registration */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Product Registration</h2>
            <button
              type="button"
              onClick={() => setShowProductRegistration(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Register New Product
            </button>
          </div>
          <p className="text-gray-600">Register new products to make them available for future invoices.</p>
        </div>

        {/* Items Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {categories.find(c => c.id === activeCategory)?.label} Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          
          {errors.items && <p className="text-red-500 text-sm mb-4">{errors.items}</p>}
          
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items added yet. Click "Add Item" to start adding products.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Item #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getFieldsForCategory(activeCategory).map(field => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {field.replace(/([A-Z])/g, ' $1').toLowerCase()} 
                          {['name', 'quantity', 'unitPrice'].includes(field) && ' *'}
                        </label>
                        {field === 'name' ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={item[field] || ''}
                              onChange={(e) => handleItemChange(item.id, field, e.target.value)}
                              onBlur={(e) => handleProductSearch(item.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter product name (auto-search available)"
                              list={`products-${item.id}`}
                            />
                            <datalist id={`products-${item.id}`}>
                              {availableProducts.map(product => (
                                <option key={product._id} value={product.name}>
                                  {product.brand} - {product.name}
                                </option>
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          renderFieldInput(item, field, item[field] || '')
                        )}
                        {errors[`item_${index}_${field}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_${field}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Form
          </button>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={saveDraft}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save as Draft
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit Invoice'}
            </button>
          </div>
        </div>
      </form>

      {/* Product Registration Modal */}
      {showProductRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Register New {categories.find(c => c.id === activeCategory)?.label.slice(0, -1)}
                </h2>
                <button
                  onClick={() => setShowProductRegistration(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getProductRegistrationFields(activeCategory).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      {['name', 'brand'].includes(field) && ' *'}
                    </label>
                    {field === 'calibrationDate' || field === 'nextCalibrationDate' ? (
                      <input
                        type="date"
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : field === 'physicalState' ? (
                      <select
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select physical state</option>
                        <option value="Solid">Solid</option>
                        <option value="Liquid">Liquid</option>
                        <option value="Gas">Gas</option>
                        <option value="Powder">Powder</option>
                        <option value="Crystal">Crystal</option>
                        <option value="Gel">Gel</option>
                      </select>
                    ) : field === 'storageCondition' ? (
                      <select
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select storage condition</option>
                        <option value="Room Temperature">Room Temperature</option>
                        <option value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</option>
                        <option value="Frozen (-20°C)">Frozen (-20°C)</option>
                        <option value="Dry Place">Dry Place</option>
                        <option value="Dark Place">Dark Place</option>
                        <option value="Inert Atmosphere">Inert Atmosphere</option>
                      </select>
                    ) : field === 'hazardClass' ? (
                      <select
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select hazard class</option>
                        <option value="Class 1 - Explosives">Class 1 - Explosives</option>
                        <option value="Class 2 - Gases">Class 2 - Gases</option>
                        <option value="Class 3 - Flammable Liquids">Class 3 - Flammable Liquids</option>
                        <option value="Class 4 - Flammable Solids">Class 4 - Flammable Solids</option>
                        <option value="Class 5 - Oxidizing Substances">Class 5 - Oxidizing Substances</option>
                        <option value="Class 6 - Toxic Substances">Class 6 - Toxic Substances</option>
                        <option value="Class 7 - Radioactive">Class 7 - Radioactive</option>
                        <option value="Class 8 - Corrosive">Class 8 - Corrosive</option>
                        <option value="Class 9 - Miscellaneous">Class 9 - Miscellaneous</option>
                      </select>
                    ) : field === 'grade' ? (
                      <select
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select grade</option>
                        <option value="ACS Grade">ACS Grade</option>
                        <option value="Reagent Grade">Reagent Grade</option>
                        <option value="Technical Grade">Technical Grade</option>
                        <option value="Pharmaceutical Grade">Pharmaceutical Grade</option>
                        <option value="HPLC Grade">HPLC Grade</option>
                        <option value="GC Grade">GC Grade</option>
                        <option value="Analytical Grade">Analytical Grade</option>
                      </select>
                    ) : (
                      <input
                        type={['molecularWeight', 'purity'].includes(field) ? 'number' : 'text'}
                        name={field}
                        value={newProduct[field]}
                        onChange={handleProductRegistrationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        step={['molecularWeight', 'purity'].includes(field) ? '0.01' : undefined}
                        min={['molecularWeight', 'purity'].includes(field) ? '0' : undefined}
                        max={field === 'purity' ? '100' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowProductRegistration(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={registerProduct}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registering...' : 'Register Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedInvoiceForm;
