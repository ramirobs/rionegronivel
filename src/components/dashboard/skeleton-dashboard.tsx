'use client';

import React from 'react';

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Abas Skeleton */}
      <div className="hidden md:flex items-center gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-200 rounded-xl" />
        ))}
      </div>

      {/* Hero Card + Gauge Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-4 w-40 bg-slate-200 rounded-md" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-100 rounded-md" />
            <div className="h-16 w-48 bg-slate-200 rounded-2xl" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <div className="h-8 w-36 bg-slate-200 rounded-xl" />
            <div className="h-8 w-28 bg-slate-100 rounded-xl" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center space-y-3">
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
          <div className="h-28 w-44 bg-slate-100 rounded-t-full" />
          <div className="h-6 w-24 bg-slate-200 rounded-full" />
        </div>
      </div>

      {/* Friendly Summary Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-6 w-56 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-48 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="h-4 w-28 bg-slate-200 rounded-md" />
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
