const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inputs: {
    Age: Number,
    Diabetes: Number, // 0 or 1
    BloodPressureProblems: Number,
    AnyTransplants: Number,
    AnyChronicDiseases: Number,
    Height: Number,
    Weight: Number,
    KnownAllergies: Number,
    HistoryOfCancerInFamily: Number,
    NumberOfMajorSurgeries: Number
  },
  predictedPrice: Number,
  isSatisfied: { type: Boolean, default: null }, // Null = no feedback yet, True = Yes, False = No
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', PredictionSchema);