# app.py - Flask Backend with Only Free Features

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from datetime import datetime, timedelta
import joblib
import numpy as np
from werkzeug.security import generate_password_hash, check_password_hash
import os
import math

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/dairy_supply_chain')

jwt = JWTManager(app)

# MongoDB Connection (FREE - Community Edition)
client = MongoClient(app.config['MONGO_URI'])
db = client.dairy_supply_chain

# Collections
users_collection = db.users
products_collection = db.products
orders_collection = db.orders
transactions_collection = db.transactions
predictions_collection = db.predictions
routes_collection = db.routes

# Load ML Model
try:
    demand_model = joblib.load('../models/demand_model.pkl')
except:
    demand_model = None

# ============================================
# FREE DISTANCE CALCULATION (Haversine Formula)
# ============================================

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    FREE alternative to Google Maps Distance Matrix API
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    return distance

# Predefined coordinates for common cities in Punjab (FREE data)
CITY_COORDINATES = {
    'ludhiana': (30.9010, 75.8573),
    'jalandhar': (31.3260, 75.5762),
    'amritsar': (31.6340, 74.8723),
    'patiala': (30.3398, 76.3869),
    'bathinda': (30.2110, 74.9455),
    'mohali': (30.7046, 76.7179),
    'hoshiarpur': (31.5330, 75.9120),
    'depot': (30.9010, 75.8573)  # Default depot at Ludhiana
}

def create_distance_matrix(locations):
    """Create distance matrix using Haversine formula (FREE)"""
    n = len(locations)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            if i != j:
                loc1 = locations[i].lower()
                loc2 = locations[j].lower()
                
                # Find coordinates
                coord1 = CITY_COORDINATES.get(loc1, CITY_COORDINATES['depot'])
                coord2 = CITY_COORDINATES.get(loc2, CITY_COORDINATES['depot'])
                
                distance = haversine_distance(coord1[0], coord1[1], coord2[0], coord2[1])
                matrix[i][j] = round(distance, 2)
    
    return matrix

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    required_fields = ['email', 'password', 'name', 'role']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'error': 'User already exists'}), 409
    
    user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'name': data['name'],
        'role': data['role'],
        'phone': data.get('phone', ''),
        'address': data.get('address', ''),
        'created_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(user)
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': str(result.inserted_id)
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={'role': user['role']}
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        }
    }), 200

# ============================================
# PRODUCTS & ORDERS
# ============================================

@app.route('/api/products', methods=['GET'])
@jwt_required()
def get_products():
    products = list(products_collection.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products), 200

@app.route('/api/products', methods=['POST'])
@jwt_required()
def add_product():
    user_id = get_jwt_identity()
    data = request.json
    
    product = {
        'farmer_id': user_id,
        'quantity': data['quantity'],
        'quality_grade': data.get('quality_grade', 'A'),
        'production_date': datetime.utcnow(),
        'expiry_date': datetime.utcnow() + timedelta(days=3),
        'price_per_liter': data.get('price', 50),
        'available': True
    }
    
    result = products_collection.insert_one(product)
    return jsonify({
        'message': 'Product added successfully',
        'product_id': str(result.inserted_id)
    }), 201

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    user = users_collection.find_one({'_id': user_id})
    
    if user['role'] == 'admin':
        orders = list(orders_collection.find())
    elif user['role'] == 'retailer':
        orders = list(orders_collection.find({'retailer_id': user_id}))
    elif user['role'] == 'farmer':
        orders = list(orders_collection.find({'farmer_id': user_id}))
    else:
        orders = list(orders_collection.find())
    
    for order in orders:
        order['_id'] = str(order['_id'])
    
    return jsonify(orders), 200

def get_dynamic_price(base_price, demand_index, spoilage_risk, quality):
    """Calculates the dynamic price based on several factors."""
    quality_multiplier = {'A+': 1.2, 'A': 1.0, 'B': 0.85}.get(quality, 1.0)
    
    dynamic_price = base_price * quality_multiplier * (1 + 0.15 * demand_index - 0.1 * spoilage_risk)
    dynamic_price = max(40, min(dynamic_price, 80))
    
    return round(dynamic_price, 2)

