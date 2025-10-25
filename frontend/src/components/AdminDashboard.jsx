import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, Users, DollarSign, Leaf, TrendingUp } from 'lucide-react';

const AdminDashboard = ({ orders, predictions, co2Data, dashboardMetrics }) => {
  const totalCO2 = co2Data.reduce((sum, r) => sum + (r.co2 || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Orders', 
            value: dashboardMetrics?.total_orders || orders.length, 
            icon: Package, 
            color: 'blue',
            change: '+12%'
          },
          { 
            label: 'Active Users', 
            value: dashboardMetrics?.active_users || 48, 
            icon: Users, 
            color: 'green',
            change: '+5%'
          },
          { 
            label: 'Total Revenue', 
            value: `₹${((dashboardMetrics?.total_revenue || orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)) / 1000).toFixed(1)}K`, 
            icon: DollarSign, 
            color: 'yellow',
            change: '+18%'
          },
          { 
            label: 'CO₂ Emissions', 
            value: `${totalCO2.toFixed(1)}kg`, 
            icon: Leaf, 
            color: 'emerald',
            change: '-15%'
          }
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${stat.color}-500 hover:shadow-lg transition`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <stat.icon className={`text-${stat.color}-500`} size={32} />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
            <p className={`text-xs ${stat.change.startsWith('+') && stat.label !== 'CO₂ Emissions' ? 'text-green-600' : stat.change.startsWith('-') && stat.label === 'CO₂ Emissions' ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demand Prediction Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Demand Prediction Accuracy</h3>
            <span className="text-sm text-gray-500">Last 10 days</span>
          </div>
          {predictions.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions.slice(-10).map(p => ({
                date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                actual: p.actual_demand ? Math.round(p.actual_demand) : null,
                predicted: Math.round(p.predicted_demand)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  name="Actual Demand"
                  dot={{ fill: '#10b981', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  strokeDasharray="5 5" 
                  name="Predicted Demand"
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2" />
                <p>No prediction data available</p>
              </div>
            </div>
          )}
        </div>

        {/* CO2 Emissions Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">CO₂ Emissions by Route</h3>
            <span className="text-sm text-gray-500">Current routes</span>
          </div>
          {co2Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={co2Data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="route" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="co2" fill="#10b981" name="CO₂ (kg)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Leaf size={48} className="mx-auto mb-2" />
                <p>No emission data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Recent Transactions</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 8).map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">#{order._id?.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.quantity}L</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{order.total_amount?.toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
