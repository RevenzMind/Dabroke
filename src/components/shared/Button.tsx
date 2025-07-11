import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "error" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  const loadingClass = isLoading ? "btn-loading" : "";

  const classes = [baseClass, variantClass, sizeClass, loadingClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {leftIcon && !isLoading && (
        <span className="btn-icon-left">{leftIcon}</span>
      )}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
      {rightIcon && !isLoading && (
        <span className="btn-icon-right">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
