import React from 'react';

interface StandardPageCardProps {
  className?: string;
  children: React.ReactNode;
}

export default function StandardPageCard({ className = '', children }: StandardPageCardProps) {
  return (
    <div className={`standard-page-card ${className}`}> {children} </div>
  );
}

