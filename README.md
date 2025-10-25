# Dairy Supply Chain Management Backend

This is the backend component of the Dairy Supply Chain Management system, built using Flask and MongoDB. The backend provides a RESTful API to support various features of the application.

## Features

- **Demand Prediction**: Predicts the demand for dairy products using historical data.
- **Route Optimization**: Optimizes delivery routes for efficient logistics.
- **Dynamic Pricing**: Implements pricing strategies based on demand and supply.
- **Digital Payments**: Manages digital payment transactions securely.
- **CO₂ Dashboard**: Provides insights into the carbon footprint of the supply chain.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd dairy-supply-chain-management/backend
   ```

2. **Create a virtual environment** (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```
   python app.py
   ```

The backend will be running on `http://localhost:5000`.

## API Endpoints

- **POST /api/prediction**: Get demand predictions.
- **POST /api/optimize**: Optimize delivery routes.
- **POST /api/payments**: Process digital payments.
- **GET /api/co2**: Retrieve CO₂ data.

## Database

This application uses MongoDB for data storage. Ensure that MongoDB is installed and running on your machine.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.