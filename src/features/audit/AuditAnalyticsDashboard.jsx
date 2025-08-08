import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const AuditAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last30days');
  const [selectedLab, setSelectedLab] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedLab]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignments data to calculate analytics
      const assignmentsResponse = await axios.get('https://backend-pharmacy-5541.onrender.com/api/audit/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const assignmentsData = assignmentsResponse.data.data || [];
      setAssignments(assignmentsData);
      
      // Calculate analytics from assignments data
      const analytics = calculateAnalytics(assignmentsData);
      setAnalyticsData(analytics);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set empty data structure instead of mock data
      setAnalyticsData({
        overview: {
          totalAudits: 0,
          completedAudits: 0,
          pendingAudits: 0,
          overdue: 0,
          avgCompletionTime: 0,
          complianceRate: 0
        },
        trendData: [],
        categoryData: [],
        labPerformance: [],
        facultyPerformance: [],
        complianceHistory: []
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (assignmentsData) => {
    const now = new Date();
    const filterDate = getFilterDate(timeRange);
    
    // Filter assignments based on time range
    const filteredAssignments = assignmentsData.filter(assignment => {
      const createdDate = new Date(assignment.createdAt);
      return createdDate >= filterDate;
    });

    const totalAudits = filteredAssignments.length;
    const completedAudits = filteredAssignments.filter(a => a.status === 'completed').length;
    const pendingAudits = filteredAssignments.filter(a => a.status === 'pending' || a.status === 'assigned').length;
    const inProgressAudits = filteredAssignments.filter(a => a.status === 'in_progress').length;
    const overdueAudits = filteredAssignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return dueDate < now && a.status !== 'completed';
    }).length;

    // Calculate completion rate
    const complianceRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

    // Generate trend data
    const trendData = generateTrendData(filteredAssignments);
    
    // Generate category data
    const categoryData = generateCategoryData(filteredAssignments);

    // Generate lab performance data
    const labPerformance = generateLabPerformance(filteredAssignments);

    // Generate faculty performance data
    const facultyPerformance = generateFacultyPerformance(filteredAssignments);

    return {
      overview: {
        totalAudits,
        completedAudits,
        pendingAudits,
        inProgressAudits,
        overdue: overdueAudits,
        avgCompletionTime: calculateAvgCompletionTime(filteredAssignments),
        complianceRate
      },
      trendData,
      categoryData,
      labPerformance,
      facultyPerformance,
      complianceHistory: trendData
    };
  };

  const getFilterDate = (range) => {
    const now = new Date();
    switch (range) {
      case 'last7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'last30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'last90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'lastyear':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const generateTrendData = (assignments) => {
    const months = {};
    assignments.forEach(assignment => {
      const date = new Date(assignment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, audits: 0, completed: 0 };
      }
      months[monthKey].audits++;
      if (assignment.status === 'completed') {
        months[monthKey].completed++;
      }
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  };

  const generateCategoryData = (assignments) => {
    const categories = {};
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    
    assignments.forEach(assignment => {
      if (assignment.auditTasks && assignment.auditTasks.length > 0) {
        assignment.auditTasks.forEach(task => {
          const category = task.category || 'Other';
          if (!categories[category]) {
            categories[category] = 0;
          }
          categories[category]++;
        });
      }
    });

    return Object.entries(categories).map(([name, value], index) => ({ 
      name, 
      value, 
      color: colors[index % colors.length] 
    }));
  };

  const generateLabPerformance = (assignments) => {
    const labs = {};
    assignments.forEach(assignment => {
      if (assignment.labs && assignment.labs.length > 0) {
        assignment.labs.forEach(lab => {
          const labName = lab.name || 'Unknown Lab';
          if (!labs[labName]) {
            labs[labName] = { lab: labName, total: 0, completed: 0 };
          }
          labs[labName].total++;
          if (assignment.status === 'completed') {
            labs[labName].completed++;
          }
        });
      }
    });

    return Object.values(labs).map(lab => ({
      ...lab,
      completionRate: lab.total > 0 ? Math.round((lab.completed / lab.total) * 100) : 0
    }));
  };

  const generateFacultyPerformance = (assignments) => {
    const faculty = {};
    assignments.forEach(assignment => {
      const facultyName = assignment.assignedTo?.name || 'Unassigned';
      if (!faculty[facultyName]) {
        faculty[facultyName] = { faculty: facultyName, total: 0, completed: 0 };
      }
      faculty[facultyName].total++;
      if (assignment.status === 'completed') {
        faculty[facultyName].completed++;
      }
    });

    return Object.values(faculty).map(f => ({
      ...f,
      completionRate: f.total > 0 ? Math.round((f.completed / f.total) * 100) : 0
    }));
  };

  const calculateAvgCompletionTime = (assignments) => {
    const completedAssignments = assignments.filter(a => a.status === 'completed' && a.completedAt);
    if (completedAssignments.length === 0) return 0;

    const totalDays = completedAssignments.reduce((sum, assignment) => {
      const start = new Date(assignment.createdAt);
      const end = new Date(assignment.completedAt);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedAssignments.length);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive audit performance insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last90days">Last 90 days</option>
            <option value="lastyear">Last year</option>
          </select>
          
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Labs</option>
            <option value="lab-a">Lab A</option>
            <option value="lab-b">Lab B</option>
            <option value="lab-c">Lab C</option>
            <option value="lab-d">Lab D</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Audits"
          value={analyticsData?.overview?.totalAudits || 0}
          subtitle="This period"
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Completed"
          value={analyticsData?.overview?.completedAudits || 0}
          subtitle={`${Math.round((analyticsData?.overview?.completedAudits / analyticsData?.overview?.totalAudits) * 100) || 0}% completion rate`}
          color="green"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        <StatCard
          title="In Progress"
          value={analyticsData?.overview?.inProgressAudits || 0}
          subtitle="Currently active"
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Pending"
          value={analyticsData?.overview?.pendingAudits || 0}
          subtitle="Awaiting start"
          color="yellow"
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Overdue"
          value={analyticsData?.overview?.overdue || 0}
          subtitle="Need attention"
          color="red"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trends</h3>
          {analyticsData?.trendData && analyticsData.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="audits" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No trend data available</p>
                <p className="text-sm text-gray-400 mt-1">Audit trends will appear here once you have more data</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Categories</h3>
          {analyticsData?.categoryData && analyticsData.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No category data available</p>
                <p className="text-sm text-gray-400 mt-1">Category breakdown will appear here once audits are categorized</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Lab Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.labPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="lab" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Compliance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.complianceHistory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="compliance" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Faculty Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Faculty Performance</h3>
          <p className="text-gray-600 text-sm mt-1">Audit completion metrics by faculty member</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audits Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time (days)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analyticsData?.facultyPerformance || []).map((faculty, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{faculty.faculty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{faculty.audits}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{faculty.avgTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{faculty.rating}</div>
                      <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(faculty.rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AuditAnalyticsDashboard;
