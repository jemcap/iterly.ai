
import Link from 'next/link';

export default function Home() {
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Iterly AI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Guided Iteration Tracker for Design Critiques
        </p>
        <p className="text-gray-700 mb-8">
          Transform chaotic design feedback into organized, prioritized tasks with intelligent NLP processing.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Dashboard
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>PoC Pipeline: Figma Comments → NLP Analysis → Task Board</p>
          </div>
        </div>
      </div>
    </div>;
}
