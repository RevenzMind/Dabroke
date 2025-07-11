import React, { useEffect, useRef } from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "error";
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  showPercentage = false,
  size = "md",
  variant = "primary",
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${normalizedProgress}%`;
    }
  }, [normalizedProgress]);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className={`progress-container ${className}`}>
      <div
        className={`progress-bar ${sizeClasses[size]} bg-gray-300 rounded-full overflow-hidden`}
      >
        <div
          ref={progressRef}
          className={`progress-fill ${variantClasses[variant]} transition-all duration-300 ease-out ${sizeClasses[size]} rounded-full`}
        />
      </div>
      {showPercentage && (
        <span className="progress-text text-sm text-gray-400 mt-1">
          {Math.round(normalizedProgress)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
