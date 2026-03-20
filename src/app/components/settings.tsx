import { useNavigate } from "react-router";
import { ArrowLeft, Download, MessageSquare, Info } from "lucide-react";

export function Settings() {
  const navigate = useNavigate();

  const handleExport = () => {
    // Mock export functionality
    alert("Export feature would download your data as CSV or JSON");
  };

  const handleFeedback = () => {
    // Mock feedback functionality
    alert("Feedback form would open here");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-xl text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* App Info */}
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">🐕</span>
          </div>
          <h2 className="text-lg text-gray-900 mb-1">TapTrack</h2>
          <p className="text-sm text-gray-500">Version 1.0.0</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Export My Data</div>
              <div className="text-sm text-gray-500">
                Download your transactions as CSV
              </div>
            </div>
          </button>

          <button
            onClick={handleFeedback}
            className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Send Feedback</div>
              <div className="text-sm text-gray-500">
                Help us improve TapTrack
              </div>
            </div>
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">
                Back Tap Not Working?
              </p>
              <p className="mb-2">
                Make sure you've enabled Back Tap in your iPhone settings:
              </p>
              <p className="text-xs text-gray-600">
                Settings → Accessibility → Touch → Back Tap → Double Tap → TapTrack
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500">
            All your data is stored locally on your device.
            <br />
            We respect your privacy and never share your information.
          </p>
        </div>
      </div>
    </div>
  );
}
