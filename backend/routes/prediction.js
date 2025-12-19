const express = require('express');
const router = express.Router();
const axios = require('axios'); // To talk to Python
const Prediction = require('../models/Prediction');
const authMiddleware = require('../middleware/auth'); // Your JWT middleware

// 1. POST - Get Prediction
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const inputs = req.body; // Contains Age, Diabetes, etc.

    // Call Python Microservice
    const mlResponse = await axios.post('http://localhost:5001/predict', inputs);
    const predictedPrice = mlResponse.data.premium_price;

    // Save to Database immediately
    const newPrediction = new Prediction({
      userId: req.user.id, // From JWT
      inputs: inputs,
      predictedPrice: predictedPrice,
      isSatisfied: null // Waiting for feedback
    });

    const savedPrediction = await newPrediction.save();

    res.json({
      predictionId: savedPrediction._id,
      price: predictedPrice,
      message: "Prediction successful"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// 2. POST - Submit Feedback
router.post('/feedback', authMiddleware, async (req, res) => {
  const { predictionId, isSatisfied } = req.body;

  try {
    await Prediction.findByIdAndUpdate(predictionId, { isSatisfied: isSatisfied });
    res.json({ message: "Feedback recorded" });
  } catch (error) {
    res.status(500).send("Error saving feedback");
  }
});

// 3. GET - User History
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await Prediction.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).send("Error fetching history");
  }
});

module.exports = router;