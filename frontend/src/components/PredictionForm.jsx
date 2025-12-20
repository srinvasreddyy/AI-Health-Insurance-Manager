import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PredictionForm = ({ onPredictionComplete }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [result,Qr] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      // Convert string inputs to numbers/booleans as required by backend Joi schema
      const payload = {
        Age: Number(data.Age),
        Diabetes: Number(data.Diabetes),
        BloodPressureProblems: Number(data.BloodPressureProblems),
        AnyTransplants: Number(data.AnyTransplants),
        AnyChronicDiseases: Number(data.AnyChronicDiseases),
        Height: Number(data.Height),
        Weight: Number(data.Weight),
        KnownAllergies: Number(data.KnownAllergies),
        HistoryOfCancerInFamily: Number(data.HistoryOfCancerInFamily),
        NumberOfMajorSurgeries: Number(data.NumberOfMajorSurgeries)
      };

      const response = await client.post('/prediction/predict', payload);
      setResult(response.data);
      if(onPredictionComplete) onPredictionComplete();
      toast.success('Prediction successful!');
    } catch (error) {
      console.error(error);
      toast.error('Prediction failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all bg-slate-50 focus:bg-white";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 bg-primary-600 text-white">
        <h2 className="text-2xl font-bold">New Assessment</h2>
        <p className="text-primary-100">Fill in the medical details below</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numeric Inputs */}
            {[
              { label: 'Age', name: 'Age', min: 0, max: 120 },
              { label: 'Height (cm)', name: 'Height', min: 50, max: 300 },
              { label: 'Weight (kg)', name: 'Weight', min: 10, max: 500 },
              { label: 'Major Surgeries', name: 'NumberOfMajorSurgeries', min: 0, max: 10 },
            ].map((field) => (
              <div key={field.name}>
                <label className={labelClasses}>{field.label}</label>
                <input
                  type="number"
                  step="any"
                  {...register(field.name, { required: true, min: field.min, max: field.max })}
                  className={inputClasses}
                  placeholder="0"
                />
                {errors[field.name] && <span className="text-red-500 text-xs">Required / Invalid</span>}
              </div>
            ))}
          </div>

            {/* Binary Selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Diabetes', name: 'Diabetes' },
              { label: 'Blood Pressure Problems', name: 'BloodPressureProblems' },
              { label: 'Organ Transplants', name: 'AnyTransplants' },
              { label: 'Chronic Diseases', name: 'AnyChronicDiseases' },
              { label: 'Known Allergies', name: 'KnownAllergies' },
              { label: 'Family Cancer History', name: 'HistoryOfCancerInFamily' },
            ].map((field) => (
              <div key={field.name}>
                <label className={labelClasses}>{field.label}</label>
                <select
                  {...register(field.name, { required: true })}
                  className={inputClasses}
                >
                  <option value="">Select...</option>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
                {errors[field.name] && <span className="text-red-500 text-xs">Required</span>}
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Calculate Premium</>}
          </motion.button>
        </form>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center"
            >
              <h3 className="text-slate-600 font-medium uppercase tracking-wide text-xs mb-2">Estimated Premium</h3>
              <p className="text-4xl font-extrabold text-green-700">
                ₹ {result.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 mt-2">Annual estimation based on provided data.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PredictionForm;