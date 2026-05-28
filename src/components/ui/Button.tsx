import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'start',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      tertiary: 'btn-tertiary',
      destructive: 'btn-destructive',
    }[variant];

    const sizeClass = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    }[size];

    const iconSize = {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : Icon && iconPosition === 'start' ? (
          <Icon size={iconSize} />
        ) : null}
        {children}
        {!loading && Icon && iconPosition === 'end' ? <Icon size={iconSize} /> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
