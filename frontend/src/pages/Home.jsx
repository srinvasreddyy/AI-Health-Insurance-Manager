import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">Health Insurance</span> Predictions
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            Get instant, accurate insurance premium estimates using our advanced Machine Learning algorithms. Analyze risk factors and plan your future securely.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/dashboard" className="px-8 py-4 bg-primary-600 text-white rounded-full font-semibold shadow-xl shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 transition-all">
              Predict Now
            </Link>
            <a href="#features" className="px-8 py-4 bg-white text-slate-700 rounded-full font-semibold shadow-lg hover:bg-slate-50 transition-all">
              Learn More
            </a>
          </div>
        </motion.div>

        <div id="features" className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: <Zap size={32} />, title: "Instant Analysis", desc: "Real-time processing using optimized Python ML models." },
            { icon: <ShieldCheck size={32} />, title: "High Accuracy", desc: "Trained on thousands of medical records for precise estimations." },
            { icon: <TrendingUp size={32} />, title: "Cost Tracking", desc: "Monitor your history and see how health changes affect premiums." },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="p-8 bg-white rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;