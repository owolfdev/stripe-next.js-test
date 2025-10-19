"use client";

import { useState } from "react";

export default function FixMappingPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fixMapping = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fix-user-mapping", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to fix mapping" });
    }
    setLoading(false);
  };

  const forceFixMapping = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/force-fix-mapping", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to force fix mapping" });
    }
    setLoading(false);
  };

  const debugMapping = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-user-mapping");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to debug mapping" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Fix User-Stripe Mapping
          </h1>
          <p className="text-gray-600 mb-6">
            This page helps fix the mapping between your Supabase user and
            Stripe customer.
          </p>

          <div className="space-y-4">
            <button
              onClick={debugMapping}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? "Loading..." : "Debug Current Mapping"}
            </button>

            <button
              onClick={fixMapping}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors ml-4"
            >
              {loading ? "Fixing..." : "Fix Mapping"}
            </button>

            <button
              onClick={forceFixMapping}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors ml-4"
            >
              {loading ? "Force Fixing..." : "Force Fix Mapping"}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
