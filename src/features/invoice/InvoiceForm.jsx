import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InvoiceOtherProductsForm from './InvoiceOtherProductsForm';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ProductForm from '../products/ProductForm';
import Swal from 'sweetalert2';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const InvoiceForm = () => {
    // State for vendors, products, voucherId, form, errors
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [voucherId, setVoucherId] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [lineItems, setLineItems] = useState([
        { productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showOtherForm, setShowOtherForm] = useState(false);
    const [otherCategory, setOtherCategory] = useState('glassware');
    const [csvError, setCsvError] = useState('');
    const [unregisteredProducts, setUnregisteredProducts] = useState([]);
    const [fileType, setFileType] = useState('csv'); // 'csv' or 'excel'

    // Modal state for product registration
    const [showProductFormModal, setShowProductFormModal] = useState(false);
    const [productFormIndex, setProductFormIndex] = useState(0);
    const [productFormError, setProductFormError] = useState('');
    const [productFormLoading, setProductFormLoading] = useState(false);

    // Fetch vendors
    useEffect(() => {
        axios.get(`${API_BASE}/vendors`)
            .then(res => setVendors(res.data.vendors || res.data.data || []))
            .catch(() => setVendors([]));
    }, []);

    // Fetch products (chemicals only)
    useEffect(() => {
        axios.get(`${API_BASE}/products/category/chemical`)
            .then(res => setProducts(res.data.data || []))
            .catch(() => setProducts([]));
    }, []);

    // Fetch next voucherId for invoice
    useEffect(() => {
        axios.get(`${API_BASE}/vouchers/next?category=invoice`)
            .then(res => setVoucherId(res.data.voucherId || res.data.nextVoucherId || ''))
            .catch(() => setVoucherId(''));
    }, []);

    // Handle vendor select (lock after selection)
    const handleVendorSelect = (e) => {
        const vendor = vendors.find(v => v._id === e.target.value);
        setSelectedVendor(vendor);
    };

    // Handle line item product select
    const handleProductSelect = (idx, productId) => {
        const product = products.find(p => p._id === productId);
        setLineItems(items => items.map((item, i) =>
            i === idx
                ? {
                    ...item,
                    productId: product._id,
                    name: product.name,
                    unit: product.unit,
                    thresholdValue: product.thresholdValue,
                    quantity: '',
                    totalPrice: '',
                    pricePerUnit: '',
                    expiryDate: ''
                }
                : item
        ));
    };

    // Prevent duplicate product selection
    const selectedProductIds = lineItems.map(item => item.productId).filter(Boolean);

    // Handle line item change
    const handleLineItemChange = (idx, field, value) => {
        setLineItems(items => items.map((item, i) => {
            if (i !== idx) return item;
            
            let updated = { ...item, [field]: value };
            
            // Auto-calculate pricePerUnit when quantity or totalPrice changes
            if (field === 'quantity' || field === 'totalPrice') {
                const qty = Number(field === 'quantity' ? value : item.quantity);
                const total = Number(field === 'totalPrice' ? value : item.totalPrice);
                updated.pricePerUnit = qty && total ? (total / qty).toFixed(2) : '';
            }
            
            return updated;
        }));
    };

    // Add line item
    const addLineItem = () => {
        setLineItems([...lineItems, { productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }]);
    };

    // Remove line item
    const removeLineItem = (idx) => {
        setLineItems(items => items.filter((_, i) => i !== idx));
    };

    // Calculate total invoice price
    const totalInvoicePrice = lineItems.reduce(
        (sum, item) => sum + (Number(item.totalPrice) || 0),
        0
    );

    // Parse CSV file
    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processFileData(results.data);
            },
            error: (error) => {
                setCsvError('Error reading CSV file: ' + error.message);
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
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                processFileData(jsonData);
            } catch (error) {
                setCsvError('Error reading Excel file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Handle file upload (both CSV and Excel)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setCsvError('');
        setUnregisteredProducts([]);
        
        // Validate file extension based on selected fileType
        if (fileType === 'csv' && !file.name.match(/\.(csv)$/i)) {
            setCsvError('Please upload a valid CSV file');
            return;
        }
        if (fileType === 'excel' && !file.name.match(/\.(xlsx|xls)$/i)) {
            setCsvError('Please upload a valid Excel file (xlsx or xls)');
            return;
        }

        if (fileType === 'csv') {
            parseCSV(file);
        } else {
            parseExcel(file);
        }
    };

    // Process data from either CSV or Excel
    const processFileData = (data) => {
        if (data.length === 0) {
            setCsvError('File is empty');
            return;
        }

        // Define required and optional fields
        const requiredFields = ['productName', 'quantity', 'totalPrice', 'expiryDate'];
        const optionalFields = ['vendor', 'invoiceNumber', 'invoiceDate'];
        
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
            // Normalize field names (case insensitive)
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase()] = row[key];
            });

            const productName = normalizedRow['productname'] || '';
            const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
            
            if (!product) {
                if (productName) missingProducts.push(productName);
                return; // skip this row
            }
            
            const quantity = Number(normalizedRow['quantity']) || 0;
            const totalPrice = Number(normalizedRow['totalprice']) || 0;
            const pricePerUnit = quantity && totalPrice ? (totalPrice / quantity).toFixed(2) : '';
            
            processedItems.push({
                productId: product._id,
                name: product.name,
                unit: product.unit,
                thresholdValue: product.thresholdValue,
                quantity: quantity.toString(),
                totalPrice: totalPrice.toString(),
                pricePerUnit: pricePerUnit,
                expiryDate: normalizedRow['expirydate'] || ''
            });
        });

        setLineItems(processedItems.length > 0 ? 
            processedItems : 
            [{ productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }]
        );
        
        setUnregisteredProducts([...new Set(missingProducts)]); // Remove duplicates
        
        // Extract optional fields if available
        const firstRow = data[0];
        const normalizedFirstRow = {};
        Object.keys(firstRow).forEach(key => {
            normalizedFirstRow[key.toLowerCase()] = firstRow[key];
        });

        if (!selectedVendor && normalizedFirstRow['vendor']) {
            const vendor = vendors.find(v => v.name.toLowerCase() === normalizedFirstRow['vendor'].toLowerCase());
            if (vendor) setSelectedVendor(vendor);
        }
        
        if (normalizedFirstRow['invoicenumber']) setInvoiceNumber(normalizedFirstRow['invoicenumber']);
        if (normalizedFirstRow['invoicedate']) setInvoiceDate(normalizedFirstRow['invoicedate']);
    };

    // Generate sample file
    const generateSampleFile = () => {
        const sampleData = [
            {
                productName: "Sodium Chloride",
                quantity: 5,
                totalPrice: 1250,
                expiryDate: "2024-12-31",
                pricePerUnit: 250,
                vendor: "ABC Chemicals",
                invoiceNumber: "INV-2023-001",
                invoiceDate: "2023-05-15"
            },
            {
                productName: "Hydrochloric Acid",
                quantity: 2,
                totalPrice: 800,
                expiryDate: "2025-06-30",
                vendor: "ABC Chemicals"
            }
        ];

        if (fileType === 'csv') {
            const csv = Papa.unparse(sampleData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sample-invoice.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
            XLSX.writeFile(workbook, 'sample-invoice.xlsx');
        }
    };

    // --- DRAFT LOGIC ---
    const DRAFT_KEY = 'invoiceFormDraft';

    // Save draft to localStorage (debounced)
    useEffect(() => {
        const handler = setTimeout(() => {
            const draft = {
                selectedVendor,
                invoiceNumber,
                invoiceDate,
                lineItems,
                fileType,
                showOtherForm,
                otherCategory
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }, 500); // Debounce: 500ms
        return () => clearTimeout(handler);
    }, [selectedVendor, invoiceNumber, invoiceDate, lineItems, fileType, showOtherForm, otherCategory]);

    // Rehydrate draft on mount
    useEffect(() => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (data.selectedVendor) setSelectedVendor(data.selectedVendor);
                if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
                if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
                if (data.lineItems) setLineItems(data.lineItems);
                if (data.fileType) setFileType(data.fileType);
                if (typeof data.showOtherForm === 'boolean') setShowOtherForm(data.showOtherForm);
                if (data.otherCategory) setOtherCategory(data.otherCategory);
            } catch {}
        }
    }, []);

    // Clear draft on submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        
        // Validation
        if (!selectedVendor) {
            setError('Please select a vendor.');
            setSubmitting(false);
            return;
        }
        if (!invoiceNumber || !invoiceDate) {
            setError('Invoice number and date are required.');
            setSubmitting(false);
            return;
        }
        if (lineItems.some(item => !item.productId || !item.quantity || !item.totalPrice /* removed check for !item.expiryDate */)) {
            setError('All line items must have a product, quantity, and total price.');
            setSubmitting(false);
            return;
        }
        
        // Prepare payload
        const payload = {
            vendorId: selectedVendor._id,
            vendorName: selectedVendor.name,
            invoiceNumber,
            invoiceDate,
            totalInvoicePrice,
            lineItems: lineItems.map(item => ({
                productId: item.productId,
                name: item.name,
                unit: item.unit,
                thresholdValue: item.thresholdValue,
                quantity: Number(item.quantity),
                totalPrice: Number(item.totalPrice),
                pricePerUnit: Number(item.pricePerUnit),
                expiryDate: item.expiryDate
            }))
        };
        
        try {
            const res = await axios.post(`${API_BASE}/invoices`, payload);
            setSuccess(`Invoice created successfully! Invoice ID: ${res.data.invoiceId || res.data.data?.invoiceId || ''}`);
            setLineItems([
                { productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }
            ]);
            setInvoiceNumber('');
            setInvoiceDate('');
            setSelectedVendor(null);
            localStorage.removeItem(DRAFT_KEY); // <-- Clear draft
            // Optionally, fetch new voucherId
            axios.get(`${API_BASE}/vouchers/next?category=invoice`).then(r => setVoucherId(r.data.voucherId || r.data.nextVoucherId || ''));
            // SweetAlert success modal
            Swal.fire({
                icon: 'success',
                title: 'Invoice Created',
                text: `Invoice created successfully! Invoice ID: ${res.data.invoiceId || res.data.data?.invoiceId || ''}`,
                confirmButtonColor: '#2563eb',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    // Warn on tab close if draft exists
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (localStorage.getItem(DRAFT_KEY)) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Optionally: Prompt to continue draft
    const [showDraftPrompt, setShowDraftPrompt] = useState(false);
    useEffect(() => {
        // Only show prompt if draft exists AND at least one field is non-empty
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            try {
                const data = JSON.parse(draft);
                const hasData = (
                    (data.selectedVendor && Object.keys(data.selectedVendor).length > 0) ||
                    data.invoiceNumber ||
                    data.invoiceDate ||
                    (Array.isArray(data.lineItems) && data.lineItems.some(item => item.productId || item.name || item.quantity || item.totalPrice))
                );
                if (hasData) setShowDraftPrompt(true);
            } catch {}
        }
    }, []);
    const handleContinueDraft = () => setShowDraftPrompt(false);
    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setShowDraftPrompt(false);
        setSelectedVendor(null);
        setInvoiceNumber('');
        setInvoiceDate('');
        setLineItems([{ productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }]);
    };

    // Add product registration logic (similar to ProductList)
    const handleCreateProductFromInvoice = async (productData) => {
        setProductFormLoading(true);
        setProductFormError('');
        try {
            const res = await axios.post('https://backend-pharmacy-5541.onrender.com/api/products', productData);
            setProducts(prev => [res.data.data, ...prev]);
            // Move to next unregistered product or close modal
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

    // Add a handler for successful submission from InvoiceOtherProductsForm
    const handleOtherFormSuccess = () => {
        setShowOtherForm(false);
        // Fetch new voucherId
        axios.get(`${API_BASE}/vouchers/next?category=invoice`).then(r => setVoucherId(r.data.voucherId || r.data.nextVoucherId || ''));
        Swal.fire({
            icon: 'success',
            title: 'Invoice Created!',
            text: 'The invoice for other products was created successfully.',
            confirmButtonColor: '#2563eb',
            timer: 2000
        });
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/80 rounded-2xl shadow-xl p-8 mt-8 relative">
            {showDraftPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
                        <div className="text-lg font-semibold mb-2">Continue where you left off?</div>
                        <div className="mb-4 text-gray-600 text-sm">A draft invoice was found. Would you like to continue editing it or discard?</div>
                        <div className="flex justify-center gap-4">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-full" onClick={handleContinueDraft}>Continue</button>
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full" onClick={handleDiscardDraft}>Discard</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-6 gap-2 md:gap-4">
                {/* Voucher ID display (hide if other form is open) */}
                {!showOtherForm && (
                    <div className={'text-sm font-mono bg-blue-100 text-blue-700 px-4 py-1 rounded-full shadow z-10 order-2 md:order-1'}>
                        Voucher ID: {voucherId || '...'}
                    </div>
                )}
                <div className={'order-1 md:order-2'}>
                    <button
                        type="button"
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-full transition text-sm"
                        onClick={() => setShowOtherForm(v => !v)}
                    >
                        {showOtherForm ? 'Back to Chemical Invoice' : 'Create Invoice for Other Products'}
                    </button>
                </div>
            </div>

            {showOtherForm && (
                <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                        <button className={`px-3 py-1 rounded ${otherCategory === 'glassware' ? 'bg-blue-500 text-white' : 'bg-blue-200'}`} onClick={() => setOtherCategory('glassware')}>Glassware</button>
                        <button className={`px-3 py-1 rounded ${otherCategory === 'equipment' ? 'bg-blue-500 text-white' : 'bg-blue-200'}`} onClick={() => setOtherCategory('equipment')}>Equipment</button>
                        <button className={`px-3 py-1 rounded ${otherCategory === 'others' ? 'bg-blue-500 text-white' : 'bg-blue-200'}`} onClick={() => setOtherCategory('others')}>Others</button>
                    </div>
                    <InvoiceOtherProductsForm category={otherCategory} onSuccess={handleOtherFormSuccess} />
                </div>
            )}
            
            {!showOtherForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Upload Section */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="block text-sm font-medium text-blue-800 mb-2">Upload from File</label>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-3">
                            <div className="flex items-center gap-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio"
                                        name="fileType"
                                        value="csv"
                                        checked={fileType === 'csv'}
                                        onChange={() => setFileType('csv')}
                                    />
                                    <span className="ml-2">CSV</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio"
                                        name="fileType"
                                        value="excel"
                                        checked={fileType === 'excel'}
                                        onChange={() => setFileType('excel')}
                                    />
                                    <span className="ml-2">Excel</span>
                                </label>
                            </div>
                            
                            <button
                                type="button"
                                onClick={generateSampleFile}
                                className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                            >
                                Download Sample {fileType === 'csv' ? 'CSV' : 'Excel'}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept={fileType === 'csv' ? '.csv' : '.xlsx,.xls'}
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                            />
                        </div>
                        
                        {csvError && <div className="mt-2 text-sm text-red-600">{csvError}</div>}
                        
                        <div className="mt-3 text-xs text-gray-500">
                            <p>Required fields: <span className="font-semibold">productName, quantity, totalPrice, expiryDate</span></p>
                            <p>Optional fields: vendor, invoiceNumber, invoiceDate, pricePerUnit</p>
                            <p>Extra columns will be ignored.</p>
                        </div>
                        
                        {unregisteredProducts.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-red-700 text-sm font-semibold mb-1">
                                    {unregisteredProducts.length} Unregistered Product(s):
                                </div>
                                <ul className="list-disc pl-5 text-red-700 text-xs">
                                    {unregisteredProducts.map((name, idx) => (
                                        <li key={idx}>{name}</li>
                                    ))}
                                </ul>
                                <div className="text-xs text-gray-500 mt-1">
                                    Please register these products before importing, or remove them from the file.
                                </div>
                                <button
                                    type="button"
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                    onClick={() => {
                                        setProductFormIndex(0);
                                        setShowProductFormModal(true);
                                    }}
                                >
                                    Register Missing Products
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Vendor selection */}
                    <div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-6">Create Purchase Invoice</h2>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                            value={selectedVendor?._id || ''}
                            onChange={handleVendorSelect}
                            disabled={!!selectedVendor}
                            required
                        >
                            <option value="">Select a vendor...</option>
                            {vendors.map(v => (
                                <option key={v._id} value={v._id}>{v.name}</option>
                            ))}
                        </select>
                        {selectedVendor && (
                            <div className="mt-2 text-xs text-gray-500">Vendor Code: <span className="font-mono">{selectedVendor.vendorCode}</span></div>
                        )}
                        {selectedVendor && (
                            <button type="button" className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelectedVendor(null)}>Change Vendor</button>
                        )}
                    </div>
                    
                    {/* Invoice details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                                value={invoiceNumber}
                                onChange={e => setInvoiceNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/70 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                                value={invoiceDate}
                                onChange={e => setInvoiceDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Line items */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items (Chemicals)</label>
                        <div className="space-y-4">
                            {lineItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end bg-white/60 rounded-lg p-3 border border-gray-200 relative">
                                    {/* Product dropdown */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-500">Product</label>
                                        <select
                                            className="w-full px-2 py-1 rounded border border-gray-300 bg-white/80 text-gray-800"
                                            value={item.productId}
                                            onChange={e => handleProductSelect(idx, e.target.value)}
                                            required
                                        >
                                            <option value="">Select product...</option>
                                            {products.filter(p => !selectedProductIds.includes(p._id) || p._id === item.productId).map(p => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Unit (auto) */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Unit</label>
                                        <input type="text" className="w-full px-2 py-1 rounded border border-gray-200 bg-gray-100 text-gray-500" value={item.unit} readOnly tabIndex={-1} />
                                    </div>
                                    
                                    {/* Threshold (auto) */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Threshold</label>
                                        <input type="text" className="w-full px-2 py-1 rounded border border-gray-200 bg-gray-100 text-gray-500" value={item.thresholdValue} readOnly tabIndex={-1} />
                                    </div>
                                    
                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-2 py-1 rounded border border-gray-300 bg-white/80 text-gray-800"
                                            value={item.quantity}
                                            onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Total Price */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Total Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-2 py-1 rounded border border-gray-300 bg-white/80 text-gray-800"
                                            value={item.totalPrice}
                                            onChange={e => handleLineItemChange(idx, 'totalPrice', e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Price Per Unit (auto-calculated, read-only) */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Price/Unit</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-2 py-1 rounded border border-gray-200 bg-gray-100 text-gray-500" 
                                            value={item.pricePerUnit} 
                                            readOnly 
                                            tabIndex={-1} 
                                        />
                                    </div>
                                    
                                    {/* Expiry Date */}
                                    <div>
                                        <label className="block text-xs text-gray-500">Expiry Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-2 py-1 rounded border border-gray-300 bg-white/80 text-gray-800"
                                            value={item.expiryDate}
                                            onChange={e => handleLineItemChange(idx, 'expiryDate', e.target.value)}
                                        />
                                    </div>
                                    
                                    {/* Remove button */}
                                    {lineItems.length > 1 && (
                                        <button type="button" className="absolute top-2 right-2 text-red-500 hover:text-red-700" onClick={() => removeLineItem(idx)} title="Remove">
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 text-sm" onClick={addLineItem}>
                                + Add Line Item
                            </button>
                        </div>
                    </div>
                    
                    {/* Display total invoice price */}
                    <div className="text-right text-lg font-semibold text-blue-900">
                        Total Invoice Price: ₹{totalInvoicePrice.toFixed(2)}
                    </div>
                    
                    {/* Error/Success */}
                    {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
                    {success && <div className="text-green-600 text-sm font-medium">{success}</div>}
                    
                    {/* Submit */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-full transition"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Create Invoice'}
                        </button>
                    </div>  
                </form>
            )}

            {/* Product Registration Modal for Missing Products */}
            {showProductFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
                        <ProductForm
                            product={null}
                            onCreate={handleCreateProductFromInvoice}
                            onUpdate={() => {}}
                            onClose={() => setShowProductFormModal(false)}
                            // Pre-fill with missing product name
                            initialName={unregisteredProducts[productFormIndex] || ''}
                        />
                        {productFormError && (
                            <div className="absolute bottom-4 left-0 right-0 text-center text-red-600 text-sm">{productFormError}</div>
                        )}
                        <div className="absolute top-2 right-2">
                            <button onClick={() => setShowProductFormModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
                        </div>
                        {unregisteredProducts.length > 1 && (
                            <div className="absolute bottom-4 right-4 text-xs text-gray-500">
                                {productFormIndex + 1} of {unregisteredProducts.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceForm;