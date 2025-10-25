from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def setup_free_database():
    """Setup database with free MongoDB"""
    
    # Connect to FREE MongoDB (local or Atlas free tier)
    client = MongoClient('mongodb://localhost:27017/')
    db = client.dairy_supply_chain
    
    print("\n" + "="*60)
    print("DAIRY SUPPLY CHAIN - FREE DATABASE SETUP")
    print("="*60 + "\n")
    
    # Clear existing data
    print("Clearing existing collections...")
    db.users.delete_many({})
    db.products.delete_many({})
    db.orders.delete_many({})
    db.transactions.delete_many({})
    db.predictions.delete_many({})
    db.routes.delete_many({})
    
    # Create indexes (FREE optimization)
    print("Creating indexes...")
    db.users.create_index('email', unique=True)
    db.orders.create_index([('status', 1), ('created_at', -1)])
    db.products.create_index('farmer_id')
    db.transactions.create_index('payment_id')
    
    # Insert test users
    print("Creating test users...")
    users = [
        {
            'email': 'admin@dairy.com',
            'password': generate_password_hash('admin123'),
            'name': 'Admin User',
            'role': 'admin',
            'phone': '+91-9876543210',
            'address': 'Ludhiana, Punjab',
            'created_at': datetime.utcnow()
        },
        {
            'email': 'farmer1@dairy.com',
            'password': generate_password_hash('farmer123'),
            'name': 'Rajesh Kumar',
            'role': 'farmer',
            'phone': '+91-9876543211',
            'address': 'Village Khanna, Ludhiana',
            'farm_size': '10 acres',
            'cattle_count': 25,
            'created_at': datetime.utcnow()
        },
        {
            'email': 'farmer2@dairy.com',
            'password': generate_password_hash('farmer123'),
            'name': 'Priya Singh',
            'role': 'farmer',
            'phone': '+91-9876543212',
            'address': 'Village Raikot, Ludhiana',
            'farm_size': '8 acres',
            'cattle_count': 18,
            'created_at': datetime.utcnow()
        },
        {
            'email': 'retailer1@dairy.com',
            'password': generate_password_hash('retailer123'),
            'name': 'Fresh Mart Store',
            'role': 'retailer',
            'phone': '+91-9876543213',
            'address': 'Model Town, Jalandhar',
            'store_type': 'Supermarket',
            'created_at': datetime.utcnow()
        },
        {
            'email': 'retailer2@dairy.com',
            'password': generate_password_hash('retailer123'),
            'name': 'Daily Needs Shop',
            'role': 'retailer',
            'phone': '+91-9876543214',
            'address': 'Mall Road, Amritsar',
            'store_type': 'Local Store',
            'created_at': datetime.utcnow()
        },
        {
            'email': 'distributor1@dairy.com',
            'password': generate_password_hash('dist123'),
            'name': 'Punjab Dairy Logistics',
            'role': 'distributor',
            'phone': '+91-9876543215',
            'address': 'Industrial Area, Ludhiana',
            'vehicle_count': 5,
            'warehouse_capacity': 5000,
            'created_at': datetime.utcnow()
        }
    ]
    
    user_result = db.users.insert_many(users)
    print(f"✓ Created {len(user_result.inserted_ids)} users")
    
    # Insert sample products
    print("Creating sample products...")
    farmer_ids = [str(uid) for uid in user_result.inserted_ids[1:3]]
    products = []
    
    for farmer_id in farmer_ids:
        for day in range(7):
            date = datetime.utcnow() - timedelta(days=day)
            products.append({
                'farmer_id': farmer_id,
                'quantity': random.randint(300, 600),
                'quality_grade': random.choice(['A+', 'A', 'A']),
                'production_date': date,
                'expiry_date': date + timedelta(days=3),
                'price_per_liter': 50 + random.uniform(-5, 5),
                'available': day < 2
            })
    
    product_result = db.products.insert_many(products)
    print(f"✓ Created {len(product_result.inserted_ids)} products")
    
    # Insert sample orders
    print("Creating sample orders...")
    retailer_ids = [str(uid) for uid in user_result.inserted_ids[3:5]]
    orders = []
    
    for i in range(15):
        date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
        quantity = random.randint(200, 600)
        price = 50 + random.uniform(-3, 3)
        
        orders.append({
            'retailer_id': random.choice(retailer_ids),
            'farmer_id': random.choice(farmer_ids),
            'quantity': quantity,
            'price_per_liter': price,
            'total_amount': quantity * price,
            'delivery_date': date + timedelta(days=1),
            'status': random.choice(['delivered', 'in_transit', 'processing', 'pending']),
            'payment_status': 'paid' if random.random() > 0.2 else 'pending',
            'created_at': date
        })
    
    order_result = db.orders.insert_many(orders)
    print(f"✓ Created {len(order_result.inserted_ids)} orders")
    
    # Insert sample transactions (simulated payments)
    print("Creating sample transactions...")
    transactions = []
    
    for i in range(10):
        transactions.append({
            'payment_id': f"PAY_SIM_{random.randint(100000, 999999)}",
            'order_id': str(random.choice(order_result.inserted_ids)),
            'amount': random.randint(10000, 30000),
            'currency': 'INR',
            'status': 'success',
            'payment_method': 'UPI_SIMULATION',
            'upi_id': f'user{i}@upi',
            'created_at': datetime.utcnow() - timedelta(days=random.randint(0, 30))
        })
    
    transaction_result = db.transactions.insert_many(transactions)
    print(f"✓ Created {len(transaction_result.inserted_ids)} transactions")
    
    # Insert sample predictions
    print("Creating sample predictions...")
    predictions = []
    
    for day in range(30):
        date = datetime.utcnow() - timedelta(days=30-day)
        base_demand = 1200
        demand = base_demand + random.uniform(-200, 300)
        
        predictions.append({
            'date': date.strftime('%Y-%m-%d'),
            'predicted_demand': demand,
            'actual_demand': demand + random.uniform(-50, 50) if day < 28 else None,
            'confidence': 0.80 + random.uniform(0, 0.15),
            'created_at': date
        })
    
    prediction_result = db.predictions.insert_many(predictions)
    print(f"✓ Created {len(prediction_result.inserted_ids)} predictions")
    
    # Insert sample routes
    print("Creating sample routes...")
    routes = []
    
    for i in range(5):
        routes.append({
            'locations': ['ludhiana', 'jalandhar', 'amritsar', 'patiala'],
            'vehicles': [
                {
                    'vehicle_id': 1,
                    'route': [0, 1, 2, 0],
                    'distance': 145.5,
                    'load': 550,
                    'co2_emissions': 58.2
                },
                {
                    'vehicle_id': 2,
                    'route': [0, 3, 0],
                    'distance': 125.8,
                    'load': 400,
                    'co2_emissions': 50.3
                }
            ],
            'total_distance': 271.3,
            'total_co2': 108.5,
            'created_at': datetime.utcnow() - timedelta(days=i)
        })
    
    route_result = db.routes.insert_many(routes)
    print(f"✓ Created {len(route_result.inserted_ids)} route optimizations")
    
    print("\n" + "="*60)
    print("DATABASE SETUP COMPLETE!")
    print("="*60)
    print("\n📋 Test Credentials (100% FREE):")
    print("-" * 60)
    print("Admin:       admin@dairy.com / admin123")
    print("Farmer 1:    farmer1@dairy.com / farmer123")
    print("Farmer 2:    farmer2@dairy.com / farmer123")
    print("Retailer 1:  retailer1@dairy.com / retailer123")
    print("Retailer 2:  retailer2@dairy.com / retailer123")
    print("Distributor: distributor1@dairy.com / dist123")
    print("-" * 60)
    print("\n✅ All features are 100% FREE - No paid APIs required!")
    print("✅ Uses FREE MongoDB Community Edition")
    print("✅ Uses FREE Haversine formula for distances")
    print("✅ Uses FREE greedy algorithm for route optimization")
    print("✅ Uses FREE ML libraries (Scikit-learn)")
    print("✅ Simulated UPI payments (no payment gateway fees)")
    print("\n")

if __name__ == "__main__":
    setup_free_database()
