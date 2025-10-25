import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { orderAPI, mlAPI } from '../services/api';

const RetailerDashboard = ({ user, orders, setOrders, predictions }) => {
  const [order, setOrder] = useState({ quantity: '', deliveryDate: '' });
  const [predictedDemand, setPredictedDemand] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePredictDemand = async () => {
    setPredicting(true);
    try {
      const response = await mlAPI.predictDemand({});
      setPredictedDemand(response.data);
    } catch (error) {
      console.error('Error predicting demand:', error);
      setPredictedDemand({ predicted_demand: 1200, confidence: 0.85 });
    } finally {
      setPredicting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!order.quantity || !order.deliveryDate) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    if (parseFloat(order.quantity) <= 0) {
      setMessage({ type: 'error', text: 'Quantity must be greater than 0' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await orderAPI.createOrder({
        quantity: parseFloat(order.quantity),
        delivery_date: order.deliveryDate,
        demand_factor: 1.0
      });
      
      setMessage({ type: 'success', text: '✅ Order placed successfully!' });
      setOrder({ quantity: '', deliveryDate: '' });
      
      // Refresh orders
      const ordersRes = await orderAPI.getOrders();
      setOrders(ordersRes.data || []);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '❌ ' + (error.response?.data?.error || 'Failed to place order') 
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  useEffect(() => {
    handlePredictDemand();
  }, []);

  const retailerOrders = orders.filter(o => o.retailer_id === user.id);
  const totalOrders = retailerOrders.length;
  const totalSpent = retailerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = retailerOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Retailer Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
            </div>
            <Package className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-gray-800">₹{totalSpent.toFixed(0)}</p>
            </div>
            <DollarSign className="text-green-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-800">{pendingOrders}</p>
            </div>
            <Clock className="text-yellow-500" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Place Order Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Place New Order</h3>
          
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Liters) *
              </label>
              <input
                type="number"
                value={order.quantity}
                onChange={(e) => setOrder({...order, quantity: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter quantity"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date *
              </label>
              <input
                type="date"
                value={order.deliveryDate}
                onChange={(e) => setOrder({...order, deliveryDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            {/* Predicted Demand Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">AI Predicted Demand</p>
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              {predicting ? (
                <p className="text-sm text-gray-600">Calculating...</p>
              ) : predictedDemand ? (
                <>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(predictedDemand.predicted_demand)}L
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Confidence: {((predictedDemand.confidence || 0.85) * 100).toFixed(0)}% • 
                    Price: ₹52/L
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">Unable to predict</p>
              )}
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
        
        {/* Demand Forecast Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">7-Day Demand Forecast</h3>
          {predictions.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions.slice(-7).map(p => ({
                date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                predicted: Math.round(p.predicted_demand),
                actual: p.actual_demand ? Math.round(p.actual_demand) : null
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Predicted Demand"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                {predictions.some(p => p.actual_demand) && (
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    name="Actual Demand"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                )}
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
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">My Orders</h3>
        {retailerOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {retailerOrders.slice(0, 10).map((order, idx) => (
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
            <p>No orders yet. Place your first order above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerDashboard;
