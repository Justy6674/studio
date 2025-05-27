export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            💧 Hydration Tracker
          </h1>
          <p className="text-slate-400 text-lg">
            Stay hydrated, stay healthy
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-2">
              Getting Started
            </h2>
            <p className="text-slate-300">
              Add your Firebase configuration in the Secrets tab to enable authentication and data storage.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Sign Up
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}