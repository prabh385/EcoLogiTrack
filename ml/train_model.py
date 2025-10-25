# train_model.py - Train Random Forest Model for Demand Prediction

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# ============================================
# GENERATE SYNTHETIC TRAINING DATA
# ============================================

def generate_training_data(n_samples=1000):
    """
    Generate synthetic demand data for training
    In production, replace this with actual historical data
    """
    np.random.seed(42)
    
    data = []
    start_date = datetime(2023, 1, 1)
    
    for i in range(n_samples):
        date = start_date + timedelta(days=i % 365)
        
        # Features
        day_of_week = date.weekday()  # 0=Monday, 6=Sunday
        month = date.month
        day_of_month = date.day
        is_weekend = 1 if day_of_week >= 5 else 0
        is_festival_season = 1 if month in [10, 11, 12, 3, 4] else 0  # Diwali, Holi seasons
        
        # Previous day demand (lagged feature)
        if i == 0:
            prev_demand = 1200
        else:
            prev_demand = data[-1]['demand']
        
        # Generate demand with patterns
        base_demand = 1200
        weekend_effect = 200 if is_weekend else 0
        festival_effect = 300 if is_festival_season else 0
        weekly_pattern = 150 * np.sin(2 * np.pi * day_of_week / 7)
        monthly_pattern = 100 * np.sin(2 * np.pi * month / 12)
        trend = i * 0.5  # Slight upward trend
        noise = np.random.normal(0, 100)
        
        demand = (base_demand + weekend_effect + festival_effect + 
                 weekly_pattern + monthly_pattern + trend + noise)
        demand = max(800, min(demand, 2500))  # Constrain demand
        
        # Temperature effect (higher in summer)
        temperature = 25 + 10 * np.sin(2 * np.pi * (month - 3) / 12) + np.random.normal(0, 3)
        
        # Price effect
        price = 50 + np.random.uniform(-5, 5)
        
        data.append({
            'date': date,
            'day_of_week': day_of_week,
            'month': month,
            'day_of_month': day_of_month,
            'is_weekend': is_weekend,
            'is_festival_season': is_festival_season,
            'prev_demand': prev_demand,
            'temperature': temperature,
            'price': price,
            'demand': demand
        })
    
    return pd.DataFrame(data)

# ============================================
# FEATURE ENGINEERING
# ============================================

def engineer_features(df):
    """Add additional features"""
    
    # Rolling averages
    df['demand_7day_avg'] = df['demand'].rolling(window=7, min_periods=1).mean()
    df['demand_30day_avg'] = df['demand'].rolling(window=30, min_periods=1).mean()
    
    # Lag features
    df['demand_lag_1'] = df['demand'].shift(1).fillna(df['demand'].mean())
    df['demand_lag_7'] = df['demand'].shift(7).fillna(df['demand'].mean())
    
    # Cyclical encoding for day and month
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    return df

# ============================================
# MODEL TRAINING
# ============================================

