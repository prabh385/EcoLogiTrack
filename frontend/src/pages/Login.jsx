import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick login buttons for testing
  const testAccounts = [
    { email: 'admin@dairy.com', password: 'admin123', role: 'Admin' },
    { email: 'farmer1@dairy.com', password: 'farmer123', role: 'Farmer' },
    { email: 'retailer1@dairy.com', password: 'retailer123', role: 'Retailer' },
    { email: 'distributor1@dairy.com', password: 'dist123', role: 'Distributor' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const quickLogin = async (email, password) => {
    setFormData({ email, password });
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="text-6xl mb-4">🥛</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Dairy Supply Chain
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Login Buttons for Testing */}
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600 text-center mb-3">Quick Login (For Testing)</p>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => quickLogin(account.email, account.password)}
                  disabled={loading}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">Don't have an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="text-center text-xs text-gray-500">
          <p>🌾 Farmer Management • 📊 Demand Prediction</p>
          <p>🚚 Route Optimization • 🌱 CO₂ Tracking</p>
        </div>
      </div>
    </div>
  );
};

export default Login;