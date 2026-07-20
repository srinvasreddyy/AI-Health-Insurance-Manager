import { useEffect, useState } from 'react';
import PredictionForm from '../components/PredictionForm';
import client from '../api/client';
import { motion } from 'framer-motion';
import { History, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const { isAuthenticated, guestMode, user } = useAuth();
  const navigate = useNavigate();

  // Fetch history from backend or localStorage
  const fetchHistory = async () => {
    try {
      if (isAuthenticated && user) {
        // Authenticated user: fetch from backend
        const res = await client.get('/prediction/history');
        setHistory(res.data);
        // Clear local storage since data is now synced
        localStorage.removeItem('guestPredictions');
      } else if (guestMode) {
        // Guest mode: fetch from localStorage
        const stored = localStorage.getItem('guestPredictions');
        setHistory(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error("Failed to load history", error);
      // Fallback to localStorage if backend fails
      if (guestMode) {
        const stored = localStorage.getItem('guestPredictions');
        setHistory(stored ? JSON.parse(stored) : []);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isAuthenticated, guestMode, user]);

  // Handle new prediction saved
  const handlePredictionComplete = (newPrediction) => {
    if (isAuthenticated && user) {
      // Authenticated: backend will save it
      fetchHistory();
    } else if (guestMode) {
      // Guest mode: add to local storage
      const stored = localStorage.getItem('guestPredictions');
      const predictions = stored ? JSON.parse(stored) : [];
      predictions.unshift(newPrediction);
      localStorage.setItem('guestPredictions', JSON.stringify(predictions));
      setHistory(predictions);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Guest Mode Warning */}
        {guestMode && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Guest Mode Active</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Your predictions are saved locally. <button onClick={() => navigate('/login')} className="underline font-medium hover:text-yellow-900">Log in</button> to sync your history across devices.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-2">
            <PredictionForm onPredictionComplete={handlePredictionComplete} />
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 h-full"
            >
              <div className="flex items-center gap-2 mb-6 text-slate-800">
                <History className="text-primary-500" />
                <h2 className="text-xl font-bold">
                  {guestMode ? 'Local History' : 'Recent Checks'}
                </h2>
              </div>
              
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <Clock size={40} className="mx-auto mb-2 opacity-50" />
                    <p>{guestMode ? 'No local predictions yet' : 'No history yet'}</p>
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <motion.div
                      key={item._id || idx}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          ₹ {Math.round(item.predictedPrice || item.price)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Age: {item.inputs.Age} • Weight: {item.inputs.Weight}kg</p>
                        <p>Major Surgeries: {item.inputs.NumberOfMajorSurgeries}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
