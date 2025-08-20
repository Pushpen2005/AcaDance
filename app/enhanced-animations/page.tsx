'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with animations
const EnhancedAnimationsDemo = dynamic(
  () => import('../../components/EnhancedAnimationsDemo'),
  { ssr: false }
);

export default function AdvancedAnimationsPage() {
  return (
    <div className="min-h-screen">
      <EnhancedAnimationsDemo />
    </div>
  );
}
