"use client";

import { useState, useEffect } from "react";

interface DesignFile {
  id: string;
  name: string;
  figmaFileUrl: string;
  createdAt: string;
  feedbackCount: number;
}

interface ImportedFilesProps {
  refreshTrigger?: number;
}

const ImportedFiles = ({ refreshTrigger }: ImportedFilesProps) => {
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/design-files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else if (response.status === 401) {
        // User is not authenticated - this is expected, just return empty files
        setFiles([]);
      } else {
        console.error("Failed to fetch design files:", response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch design files:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  if (loading) return null;
  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-medium text-gray-900">
          Imported Files ({files.length})
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{file.name}</h4>
                <p className="text-sm text-gray-500">
                  {file.feedbackCount} comments • Imported{" "}
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <a
                href={file.figmaFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View in Figma
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportedFiles;