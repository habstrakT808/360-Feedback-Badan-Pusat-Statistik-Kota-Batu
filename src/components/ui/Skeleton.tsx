// src/components/ui/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animated?: boolean;
}

export function Skeleton({ 
  className, 
  width, 
  height, 
  rounded = 'md',
  animated = true 
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        roundedClasses[rounded],
        animated && 'animate-pulse',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Predefined skeleton components
export function SkeletonText({ 
  lines = 1, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="1rem" 
          width={i === lines - 1 ? '75%' : '100%'} 
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <Skeleton 
      className={cn(sizeClasses[size], 'rounded-full', className)} 
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <SkeletonAvatar size="md" />
        <div className="space-y-2 flex-1">
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={`header-${i}`} 
            height="1.5rem" 
            width={i === 0 ? '20%' : '15%'} 
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              height="1rem" 
              width={colIndex === 0 ? '20%' : '15%'} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ 
  items = 4,
  className 
}: { 
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 space-y-3">
          <Skeleton height="2rem" width="100%" />
          <Skeleton height="1rem" width="60%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ 
  fields = 4,
  className 
}: { 
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="1.25rem" width="30%" />
          <Skeleton height="2.5rem" width="100%" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="6rem" />
      </div>
    </div>
  );
}
