import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const baseClass = "animate-pulse bg-gray-200 dark:bg-gray-800";
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full",
    card: "rounded-2xl h-32 w-full",
    avatar: "rounded-2xl h-12 w-12",
  };

  return <div className={`${baseClass} ${variants[variant]} ${className}`} />;
};

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4 w-full">
    <div className="flex gap-4 mb-6">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-32" />
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b dark:border-gray-800">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2 opacity-50" />
        </div>
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-10" />
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <Skeleton key={i} variant="card" className="h-40" />
    ))}
  </div>
);

export default Skeleton;
