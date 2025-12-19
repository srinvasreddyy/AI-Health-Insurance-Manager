from flask import Flask, request, jsonify
import pickle
import numpy as np
import os

app = Flask(__name__)

# Load model and scaler securely
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'insurance_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    print("Model and Scaler loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    # In production, you might want to exit if models aren't found
    model = None
    scaler = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Model not initialized'}), 500

    try:
        data = request.json
        
        # Validate required keys exist
        required_keys = [
            'Age', 'Diabetes', 'BloodPressureProblems', 'AnyTransplants', 
            'AnyChronicDiseases', 'Height', 'Weight', 'KnownAllergies', 
            'HistoryOfCancerInFamily', 'NumberOfMajorSurgeries'
        ]
        
        for key in required_keys:
            if key not in data:
                return jsonify({'error': f'Missing key: {key}'}), 400

        # Extract features ensuring correct order and type
        features = [
            float(data['Age']),
            int(data['Diabetes']),
            int(data['BloodPressureProblems']),
            int(data['AnyTransplants']),
            int(data['AnyChronicDiseases']),
            float(data['Height']),
            float(data['Weight']),
            int(data['KnownAllergies']),
            int(data['HistoryOfCancerInFamily']),
            int(data['NumberOfMajorSurgeries'])
        ]
        
        features_array = np.array([features])
        scaled_features = scaler.transform(features_array)
        prediction = model.predict(scaled_features)
        
        return jsonify({'premium_price': float(prediction[0])})
        
    except Exception as e:
        app.logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 400

if __name__ == '__main__':
    # Use Gunicorn in production instead of app.run()
    app.run(host='0.0.0.0', port=5001, debug=os.environ.get('FLASK_DEBUG', 'False') == 'True')