import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InvoiceOtherProductsForm from './InvoiceOtherProductsForm';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ProductForm from '../products/ProductForm';
import Swal from 'sweetalert2';
import { useResponsiveColors } from '../../hooks/useResponsiveColors';
import SafeButton from '../../components/SafeButton';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const InvoiceForm = () => {
    // ==================== COLOR SYSTEM ====================
    const { getSafeBackground, getSafeBackdrop, getSafeClasses, colorMode, deviceInfo } = useResponsiveColors();
    
    // ==================== STATE MANAGEMENT ====================
    // Vendor and Product Data
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [voucherId, setVoucherId] = useState('');
    
    // Form Data
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [lineItems, setLineItems] = useState([
        { productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }
    ]);

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showOtherForm, setShowOtherForm] = useState(false);
    const [otherCategory, setOtherCategory] = useState('glassware');
    
    // File Upload State
    const [csvError, setCsvError] = useState('');
    const [unregisteredProducts, setUnregisteredProducts] = useState([]);
    const [fileType, setFileType] = useState('csv'); // 'csv' or 'excel'

    // Product Registration Modal State
    const [showProductFormModal, setShowProductFormModal] = useState(false);
    const [productFormIndex, setProductFormIndex] = useState(0);
    const [productFormError, setProductFormError] = useState('');
    const [productFormLoading, setProductFormLoading] = useState(false);

    // ==================== DATA FETCHING ====================

    // Fetch vendors with error handling
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const res = await axios.get(`${API_BASE}/vendors`, {
                    headers: getAuthHeaders()
                });
                const vendorsList = res.data?.vendors || res.data?.data || res.data || [];
                setVendors(Array.isArray(vendorsList) ? vendorsList : []);
            } catch (error) {
                console.error('Error fetching vendors:', error);
                setVendors([]);
                setError('Failed to load vendors');
            }
        };
        fetchVendors();
    }, []);

    // Fetch products (chemicals only) with error handling
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${API_BASE}/products/category/chemical`, {
                    headers: getAuthHeaders()
                });
                const productsList = res.data?.data || res.data || [];
                setProducts(Array.isArray(productsList) ? productsList : []);
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                setError('Failed to load products');
            }
        };
        fetchProducts();
    }, []);

    // Fetch next voucherId for invoice with error handling
    useEffect(() => {
        const fetchVoucherId = async () => {
            try {
                const res = await axios.get(`${API_BASE}/vouchers/next?category=invoice`, {
                    headers: getAuthHeaders()
                });
                setVoucherId(res.data?.voucherId || res.data?.nextVoucherId || '');
            } catch (error) {
                console.error('Error fetching voucher ID:', error);
                setVoucherId('');
            }
        };
        fetchVoucherId();
    }, []);

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

    // ==================== FORM CALCULATIONS ====================
    // Prevent duplicate product selection
    const selectedProductIds = lineItems.map(item => item.productId).filter(Boolean);

    // ==================== LINE ITEM MANAGEMENT ====================
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

    // Helper function to convert date formats
    const convertDateFormat = (dateValue) => {
        if (!dateValue) return '';
        
        // Convert to string if it's a number (Excel serial date)
        let dateString = dateValue.toString();
        
        // Handle Excel serial numbers (numbers like 45628)
        if (typeof dateValue === 'number' && dateValue > 1000) {
            // Excel date serial number - convert to JavaScript date
            // Excel counts days from January 1, 1900 (with a leap year bug adjustment)
            const excelEpoch = new Date(1900, 0, 1);
            const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
            if (!isNaN(jsDate.getTime())) {
                return jsDate.toISOString().split('T')[0];
            }
        }
        
        // If already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        
        // Handle DD-MM-YYYY format
        if (typeof dateString === 'string' && dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        }
        
        // Handle DD/MM/YYYY format
        if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }
        
        // Handle MM/DD/YYYY format (common in Excel)
        if (typeof dateString === 'string' && dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateString.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Handle DD.MM.YYYY format (European)
        if (typeof dateString === 'string' && dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            const [day, month, year] = dateString.split('.');
            return `${year}-${month}-${day}`;
        }
        
        // Try to parse as Date object (fallback for other formats)
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return dateString; // Return original string if no format matches
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
            
            // Convert expiry date to proper format
            const expiryDate = convertDateFormat(normalizedRow['expirydate'] || '');
            
            processedItems.push({
                productId: product._id,
                name: product.name,
                unit: product.unit,
                thresholdValue: product.thresholdValue,
                quantity: quantity.toString(),
                totalPrice: totalPrice.toString(),
                pricePerUnit: pricePerUnit,
                expiryDate: expiryDate
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
        if (normalizedFirstRow['invoicedate']) {
            const convertedDate = convertDateFormat(normalizedFirstRow['invoicedate']);
            setInvoiceDate(convertedDate);
        }
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
            const res = await axios.post(`${API_BASE}/invoices`, payload, {
                headers: getAuthHeaders()
            });
            setSuccess(`Invoice created successfully! Invoice ID: ${res.data.invoiceId || res.data.data?.invoiceId || ''}`);
            setLineItems([
                { productId: '', name: '', unit: '', thresholdValue: '', quantity: '', totalPrice: '', pricePerUnit: '', expiryDate: '' }
            ]);
            setInvoiceNumber('');
            setInvoiceDate('');
            setSelectedVendor(null);
            localStorage.removeItem(DRAFT_KEY); // <-- Clear draft
            // Optionally, fetch new voucherId
            axios.get(`${API_BASE}/vouchers/next?category=invoice`, { 
                headers: getAuthHeaders() 
            }).then(r => setVoucherId(r.data.voucherId || r.data.nextVoucherId || ''));
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
            const res = await axios.post('https://backend-pharmacy-5541.onrender.com/api/products', productData, {
                headers: getAuthHeaders()
            });
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
        axios.get(`${API_BASE}/vouchers/next?category=invoice`, { 
            headers: getAuthHeaders() 
        }).then(r => setVoucherId(r.data.voucherId || r.data.nextVoucherId || ''));
        Swal.fire({
            icon: 'success',
            title: 'Invoice Created!',
            text: 'The invoice for other products was created successfully.',
            confirmButtonColor: '#2563eb',
            timer: 2000
        });
    };

    return (
        <div 
            className="w-full min-h-screen"
            style={getSafeBackground('background', '#f9fafb')}
        >
            <div 
                className={getSafeClasses(
                    "w-full max-w-none mx-auto rounded-3xl shadow-2xl overflow-hidden relative",
                    "bg-white"
                )}
                style={{
                    ...getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.9)'),
                }}
            >
                {/* Enhanced Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {showDraftPrompt && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/40 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200 my-4">
                            <div className="text-xl font-bold mb-3 text-gray-800">Continue where you left off?</div>
                            <div className="mb-6 text-gray-600">A draft invoice was found. Would you like to continue editing it or discard?</div>
                            <div className="flex justify-center gap-4">
                                <SafeButton variant="primary" onClick={handleContinueDraft}>
                                    Continue Editing
                                </SafeButton>
                                <SafeButton variant="secondary" onClick={handleDiscardDraft}>
                                    Discard Draft
                                </SafeButton>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Header Section */}
                <div 
                    className="relative p-8 text-white overflow-hidden"
                    style={getSafeBackground('header', '#1d4ed8')}
                >
                    <div className="absolute inset-0 bg-blue-800/20"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="p-4 rounded-2xl border border-white/30"
                                    style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.2)')}
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                                        {showOtherForm ? `${otherCategory.charAt(0).toUpperCase() + otherCategory.slice(1)} Invoice` : 'Chemical Invoice'}
                                    </h1>
                                    <p className="text-blue-100 text-lg">Create and manage your inventory invoices</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                {!showOtherForm && (
                                    <div 
                                        className="px-6 py-3 rounded-2xl border border-white/30"
                                        style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.2)')}
                                    >
                                        <div className="text-sm text-blue-100">Voucher ID</div>
                                        <div className="text-lg font-bold">{voucherId || 'Loading...'}</div>
                                    </div>
                                )}
                                <SafeButton
                                    variant="success"
                                    onClick={() => setShowOtherForm(v => !v)}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showOtherForm ? "M10 19l-7-7m0 0l7-7m-7 7h18" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                                    </svg>
                                    {showOtherForm ? 'Back to Chemical Invoice' : 'Create Other Products Invoice'}
                                </SafeButton>
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

                {showOtherForm && (
                    <div 
                        className="p-8 border-b border-gray-200"
                        style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.7)')}
                    >
                        <div className="flex flex-wrap gap-3 mb-6">
                            <SafeButton 
                                variant={otherCategory === 'glassware' ? 'primary' : 'secondary'}
                                onClick={() => setOtherCategory('glassware')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                                    </svg>
                                    Glassware
                                </span>
                            </SafeButton>
                            <SafeButton 
                                variant={otherCategory === 'equipment' ? 'primary' : 'secondary'}
                                onClick={() => setOtherCategory('equipment')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Equipment
                                </span>
                            </SafeButton>
                            <SafeButton 
                                variant={otherCategory === 'others' ? 'primary' : 'secondary'}
                                onClick={() => setOtherCategory('others')}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Others
                                </span>
                            </SafeButton>
                        </div>
                        <InvoiceOtherProductsForm category={otherCategory} onSuccess={handleOtherFormSuccess} />
                    </div>
                )}
                
                {!showOtherForm && (
                    <div 
                        className="p-6"
                        style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.8)')}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Vendor Information, Invoice Details & File Upload Section - All in One Row */}
                            <div 
                                className="p-6 rounded-lg border border-gray-200 shadow-sm"
                                style={getSafeBackground('light', '#ffffff')}
                            >
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    
                                    {/* Vendor Information */}
                                    <div 
                                        className="p-4 rounded-lg border border-green-200"
                                        style={getSafeBackground('light', '#f0f9f0')}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-green-100 rounded-md">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-green-800">Vendor Info</h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">Select Vendor *</label>
                                                {selectedVendor ? (
                                                    <div className="space-y-2">
                                                        <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                                                            <div className="font-medium text-gray-800 text-sm">{selectedVendor.name || 'Unknown Vendor'}</div>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                <div>Code: <span className="font-mono font-medium">{selectedVendor.vendorCode || 'N/A'}</span></div>
                                                                {selectedVendor.companyName && (
                                                                    <div>Company: {selectedVendor.companyName}</div>
                                                                )}
                                                                {selectedVendor.contactNumber && (
                                                                    <div>Contact: {selectedVendor.contactNumber}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <SafeButton
                                                            type="button"
                                                            onClick={() => setSelectedVendor(null)}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                        >
                                                            Change Vendor
                                                        </SafeButton>
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 text-sm"
                                                        value=""
                                                        onChange={handleVendorSelect}
                                                        required
                                                    >
                                                        <option value="">Choose vendor...</option>
                                                        {vendors.length > 0 ? vendors.map(v => (
                                                            <option key={v._id} value={v._id}>
                                                                {v.name}{v.companyName ? ` - ${v.companyName}` : ''}
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
                                    <div 
                                        className="p-4 rounded-lg border border-purple-200"
                                        style={getSafeBackground('light', '#f5f3ff')}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-purple-100 rounded-md">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-purple-800">Invoice Details</h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">Voucher ID</label>
                                                <input
                                                    type="text"
                                                    value={voucherId}
                                                    disabled
                                                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-600 font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">Invoice Number *</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                    value={invoiceNumber}
                                                    onChange={e => setInvoiceNumber(e.target.value)}
                                                    placeholder="Enter invoice number"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">Invoice Date *</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                    value={invoiceDate}
                                                    onChange={e => setInvoiceDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Upload Section */}
                                    <div 
                                        className="p-4 rounded-lg border border-blue-200"
                                        style={getSafeBackground('light', '#eff6ff')}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-blue-100 rounded-md">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-blue-800">Bulk Import</h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* File Format Options */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">File Format</label>
                                                    <div className="space-y-1">
                                                        <label className="inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                className="form-radio h-3 w-3 text-blue-600"
                                                                name="fileType"
                                                                value="csv"
                                                                checked={fileType === 'csv'}
                                                                onChange={() => setFileType('csv')}
                                                            />
                                                            <span className="ml-2 text-xs font-medium">CSV</span>
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
                                                            <span className="ml-2 text-xs font-medium">Excel</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                {/* Required Fields */}
                                                <div className="bg-blue-100/50 p-2 rounded-lg">
                                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Required Fields:</h4>
                                                    <div className="text-xs text-blue-700">
                                                        <p>• Product Name, Quantity</p>
                                                        <p>• Total Price, Expiry Date</p>
                                                        <p className="text-xs mt-1 text-blue-600">Format: DD-MM-YYYY</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">Upload File</label>
                                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-5 h-5 mb-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="text-xs text-blue-600 font-medium">Click to upload</p>
                                                        <p className="text-xs text-gray-500">{fileType === 'csv' ? 'CSV' : 'XLSX/XLS'}</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept={fileType === 'csv' ? '.csv' : '.xlsx,.xls'}
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        
                                        {csvError && (
                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                                <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div className="text-xs text-red-700">{csvError}</div>
                                            </div>
                                        )}
                                        
                                        {unregisteredProducts.length > 0 && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex items-start">
                                                    <svg className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <div className="text-yellow-800 text-xs font-medium mb-1">
                                                            {unregisteredProducts.length} Missing Products
                                                        </div>
                                                        <SafeButton
                                                            type="button"
                                                            variant="warning"
                                                            size="sm"
                                                            onClick={() => {
                                                                setProductFormIndex(0);
                                                                setShowProductFormModal(true);
                                                            }}
                                                        >
                                                            Register Products
                                                        </SafeButton>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Enhanced Line Items Section */}
                            <div 
                                className="p-6 rounded-lg border border-gray-200 shadow-sm"
                                style={getSafeBackground('light', '#ffffff')}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-md">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-800">Chemical Products</h3>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <div className="space-y-3 min-w-[800px]">
                                        {lineItems.map((item, idx) => (
                                            <div key={idx} 
                                                className="grid grid-cols-12 gap-3 items-end rounded-lg p-4 border border-gray-200 relative hover:shadow-md transition-shadow duration-200"
                                                style={getSafeBackground('light', '#f8f9ff')}
                                            >
                                                {/* Product Selection */}
                                                <div className="col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                                    <select
                                                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                        value={item.productId}
                                                        onChange={e => handleProductSelect(idx, e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select product...</option>
                                                        {products.filter(p => !selectedProductIds.includes(p._id) || p._id === item.productId).map(p => (
                                                            <option key={p._id} value={p._id}>{p.name} {p.variant ? `(${p.variant})` : ''}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                {/* Unit (readonly) */}
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm" 
                                                        value={item.unit} 
                                                        readOnly 
                                                    />
                                                </div>
                                                
                                                {/* Threshold field removed as requested */}
                                                
                                                {/* Quantity */}
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                        value={item.quantity}
                                                        onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)}
                                                        placeholder="Enter quantity"
                                                        required
                                                    />
                                                </div>
                                                
                                                {/* Total Price */}
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                        value={item.totalPrice}
                                                        onChange={e => handleLineItemChange(idx, 'totalPrice', e.target.value)}
                                                        placeholder="Enter total price"
                                                        required
                                                    />
                                                </div>
                                                
                                                {/* Price Per Unit (readonly) */}
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm" 
                                                        value={item.pricePerUnit} 
                                                        readOnly 
                                                    />
                                                </div>
                                                
                                                {/* Expiry Date */}
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                                                        value={item.expiryDate}
                                                        onChange={e => handleLineItemChange(idx, 'expiryDate', e.target.value)}
                                                    />
                                                </div>
                                                
                                                {/* Remove button */}
                                                {lineItems.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        className="absolute top-3 right-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200" 
                                                        onClick={() => removeLineItem(idx)} 
                                                        title="Remove product"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Product Button - Moved below line items */}
                                <div className="mt-6 flex justify-center">
                                    <SafeButton
                                        type="button"
                                        onClick={addLineItem}
                                        variant="primary"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Product
                                    </SafeButton>
                                </div>
                            </div>

                            {/* Enhanced Total and Submit Section */}
                            <div 
                                className="p-6 rounded-xl border border-blue-200 shadow-sm"
                                style={getSafeBackground('light', '#eff6ff')}
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="text-2xl font-bold text-blue-800">
                                        Total: ₹{totalInvoicePrice.toFixed(2)}
                                    </div>
                                    
                                    {/* Error/Success Messages */}
                                    <div className="flex-1 text-center">
                                        {error && (
                                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 mb-3 text-sm">
                                                {error}
                                            </div>
                                        )}
                                        {success && (
                                            <div className="p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 mb-3 text-sm">
                                                {success}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Submit Button */}
                                    <SafeButton
                                        type="submit"
                                        disabled={submitting}
                                        variant="success"
                                        size="lg"
                                    >
                                        {submitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Create Invoice
                                            </>
                                        )}
                                    </SafeButton>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
        
        {/* Product Registration Modal for Missing Products */}
        {showProductFormModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
                    style={getSafeBackdrop('10px', 'rgba(0, 0, 0, 0.3)')}
                >
                    <div 
                        className="w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative my-4"
                        style={getSafeBackground('light', '#ffffff')}
                    >
                        {/* Modal Header */}
                        <div 
                            className="text-white p-4 rounded-t-2xl"
                            style={getSafeBackground('header', '#1d4ed8')}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">Register Missing Product</h3>
                                    {unregisteredProducts.length > 1 && (
                                        <p className="text-blue-100 mt-1 text-sm">
                                            {productFormIndex + 1} of {unregisteredProducts.length} products
                                        </p>
                                    )}
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
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                                    <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm font-medium">{productFormError}</div>
                                </div>
                            )}

                            <ProductForm
                                product={null}
                                onCreate={handleCreateProductFromInvoice}
                                onUpdate={() => {}}
                                onClose={() => setShowProductFormModal(false)}
                                // Pre-fill with missing product name
                                initialName={unregisteredProducts[productFormIndex] || ''}
                                submitting={productFormLoading}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default InvoiceForm;