// Generate standardized date ranges for analytics
export const generateDateRanges = () => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return {
      today: {
        startDate: new Date(now.setHours(0, 0, 0, 0)),
        endDate: new Date(now.setHours(23, 59, 59, 999)),
        label: 'Today'
      },
      thisWeek: {
        startDate: new Date(now.setDate(now.getDate() - now.getDay())),
        endDate: new Date(now.setDate(now.getDate() - now.getDay() + 6)),
        label: 'This Week'
      },
      last30Days: {
        startDate: new Date(now.getTime() - (30 * oneDay)),
        endDate: new Date(),
        label: 'Last 30 Days'
      },
      thisQuarter: {
        quarter : Math.floor(now.getMonth() / 3),
        startDate: new Date(now.getFullYear(), quarter * 3, 1),
        endDate: new Date(now.getFullYear(), (quarter + 1) * 3, 0),
        label: 'This Quarter'
      }
    };
  };
  
  // Format raw API data for frontend consumption
  export const formatAnalyticsData = (rawData, userRole) => {
    const commonFormats = {
      stockLevels: rawData.stockLevels?.map(item => ({
        ...item,
        percentage: (item.quantity / item.capacity) * 100,
        status: item.quantity <= item.reorderLevel 
          ? 'critical' 
          : item.quantity <= item.reorderLevel * 1.5 
            ? 'warning' 
            : 'normal'
      })),
      expiryData: rawData.expiryData?.map(item => ({
        ...item,
        daysToExpiry: Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    };
  
    // Role-specific formatting
    switch(userRole) {
      case 'admin':
        return {
          ...commonFormats,
          systemMetrics: {
            totalUsers: rawData.userCount,
            activeLabs: rawData.activeLabs,
            pendingRequests: rawData.pendingRequests
          },
          alerts: rawData.alerts
        };
      
      case 'central_lab_admin':
        return {
          ...commonFormats,
          vendorPerformance: rawData.vendors.map(v => ({
            ...v,
            fulfillmentRate: (v.fulfilledOrders / v.totalOrders) * 100
          })),
          purchaseTrends: rawData.purchaseTrends
        };
      
      case 'lab_assistant':
        return {
          ...commonFormats,
          labMetrics: {
            requestFulfillmentRate: rawData.fulfillmentRate,
            chemicalUsage: rawData.usageTrends
          }
        };
      
      case 'faculty':
        return {
          ...commonFormats,
          personalUsage: {
            totalRequests: rawData.requestCount,
            approvedRequests: rawData.approvedRequests,
            favoriteChemicals: rawData.topChemicals
          }
        };
      
      default:
        return commonFormats;
    }
  };
  
  // Calculate trend between two values
  export const calculateTrend = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Generate chart-friendly data from raw metrics
  export const prepareChartData = (data, config) => {
    const { labels, datasets, type = 'bar' } = config;
    
    return {
      labels,
      datasets: datasets.map(dataset => ({
        ...dataset,
        type,
        backgroundColor: dataset.colors || '#3b82f6',
        borderColor: dataset.colors || '#3b82f6',
        borderWidth: 1
      }))
    };
  };