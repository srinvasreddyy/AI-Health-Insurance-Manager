require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');

const app = express();

app.use(helmet());
app.use(cors({ origin: [process.env.CLIENT_URL , 'http://localhost:3000','https://ai-health-insurance-manager-g1dl.vercel.app',"https://ai-health-insurance-manager.vercel.app"] }));
app.use(express.json());
app.use(morgan('combined'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/insurance_db')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prediction', predictionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
