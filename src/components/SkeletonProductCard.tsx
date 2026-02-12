// src/components/SkeletonProductCard.tsx
import React from "react";

export default function SkeletonProductCard() {
  return (
    <div className="card lift overflow-hidden">
      <div className="skeleton h-44 w-full rounded-xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/3 rounded-lg" />
        <div className="mt-3 flex gap-2">
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
