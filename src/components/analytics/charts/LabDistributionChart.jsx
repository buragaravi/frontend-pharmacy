import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', 
  '#4ECDC4'
];

const LabDistributionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/distribution');
        // Format data for better display
        const formattedData = response.data.map(lab => ({
          ...lab,
          name: lab.labId === 'central-store' ? 'Central Store' : `Lab ${lab.labId.replace('LAB0', '')}`,
          value: lab.totalQuantity // for pie chart
        }));
        setData(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Chemical Distribution Across Labs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="h-[400px]">
            <h3 className="text-lg font-medium mb-2">Number of Chemicals per Lab</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalChemicals" fill="#8884d8" name="Total Chemicals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="h-[400px]">
            <h3 className="text-lg font-medium mb-2">Total Quantity Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.map((lab, index) => (
              <div
                key={lab.labId}
                className="bg-gray-50 p-4 rounded-lg border"
                style={{ borderColor: COLORS[index % COLORS.length] }}
              >
                <h4 className="font-medium">{lab.name}</h4>
                <p className="text-sm text-gray-600">
                  Total Chemicals: {lab.totalChemicals}
                </p>
                <p className="text-sm text-gray-600">
                  Total Quantity: {lab.totalQuantity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDistributionChart;
