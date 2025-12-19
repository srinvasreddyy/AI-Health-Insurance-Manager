const express = require('express');
const router = express.Router();
const axios = require('axios');
const Prediction = require('../models/Prediction');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Schema for input validation
const predictionSchema = Joi.object({
  Age: Joi.number().required(),
  Diabetes: Joi.number().valid(0, 1).required(),
  BloodPressureProblems: Joi.number().valid(0, 1).required(),
  AnyTransplants: Joi.number().valid(0, 1).required(),
  AnyChronicDiseases: Joi.number().valid(0, 1).required(),
  Height: Joi.number().required(),
  Weight: Joi.number().required(),
  KnownAllergies: Joi.number().valid(0, 1).required(),
  HistoryOfCancerInFamily: Joi.number().valid(0, 1).required(),
  NumberOfMajorSurgeries: Joi.number().min(0).max(10).required()
});

router.post('/predict', authMiddleware, async (req, res) => {
  try {
    // Validate inputs
    const { error, value } = predictionSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Call Python Microservice
    // Note: In production, ensure the ML service is strictly internal or secured
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, value);
    const predictedPrice = mlResponse.data.premium_price;

    const newPrediction = new Prediction({
      userId: req.user.id,
      inputs: value,
      predictedPrice: predictedPrice
    });

    const savedPrediction = await newPrediction.save();

    res.json({
      predictionId: savedPrediction._id,
      price: predictedPrice,
      message: "Prediction successful"
    });

  } catch (error) {
    console.error("Prediction Error:", error.message);
    res.status(500).json({ message: 'Error processing prediction' });
  }
});

router.post('/feedback', authMiddleware, async (req, res) => {
  const { predictionId, isSatisfied } = req.body;
  try {
    await Prediction.findByIdAndUpdate(predictionId, { isSatisfied });
    res.json({ message: "Feedback recorded" });
  } catch (error) {
    res.status(500).json({ message: "Error saving feedback" });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await Prediction.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

module.exports = router;