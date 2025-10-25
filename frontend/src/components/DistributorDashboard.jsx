import React, { useState } from 'react';
import { Truck, CheckCircle, TrendingUp, Leaf, AlertCircle } from 'lucide-react';
import { routeAPI, orderAPI } from '../services/api';

const DistributorDashboard = ({ orders, fetchDashboardData }) => {
  const [routes, setRoutes] = useState([]);
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await routeAPI.optimizeRoutes({
        locations: ['ludhiana', 'jalandhar', 'amritsar', 'patiala'],
        demands: [0, 250, 300, 200],
        num_vehicles: 2
      });
      setRoutes(response.data.routes || []);
      setMessage({ type: 'success', text: '✅ Routes optimized successfully!' });
    } catch (error) {
      console.error('Error optimizing routes:', error);
      setMessage({ type: 'error', text: '❌ Failed to optimize routes' });
    } finally {
      setOptimizing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const activeDeliveries = orders.filter(o => o.status === 'in_transit' || o.status === 'confirmed');
  const completedDeliveries = orders.filter(o => o.status === 'delivered').length;
  const totalDistance = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalCO2 = routes.reduce((sum, r) => sum + (r.co2_emissions || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Distributor Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Deliveries</p>
              <p className="text-3xl font-bold text-gray-800">{activeDeliveries.length}</p>
            </div>
            <Truck className="text-blue-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-800">{completedDeliveries}</p>
            </div>
            <CheckCircle className="text-green-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Distance</p>
              <p className="text-3xl font-bold text-gray-800">{totalDistance.toFixed(0)}km</p>
            </div>
            <TrendingUp className="text-purple-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CO₂ Emissions</p>
              <p className="text-3xl font-bold text-gray-800">{totalCO2.toFixed(1)}kg</p>
            </div>
            <Leaf className="text-emerald-500" size={36} />
          </div>
        </div>
      </div>

      {/* Route Optimization */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Optimized Delivery Routes</h3>
          <button 
            onClick={handleOptimizeRoutes}
            disabled={optimizing}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {optimizing ? 'Optimizing...' : 'Optimize Routes'}
          </button>
        </div>
        
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
            <span>{message.text}</span>
          </div>
        )}
        
        <div className="space-y-3">
          {routes.length > 0 ? routes.map((route, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="text-indigo-500" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">Vehicle {route.vehicle_id || idx + 1}</p>
                    <div className="flex space-x-4 mt-1 text-sm text-gray-600">
                      <span>📍 Distance: <strong>{route.distance}km</strong></span>
                      <span>📦 Load: <strong>{route.load}L</strong></span>
                      <span>🌱 CO₂: <strong>{route.co2_emissions}kg</strong></span>
                      <span>⏱️ Time: <strong>{route.estimated_time_minutes}min</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <Truck size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Click "Optimize Routes" to generate optimized delivery routes</p>
              <p className="text-sm mt-2">AI will calculate the most efficient paths</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Deliveries Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Active Deliveries</h3>
        {activeDeliveries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Delivery Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeDeliveries.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">#{order._id?.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.quantity}L</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">
                        High
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No active deliveries at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorDashboard;
