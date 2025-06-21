// Server component to handle 404 pages without event handlers
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col p-6">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">Page Not Found</h1>
        <p className="text-lg text-slate-300 mb-8">
          Sorry, the page you were looking for doesn't exist.
        </p>
        
        {/* Use Link component instead of Button with onClick */}
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
