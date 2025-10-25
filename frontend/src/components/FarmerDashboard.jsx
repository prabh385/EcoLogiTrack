import React, { useState, useEffect } from 'react';
import { Package, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { productAPI } from '../services/api';

const FarmerDashboard = ({ user, products, setProducts }) => {
  const [production, setProduction] = useState({ milk: '', quality: 'A' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmitProduction = async () => {
    if (!production.milk || production.milk <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await productAPI.addProduct({
        quantity: parseFloat(production.milk),
        quality_grade: production.quality,
        price: 50
      });
      
      setMessage({ type: 'success', text: '✅ Production data submitted successfully!' });
      setProduction({ milk: '', quality: 'A' });
      
      // Refresh products list
      const productsRes = await productAPI.getProducts();
      setProducts(productsRes.data || []);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '❌ ' + (error.response?.data?.error || 'Failed to submit production data') 
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Calculate farmer stats from products
  const farmerProducts = products.filter(p => p.farmer_id === user.id);
  const totalProduction = farmerProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalRevenue = farmerProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price_per_liter || 0)), 0);
  const availableProducts = farmerProducts.filter(p => p.available).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Farmer Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Production</p>
              <p className="text-3xl font-bold text-gray-800">{totalProduction.toFixed(0)}L</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <Package className="text-green-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800">₹{totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-gray-400 mt-1">From {farmerProducts.length} batches</p>
            </div>
            <DollarSign className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Stock</p>
              <p className="text-3xl font-bold text-gray-800">{availableProducts}</p>
              <p className="text-xs text-gray-400 mt-1">Products listed</p>
            </div>
            <CheckCircle className="text-yellow-500" size={40} />
          </div>
        </div>
      </div>

      {/* Production Upload Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Upload Daily Production</h3>
        
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milk Quantity (Liters) *
            </label>
            <input
              type="number"
              value={production.milk}
              onChange={(e) => setProduction({...production, milk: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Enter quantity"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Grade *
            </label>
            <select
              value={production.quality}
              onChange={(e) => setProduction({...production, quality: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="A+">A+ (Premium - Fat 6%>)</option>
              <option value="A">A (Standard - Fat 4-6%)</option>
              <option value="B">B (Basic - Fat 3-4%)</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleSubmitProduction}
          disabled={submitting}
          className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Production Data'}
        </button>
      </div>

      {/* Recent Products Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Products</h3>
        {farmerProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price/L</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total Value</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {farmerProducts.slice(0, 10).map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(product.production_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.quantity}L</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.quality_grade === 'A+' ? 'bg-green-100 text-green-800' :
                        product.quality_grade === 'A' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.quality_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">₹{product.price_per_liter?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{(product.quantity * product.price_per_liter).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        product.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.available ? 'Available' : 'Sold'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No products yet. Upload your first production above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