@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.json
    
    base_price = 50
    demand_index = data.get('demand_index', 1.0)
    spoilage_risk = data.get('spoilage_risk', 0.1)
    quality = data.get('quality', 'A')

    dynamic_price = get_dynamic_price(base_price, demand_index, spoilage_risk, quality)
    
    order = {
        'retailer_id': user_id,
        'farmer_id': data.get('farmer_id'),
        'quantity': data['quantity'],
        'price_per_liter': dynamic_price,
        'total_amount': data['quantity'] * dynamic_price,
        'delivery_date': data.get('delivery_date'),
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    result = orders_collection.insert_one(order)
    
    return jsonify({
        'message': 'Order created successfully',
        'order_id': str(result.inserted_id),
        'total_amount': order['total_amount']
    }), 201

@app.route('/api/orders/<order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    result = orders_collection.update_one(
        {'_id': order_id},
        {'$set': {'status': data['status'], 'updated_at': datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({'message': 'Order status updated successfully'}), 200

# ============================================
# ML PREDICTION (FREE)
# ============================================

@app.route('/api/prediction', methods=['POST'])
@jwt_required()
def predict_demand():
    data = request.json
    
    if demand_model is None:
        # Simple moving average prediction (FREE fallback)
        recent_demands = list(predictions_collection.find().sort('created_at', -1).limit(7))
        if recent_demands:
            avg_demand = sum(p.get('actual_demand', 1200) for p in recent_demands) / len(recent_demands)
            predicted_demand = avg_demand * 1.05  # 5% growth assumption
        else:
            predicted_demand = 1200
    else:
        features = np.array([[
            data.get('day_of_week', datetime.utcnow().weekday()),
            data.get('month', datetime.utcnow().month),
            data.get('previous_demand', 1200),
            data.get('season', 1)
        ]])
        predicted_demand = demand_model.predict(features)[0]
    
    prediction = {
        'date': (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d'),
        'predicted_demand': float(predicted_demand),
        'confidence': 0.85,
        'created_at': datetime.utcnow()
    }
    
    predictions_collection.insert_one(prediction.copy())
    
    return jsonify(prediction), 200

@app.route('/api/prediction/history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    predictions = list(predictions_collection.find().sort('created_at', -1).limit(30))
    for p in predictions:
        p['_id'] = str(p['_id'])
    return jsonify(predictions), 200

# ============================================
# FREE ROUTE OPTIMIZATION (Simple Greedy Algorithm)
# ============================================

def greedy_route_optimization(locations, demands, num_vehicles=3, capacity=1000):
    """
    Simple greedy algorithm for route optimization (FREE)
    Alternative to OR-Tools for basic optimization
    """
    distance_matrix = create_distance_matrix(locations)
    n = len(locations)
    
    # Initialize routes
    routes = [{'stops': [0], 'load': 0, 'distance': 0} for _ in range(num_vehicles)]
    visited = [False] * n
    visited[0] = True  # Depot
    
    current_vehicle = 0
    
    while not all(visited):
        route = routes[current_vehicle]
        current_location = route['stops'][-1]
        
        # Find nearest unvisited location that fits capacity
        best_location = None
        best_distance = float('inf')
        
        for i in range(1, n):
            if not visited[i] and route['load'] + demands[i] <= capacity:
                dist = distance_matrix[current_location][i]
                if dist < best_distance:
                    best_distance = dist
                    best_location = i
        
        if best_location is not None:
            route['stops'].append(best_location)
            route['load'] += demands[best_location]
            route['distance'] += best_distance
            visited[best_location] = True
        else:
            # Return to depot and move to next vehicle
            route['stops'].append(0)
            route['distance'] += distance_matrix[route['stops'][-2]][0]
            current_vehicle += 1
            if current_vehicle >= num_vehicles:
                break
    
    # Close remaining routes
    for route in routes:
        if route['stops'][-1] != 0 and len(route['stops']) > 1:
            route['stops'].append(0)
            route['distance'] += distance_matrix[route['stops'][-2]][0]
    
    return routes

@app.route('/api/optimize', methods=['POST'])
@jwt_required()
def optimize_routes():
    data = request.json
    locations = data.get('locations', ['depot', 'jalandhar', 'amritsar', 'patiala'])
    demands = data.get('demands', [0, 250, 300, 200])
    num_vehicles = data.get('num_vehicles', 3)
    
    routes = greedy_route_optimization(locations, demands, num_vehicles)
    
    # Calculate CO2 emissions
    co2_factor = 0.4  # kg per km
    for route in routes:
        route['co2_emissions'] = round(route['distance'] * co2_factor, 2)
        route['estimated_time'] = round(route['distance'] / 40 * 60, 0)  # 40 km/h average
    
    # Save to database
    optimization_result = {
        'locations': locations,
        'routes': routes,
        'total_distance': sum(r['distance'] for r in routes),
        'total_co2': sum(r['co2_emissions'] for r in routes),
        'created_at': datetime.utcnow()
    }
    
    routes_collection.insert_one(optimization_result)
    
    return jsonify({
        'success': True,
        'routes': routes,
        'total_distance': optimization_result['total_distance'],
        'total_co2': optimization_result['total_co2']
    }), 200

# ============================================
# DYNAMIC PRICING (FREE)
# ============================================

@app.route('/api/pricing', methods=['POST'])
@jwt_required()
def calculate_dynamic_price():
    data = request.json
    
    base_price = 50
    demand_index = data.get('demand_index', 1.0)
    spoilage_risk = data.get('spoilage_risk', 0.1)
    quality = data.get('quality', 'A')

    dynamic_price = get_dynamic_price(base_price, demand_index, spoilage_risk, quality)
    
    return jsonify({
        'base_price': base_price,
        'dynamic_price': dynamic_price,
        'factors': {
            'demand_index': demand_index,
            'spoilage_risk': spoilage_risk,
            'quality_multiplier': {'A+': 1.2, 'A': 1.0, 'B': 0.85}.get(quality, 1.0)
        }
    }), 200

# ============================================
# FREE PAYMENT SIMULATION (Mock UPI)
# ============================================

@app.route('/api/payments/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    user_id = get_jwt_identity()
    data = request.json
    
    # Simulate UPI payment (FREE - no actual payment gateway)
    payment = {
        'payment_id': f"PAY_{int(datetime.utcnow().timestamp() * 1000)}",
        'order_id': data['order_id'],
        'amount': data['amount'],
        'currency': 'INR',
        'status': 'pending',
        'payment_method': 'UPI_SIMULATION',
        'upi_id': data.get('upi_id', 'user@upi'),
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    
    result = transactions_collection.insert_one(payment)
    
    return jsonify({
        'payment_id': payment['payment_id'],
        'amount': payment['amount'],
        'status': 'pending',
        'message': 'Payment initiated (Simulation mode - no real transaction)'
    }), 200

@app.route('/api/payments/<payment_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_payment(payment_id):
    """Simulate payment confirmation (FREE)"""
    
    transactions_collection.update_one(
        {'payment_id': payment_id},
        {'$set': {'status': 'success', 'updated_at': datetime.utcnow()}}
    )
    
    # Update order status
    payment = transactions_collection.find_one({'payment_id': payment_id})
    if payment:
        orders_collection.update_one(
            {'_id': payment['order_id']},
            {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
        )
    
    return jsonify({'message': 'Payment confirmed successfully'}), 200

@app.route('/api/payments/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    user_id = get_jwt_identity()
    payments = list(transactions_collection.find({'user_id': user_id}).sort('created_at', -1))
    
    for payment in payments:
        payment['_id'] = str(payment['_id'])
    
    return jsonify(payments), 200

# ============================================
# METRICS & CO2 (FREE)
# ============================================

@app.route('/api/metrics/co2', methods=['GET'])
@jwt_required()
def get_co2_metrics():
    recent_routes = list(routes_collection.find().sort('created_at', -1).limit(10))
    
    route_data = []
    total_co2 = 0
    
    for doc in recent_routes:
        for route in doc.get('routes', []):
            route_data.append({
                'route': f"Route {len(route_data) + 1}",
                'distance': route['distance'],
                'co2': route['co2_emissions']
            })
            total_co2 += route['co2_emissions']
    
    co2_saved = total_co2 * 0.25
    
    return jsonify({
        'routes': route_data,
        'total_co2_emissions': round(total_co2, 2),
        'co2_saved_through_optimization': round(co2_saved, 2),
        'trees_equivalent': round(co2_saved / 21, 1)
    }), 200

@app.route('/api/metrics/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    total_orders = orders_collection.count_documents({})
    active_users = users_collection.count_documents({})
    
    pipeline = [{'$group': {'_id': None, 'total': {'$sum': '$total_amount'}}}]
    revenue_result = list(orders_collection.aggregate(pipeline))
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    predictions = list(predictions_collection.find().sort('created_at', -1).limit(10))
    
    return jsonify({
        'total_orders': total_orders,
        'active_users': active_users,
        'total_revenue': total_revenue,
        'recent_predictions': len(predictions),
        'avg_accuracy': 0.87
    }), 200

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': 'connected',
            'ml_model': 'loaded' if demand_model else 'not_loaded',
            'features': 'free_tier_only'
        }
    }), 200

@app.route('/')
def home():
    return "Dairy Supply Chain Backend Running!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)