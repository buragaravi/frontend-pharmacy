import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductForm from './ProductForm';
import BulkProductUpload from './BulkProductUpload';
import ProductInventoryDetail from '../../components/ProductInventoryDetail';

// Add custom styles for animations
const customStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes expandDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 1000px;
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-slideInRight {
    animation: slideInRight 0.4s ease-out forwards;
  }

  .animate-expandDown {
    animation: expandDown 0.5s ease-out forwards;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .glass-effect {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .rotate-180 {
    transform: rotate(180deg);
  }
`;

const BASE_URL = 'https://backend-jits.onrender.com/api/products';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProductId, setExpandedProductId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(BASE_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (category) => {
    if (category === 'all') {
      fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/category/${category}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products by category');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(BASE_URL, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts([res.data.data, ...products]);
      setError(null);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${BASE_URL}/${id}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.map(p => p._id === id ? res.data.data : p));
      setError(null);
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p._id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUploadSuccess = (result) => {
    // Refresh the products list after successful bulk upload
    fetchProducts();
    setShowBulkUpload(false);
    // Show success message
    setError(null);
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setExpandedProductId(null); // Close any expanded product when changing category
    fetchProductsByCategory(category);
  };

  const handleToggleExpand = (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null); // Close if already expanded
    } else {
      setExpandedProductId(productId); // Open this product
    }
  };

  const filteredProducts = (products || []).filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const productName = product?.name?.toLowerCase() || '';
    const productVariant = (product?.variant || product?.unit || '').toLowerCase();
    const productDescription = (product?.description || '').toLowerCase();
    
    return productName.includes(searchLower) || 
           productVariant.includes(searchLower) || 
           productDescription.includes(searchLower);
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get category colors and icons
  const getCategoryStyle = (category) => {
    const styles = {
      chemical: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-600', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
          </svg>
        )
      },
      glassware: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-500', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
          </svg>
        )
      },
      equipment: { 
        bg: 'bg-blue-200', 
        text: 'text-blue-700', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      },
      others: { 
        bg: 'bg-white', 
        text: 'text-blue-400', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      }
    };
    return styles[category] || styles.others;
  };

  // Skeleton loader for table rows
  const ProductTableSkeleton = ({ rows = 6 }) => (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {[...Array(rows)].map((_, idx) => (
            <tr key={idx} className="animate-pulse hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-xl bg-blue-100" />
                  <div className="ml-4">
                    <div className="h-4 w-32 bg-gray-300 rounded-lg mb-2" />
                    <div className="h-3 w-20 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-300 rounded-lg mb-2" />
                <div className="h-3 w-32 bg-gray-200 rounded-lg" />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="inline-block h-8 w-16 bg-gray-300 rounded-lg mr-2" />
                <div className="inline-block h-8 w-16 bg-gray-200 rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>
      <div className="min-h-screen bg-white p-4 sm:p-6 animate-fadeInUp">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="backdrop-blur-lg bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            {/* Enhanced Header */}
            <div className="relative p-8 bg-blue-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-blue-700/20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Product Management</h1>
                    <p className="text-blue-100 text-lg">Manage your inventory with precision and control</p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">{products.length}</div>
                    <div className="text-sm text-blue-100">Total Products</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">{products.filter(p => p.category === 'chemical').length}</div>
                    <div className="text-sm text-blue-100">Chemicals</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">{products.filter(p => p.category === 'equipment').length}</div>
                    <div className="text-sm text-blue-100">Equipment</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">{products.filter(p => p.category === 'glassware').length}</div>
                    <div className="text-sm text-blue-100">Glassware</div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-40 h-40 bg-white/5 rounded-full"></div>
              </div>
              <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
                <div className="w-32 h-32 bg-white/5 rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="p-6 border-b border-blue-100 bg-white backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, variant, or description..."
                    className="block w-full pl-10 pr-4 py-3 border border-blue-200 rounded-2xl bg-white text-gray-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchProducts()}
                    className="px-4 py-3 bg-white border border-blue-200 rounded-xl text-blue-700 font-medium hover:bg-blue-50 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="px-6 py-3 bg-green-600 rounded-xl text-white font-semibold hover:bg-green-700 hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Bulk Upload
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowForm(true);
                    }}
                    className="px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Category Tabs */}
            <div className="px-6 pt-4 bg-white">
              <div className="flex overflow-x-auto scrollbar-hide gap-2">
                {['all', 'chemical', 'glassware', 'equipment', 'others'].map((tab) => {
                  const isActive = currentCategory === tab;
                  const categoryStyle = getCategoryStyle(tab);
                  return (
                    <button
                      key={tab}
                      className={`px-6 py-3 rounded-t-2xl font-semibold transition-all duration-300 whitespace-nowrap border-b-3 transform hover:scale-105 ${
                        isActive
                          ? `bg-blue-50 ${categoryStyle.text} border-blue-500 shadow-lg`
                          : 'bg-white text-blue-400 hover:bg-blue-50 border-transparent hover:shadow-md'
                      }`}
                      onClick={() => handleCategoryChange(tab)}
                    >
                      <span className="flex items-center gap-2">
                        {tab !== 'all' && categoryStyle.icon}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="p-6 bg-white">
              {loading ? (
                <ProductTableSkeleton rows={6} />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
                  <p className="text-gray-500 text-lg mb-2">Try changing your search terms or category filters</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Tip: Products with the same name but different variants are shown separately
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowBulkUpload(true)}
                      className="px-6 py-3 bg-green-600 rounded-xl text-white font-semibold hover:bg-green-700 transition-all duration-300"
                    >
                      Bulk Upload Products
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setShowForm(true);
                      }}
                      className="px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold hover:bg-blue-700 transition-all duration-300"
                    >
                      Add Your First Product
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
                  <table className="min-w-full divide-y divide-gray-200/50">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200/30">
                      {filteredProducts.map((product, index) => {
                        const categoryStyle = getCategoryStyle(product.category);
                        const isExpanded = expandedProductId === product._id;
                        return (
                          <React.Fragment key={product._id}>
                            <tr 
                              className="hover:bg-white/80 transition-all duration-200 group cursor-pointer"
                              style={{ animationDelay: `${index * 0.05}s` }}
                              onClick={() => handleToggleExpand(product._id)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className={`h-12 w-12 rounded-xl ${categoryStyle.bg} ${categoryStyle.text} flex items-center justify-center text-xl font-bold shadow-md group-hover:shadow-lg transition-all duration-200`}>
                                    {categoryStyle.icon || product.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                      {product.name}
                                      {(product.variant || product.unit) && (
                                        <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                          {product.variant || product.unit}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 font-medium">
                                      Product ID: {product._id.slice(-6)}
                                    </div>
                                  </div>
                                  {/* Expand/Collapse indicator */}
                                  <div className="ml-auto">
                                    <div className={`p-2 rounded-lg transition-all duration-300 ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text}`}>
                                  <span className="mr-1">{categoryStyle.icon}</span>
                                  {product.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {(product.variant || product.unit) && (
                                    <div className="text-sm font-semibold text-gray-900">
                                      Variant: {product.variant || product.unit}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-500">
                                    <span className="inline-flex items-center">
                                      <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                                      Threshold: {product.thresholdValue}
                                    </span>
                                  </div>
                                  {product.description && (
                                    <div className="text-xs text-gray-400 truncate max-w-xs">
                                      {product.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setShowForm(true);
                                    }}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 hover:shadow-md transition-all duration-200 font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product._id)}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 hover:shadow-md transition-all duration-200 font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Expanded inventory details */}
                            {isExpanded && (
                              <ProductInventoryDetail 
                                productId={product._id}
                                onClose={() => setExpandedProductId(null)}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-8 overflow-y-auto">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300 scale-100 mt-4">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <ProductForm 
                product={editingProduct}
                onCreate={handleCreateProduct}
                onUpdate={handleUpdateProduct}
                onClose={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-8 overflow-y-auto">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBulkUpload(false)}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-100 max-h-[85vh] mt-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500"></div>
              <BulkProductUpload 
                onClose={() => setShowBulkUpload(false)}
                onSuccess={handleBulkUploadSuccess}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-2xl p-4 shadow-xl z-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductList;
