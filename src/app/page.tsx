'use client';

import { TimelineContainer } from '@/components/TimelineContainer';
import { TimelineControls } from '@/components/TimelineControls';
import { GlobalProgress } from '@/components/GlobalProgress';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">时间线</h1>
        <TimelineControls />
        <TimelineContainer />
        <GlobalProgress />
      </div>
    </main>
  );
}
