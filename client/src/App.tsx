import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">AayuCare Platform</h1>
        <p className="text-slate-400 text-sm">
          Backend API Development in progress. UI will be rebuilt after backend completion.
        </p>
      </div>
    </div>
  );
};
