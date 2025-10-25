import React, { useState, useEffect } from 'react';
import { productAPI, orderAPI, mlAPI, metricsAPI } from '../services/api';
import FarmerDashboard from '../components/FarmerDashboard';
import RetailerDashboard from '../components/RetailerDashboard';
import DistributorDashboard from '../components/DistributorDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Dashboard = ({ user, onLogout }) => {
  // Safety check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  const [activeRole, setActiveRole] = useState(user?.role || 'farmer');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [co2Data, setCo2Data] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [ordersRes, productsRes, predictionsRes, co2Res, metricsRes] = await Promise.all([
        orderAPI.getOrders().catch(() => ({ data: [] })),
        productAPI.getProducts().catch(() => ({ data: [] })),
        mlAPI.getPredictionHistory().catch(() => ({ data: [] })),
        metricsAPI.getCO2Metrics().catch(() => ({ data: { routes: [] } })),
        metricsAPI.getDashboardMetrics().catch(() => ({ data: {} }))
      ]);

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setPredictions(predictionsRes.data || []);
      setCo2Data(co2Res.data?.routes || []);
      setDashboardMetrics(metricsRes.data || {});

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // LOADING STATE
  // ===========================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🥛</div>
          <p className="text-gray-600 text-lg font-medium">Loading dashboard data...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // ===========================================
  // MAIN RENDER
  // ===========================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🥛 Dairy Supply Chain Management</h1>
            <p className="text-blue-100">AI-Powered Logistics & Optimization Platform</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Welcome, {user?.name || 'User'}</p>
            <p className="text-xs text-blue-200 mb-2">{user?.email || ''}</p>
            <button
              onClick={onLogout}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Role Selector - Only show if admin */}
      {user?.role === 'admin' && (
        <div className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-sm text-gray-600 mb-2">View as:</p>
            <div className="flex space-x-4">
              {['admin', 'farmer', 'retailer', 'distributor'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    activeRole === role
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeRole === 'admin' && <AdminDashboard orders={orders} predictions={predictions} co2Data={co2Data} dashboardMetrics={dashboardMetrics} />}
        {activeRole === 'farmer' && <FarmerDashboard user={user} products={products} setProducts={setProducts} />}
        {activeRole === 'retailer' && <RetailerDashboard user={user} orders={orders} setOrders={setOrders} predictions={predictions} />}
        {activeRole === 'distributor' && <DistributorDashboard orders={orders} fetchDashboardData={fetchDashboardData} />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          <p>© 2025 Dairy Supply Chain Management System. All rights reserved.</p>
          <p className="mt-1">Powered by AI & Machine Learning</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
