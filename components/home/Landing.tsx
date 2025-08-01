import React from "react";
import Link from "next/link";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Hero Section */}
      <div className="align-elements mx-auto  px-6 py-24">
        <div className="text-center mb-20 w-full">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Turn Design Chaos
            <br />
            into Development Clarity
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Our online AI-powered tool that automatically converts design
            feedback into organised development tasks,
            <span className="text-gray-900 font-semibold">
              {" "}
              streamlining your design-to-development workflow
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Live Demo
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Social Proof */}
          <div className="bg-gray-50 rounded-lg p-6 max-w-3xl mx-auto border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              <span className="inline-flex items-center">
                <strong>Live Demo Available</strong>
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Experience the full power of Iterly AI with our interactive demo.
              Import Figma files, process feedback with AI, and see real-time
              task generation.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Figma Integration
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Seamlessly import Figma files and comments. Our AI understands
              design context and feedback automatically.
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              AI-Powered Processing
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Advanced NLP converts vague feedback into specific, actionable
              development tasks with priorities and estimates.
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Smart Task Management
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Organised dashboard with drag & drop task tracking, priorities,
              and progress management for your entire team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
