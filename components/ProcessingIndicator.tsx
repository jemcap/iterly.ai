"use client";

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  progress?: {
    current: number;
    total: number;
    message: string;
  } | null;
}

const ProcessingIndicator = ({ isProcessing, progress }: ProcessingIndicatorProps) => {
  if (!isProcessing && !progress) return null;

  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">
          AI Processing Comments
        </h3>
        {progress && (
          <span className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            {progress.current}/{progress.total}
          </span>
        )}
      </div>

      {progress && (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>{progress.message}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center text-sm text-blue-600">
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {progress ? 'Processing comments and generating tasks...' : 'Preparing to process...'}
      </div>
    </div>
  );
};

export default ProcessingIndicator;