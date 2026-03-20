import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (step === 0) {
      setStep(1);
    } else {
      navigate("/app");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {step === 0 ? (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">🐕</span>
            </div>
            <h1 className="text-3xl mb-3 text-gray-900">Welcome to TapTrack</h1>
            <p className="text-gray-500">
              Log expenses in under 3 seconds with just a tap on the back of your phone
            </p>
          </div>

          <div className="space-y-4 mb-12">
            <div className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-medium text-gray-900 mb-1">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                Enter expenses in 3 taps or less
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-medium text-gray-900 mb-1">Smart Predictions</h3>
              <p className="text-sm text-gray-600">
                Categories auto-filled based on time and location
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="text-4xl mb-3">💚</div>
              <h3 className="font-medium text-gray-900 mb-1">No Judgment</h3>
              <p className="text-sm text-gray-600">
                Track spending without anxiety or guilt
              </p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="step2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <h2 className="text-2xl mb-3 text-gray-900">Set Up Back Tap</h2>
          <p className="text-gray-500 mb-8">
            Enable quick access by mapping your iPhone's Back Tap feature
          </p>

          <div className="bg-gray-50 rounded-3xl p-8 mb-8">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-96 mx-auto bg-gray-900 rounded-[3rem] relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-950 rounded-full"></div>
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-50"></div>
                    <div className="relative text-6xl">👆</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            <p className="text-sm text-gray-600 mt-6">
              Double-tap the back of your phone to open TapTrack
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-left">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Setup Steps:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Open Settings</li>
              <li>Go to Accessibility</li>
              <li>Tap Touch</li>
              <li>Tap Back Tap</li>
              <li>Select Double Tap</li>
              <li>Choose TapTrack</li>
            </ol>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-medium hover:bg-emerald-600 transition-colors"
          >
            Continue to App
          </button>
        </motion.div>
      )}
    </div>
  );
}
