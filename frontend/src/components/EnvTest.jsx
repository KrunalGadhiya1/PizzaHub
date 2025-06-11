import { useEffect } from 'react';

const EnvTest = () => {
  useEffect(() => {
    // Log all environment variables
    console.log('Environment Variables Test:', {
      all: import.meta.env,
      VITE_RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      BASE_URL: import.meta.env.BASE_URL
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h3 className="font-semibold mb-2">Environment Variables Status</h3>
      <div className="text-sm">
        <p>Mode: {import.meta.env.MODE}</p>
        <p>Razorpay Key: {import.meta.env.VITE_RAZORPAY_KEY_ID ? '✅ Present' : '❌ Missing'}</p>
        <p className="text-xs text-gray-500 mt-2">Check console for details</p>
      </div>
    </div>
  );
};

export default EnvTest; 