def train_model():
    """Train Random Forest model for demand prediction"""
    
    print("Generating training data...")
    df = generate_training_data(n_samples=1000)
    
    print("Engineering features...")
    df = engineer_features(df)
    
    # Select features
    feature_columns = [
        'day_of_week', 'month', 'day_of_month',
        'is_weekend', 'is_festival_season',
        'prev_demand', 'temperature', 'price',
        'demand_7day_avg', 'demand_30day_avg',
        'demand_lag_1', 'demand_lag_7',
        'day_sin', 'day_cos', 'month_sin', 'month_cos'
    ]
    
    X = df[feature_columns]
    y = df['demand']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False  # Time series: don't shuffle
    )
    
    print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Train Random Forest
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Evaluation
    print("\n" + "="*50)
    print("MODEL EVALUATION")
    print("="*50)
    
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"\nTraining Set:")
    print(f"  MAE:  {train_mae:.2f}")
    print(f"  RMSE: {train_rmse:.2f}")
    print(f"  R²:   {train_r2:.4f}")
    
    print(f"\nTest Set:")
    print(f"  MAE:  {test_mae:.2f}")
    print(f"  RMSE: {test_rmse:.2f}")
    print(f"  R²:   {test_r2:.4f}")
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, 
                                 scoring='neg_mean_absolute_error')
    print(f"\nCross-Validation MAE: {-cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10).to_string(index=False))
    
    # Save model
    print("\nSaving model...")
    joblib.dump(model, 'models/demand_model.pkl')
    joblib.dump(feature_columns, 'models/feature_columns.pkl')
    
    print("Model saved successfully!")
    
    # Visualizations
    create_visualizations(df, y_test, y_pred_test, feature_importance)
    
    return model

# ============================================
# VISUALIZATIONS
# ============================================

def create_visualizations(df, y_test, y_pred_test, feature_importance):
    """Create and save visualization plots"""
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Plot 1: Actual vs Predicted
    axes[0, 0].scatter(y_test, y_pred_test, alpha=0.5)
    axes[0, 0].plot([y_test.min(), y_test.max()], 
                    [y_test.min(), y_test.max()], 'r--', lw=2)
    axes[0, 0].set_xlabel('Actual Demand')
    axes[0, 0].set_ylabel('Predicted Demand')
    axes[0, 0].set_title('Actual vs Predicted Demand')
    axes[0, 0].grid(True, alpha=0.3)
    
    # Plot 2: Residuals
    residuals = y_test.values - y_pred_test
    axes[0, 1].scatter(y_pred_test, residuals, alpha=0.5)
    axes[0, 1].axhline(y=0, color='r', linestyle='--')
    axes[0, 1].set_xlabel('Predicted Demand')
    axes[0, 1].set_ylabel('Residuals')
    axes[0, 1].set_title('Residual Plot')
    axes[0, 1].grid(True, alpha=0.3)
    
    # Plot 3: Feature Importance
    top_features = feature_importance.head(10)
    axes[1, 0].barh(top_features['feature'], top_features['importance'])
    axes[1, 0].set_xlabel('Importance')
    axes[1, 0].set_title('Top 10 Feature Importance')
    axes[1, 0].invert_yaxis()
    
    # Plot 4: Demand Time Series
    axes[1, 1].plot(df['date'][-200:], df['demand'][-200:], label='Actual', alpha=0.7)
    axes[1, 1].plot(df['date'][-200:], df['demand_7day_avg'][-200:], 
                    label='7-day MA', linewidth=2)
    axes[1, 1].set_xlabel('Date')
    axes[1, 1].set_ylabel('Demand')
    axes[1, 1].set_title('Demand Time Series (Last 200 days)')
    axes[1, 1].legend()
    axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('models/model_evaluation.png', dpi=300, bbox_inches='tight')
    print("Visualizations saved to 'models/model_evaluation.png'")

# ============================================
# PREDICTION FUNCTION
# ============================================

def predict_next_day(model, current_data):
    """
    Predict demand for the next day
    
    Args:
        model: Trained model
        current_data: Dict with current features
    
    Returns:
        Predicted demand value
    """
    feature_columns = joblib.load('models/feature_columns.pkl')
    
    # Prepare features
    features = pd.DataFrame([current_data])[feature_columns]
    
    prediction = model.predict(features)[0]
    
    return prediction

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import os
    
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Train model
    model = train_model()
    
    # Example prediction
    print("\n" + "="*50)
    print("EXAMPLE PREDICTION")
    print("="*50)
    
    sample_data = {
        'day_of_week': 3,  # Thursday
        'month': 10,
        'day_of_month': 2,
        'is_weekend': 0,
        'is_festival_season': 1,
        'prev_demand': 1450,
        'temperature': 28,
        'price': 52,
        'demand_7day_avg': 1420,
        'demand_30day_avg': 1380,
        'demand_lag_1': 1450,
        'demand_lag_7': 1320,
        'day_sin': np.sin(2 * np.pi * 3 / 7),
        'day_cos': np.cos(2 * np.pi * 3 / 7),
        'month_sin': np.sin(2 * np.pi * 10 / 12),
        'month_cos': np.cos(2 * np.pi * 10 / 12)
    }
    
    predicted_demand = predict_next_day(model, sample_data)
    print(f"\nPredicted demand for tomorrow: {predicted_demand:.0f} liters")
    print("\nModel training complete!")