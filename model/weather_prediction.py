import pandas as pd
import numpy as np
import xgboost as xg
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error as MSE

# DUMMY FILE: This is a placeholder for weather data prediction using XGBoost.
# The data used here is generated randomly for demonstration purposes.

def predict_next_5_days():
    """
    Dummy function to demonstrate weather prediction using XGBoost.
    Predicts the next 5 days of temperature based on dummy historical data.
    """
    print("--- DUMMY WEATHER PREDICTION MODEL (XGBOOST) ---")
    
    # 1. Generate Dummy Data (Feature: Humidity, Wind Speed; Target: Temperature)
    data = {
        'humidity': np.random.uniform(30, 90, 100),
        'wind_speed': np.random.uniform(0, 20, 100),
        'temperature': np.random.uniform(15, 35, 100)
    }
    df = pd.DataFrame(data)

    # 2. Prepare Features and Target
    X = df[['humidity', 'wind_speed']]
    y = df['temperature']

    # 3. Split the data
    train_X, test_X, train_y, test_y = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Instantiate and Fit XGBoost Regressor
    # Using default parameters for this dummy implementation
    xgb_r = xg.XGBRegressor(objective='reg:squarederror', n_estimators=10, seed=123)
    xgb_r.fit(train_X, train_y)

    # 5. Predict on test set (for validation)
    pred = xgb_r.predict(test_X)
    rmse = np.sqrt(MSE(test_y, pred))
    print(f"Dummy Model RMSE: {rmse:.4f}")

    # 6. Predict next 5 days (Dummy Features)
    print("\nPredicting next 5 days based on dummy future features:")
    dummy_future_features = pd.DataFrame({
        'humidity': [60, 55, 65, 70, 58],
        'wind_speed': [10, 12, 8, 15, 11]
    })
    
    predictions = xgb_r.predict(dummy_future_features)
    
    for i, p in enumerate(predictions, 1):
        print(f"Day {i} Predicted Temperature: {p:.2f}°C")

    return predictions

if __name__ == "__main__":
    predict_next_5_days()
    print("\nNote: This is a asd a dummy file as requested.")
