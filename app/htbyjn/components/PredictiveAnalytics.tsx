"use client";
import { useState } from "react";

export default function PredictiveAnalytics() {
  const [alert, setAlert] = useState<string>("");
  function runPrediction() {
    // Demo: Replace with real ML logic
    setAlert("Alert: 2 students predicted to be defaulters by end of semester.");
  }
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Predictive Analytics</h2>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition-colors duration-200 mb-4"
        onClick={runPrediction}
        aria-label="Run Prediction"
      >
        Run Prediction
      </button>
      {alert && <div className="p-4 bg-yellow-100 text-yellow-700 rounded shadow mt-2">{alert}</div>}
      <p className="mt-4 text-gray-500">(Demo: Real analytics will use attendance history and academic calendar.)</p>
    </div>
  );
}
