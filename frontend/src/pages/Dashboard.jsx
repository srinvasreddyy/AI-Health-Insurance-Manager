import { useEffect, useState } from 'react';
import PredictionForm from '../components/PredictionForm';
import client from '../api/client';
import { motion } from 'framer-motion';
import { History, Clock } from 'lucide-react';
import { format } from 'date-fns'; // You might need to add date-fns to package.json, or just use native Date

const Dashboard = () => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await client.get('/prediction/history');
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <PredictionForm onPredictionComplete={fetchHistory} />
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
              <h2 className="text-xl font-bold">Recent Checks</h2>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <Clock size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item._id}
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
                        ₹ {Math.round(item.predictedPrice)}
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
  );
};

export default Dashboard;