"use client";

import { useState } from "react";

interface FigmaImportProps {
  onImportSuccess: () => void;
}

const FigmaImport = ({ onImportSuccess }: FigmaImportProps) => {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/figma/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          figmaFileUrl: figmaUrl,
          fileName: fileName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Successfully imported ${data.figmaAnalysis.newCommentsAdded} new comments from "${data.figmaAnalysis.fileName}"`
        );
        setFigmaUrl("");
        setFileName("");
        
        // Process the comments with AI
        const processResponse = await fetch("/api/nlp/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const processData = await processResponse.json();
        
        if (processData.success) {
          setSuccess(prev => 
            `${prev}. AI processing complete: ${processData.processedCount} tasks generated.`
          );
        }

        // Refresh the dashboard data
        onImportSuccess();
      } else {
        setError(data.error || "Failed to import Figma file");
      }
    } catch (error) {
      setError("Failed to import Figma file. Please try again.");
      console.error("Import error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidFigmaUrl = (url: string) => {
    return url.includes('figma.com') && (url.includes('/file/') || url.includes('/design/'));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Import Figma File
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="figmaUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Figma File URL
          </label>
          <input
            type="url"
            id="figmaUrl"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            placeholder="https://www.figma.com/design/your-file-id/Your-File-Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          {figmaUrl && !isValidFigmaUrl(figmaUrl) && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid Figma file URL
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
            File Name (Optional)
          </label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Leave empty to use Figma file name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !figmaUrl || !isValidFigmaUrl(figmaUrl)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </span>
          ) : (
            "Import & Process Comments"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Supported formats:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>https://www.figma.com/file/[file-id]/[file-name]</li>
          <li>https://www.figma.com/design/[file-id]/[file-name]</li>
        </ul>
      </div>
    </div>
  );
};

export default FigmaImport;