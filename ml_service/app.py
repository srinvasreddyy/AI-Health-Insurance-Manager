# ml_service/app.py
from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load model and scaler
with open('insurance_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Extract features in the EXACT order of your DataFrame
    features = [
        data['Age'],
        data['Diabetes'],
        data['BloodPressureProblems'],
        data['AnyTransplants'],
        data['AnyChronicDiseases'],
        data['Height'],
        data['Weight'],
        data['KnownAllergies'],
        data['HistoryOfCancerInFamily'],
        data['NumberOfMajorSurgeries']
    ]
    
    # Convert to 2D array
    features_array = np.array([features])
    
    # Scale the data using the loaded scaler
    scaled_features = scaler.transform(features_array)
    
    # Predict
    prediction = model.predict(scaled_features)
    
    return jsonify({'premium_price': float(prediction[0])})

if __name__ == '__main__':
    app.run(port=5001, debug=True)