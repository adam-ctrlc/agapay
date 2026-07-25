import { Pressable, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-xl active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
        success: "bg-success",
        destructive: "bg-destructive",
        outline: "border border-border bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-10 px-4",
        lg: "h-14 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-base font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      accent: "text-accent-foreground",
      success: "text-success-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      ghost: "text-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label: string;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  label,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        loading && "opacity-60",
        // Disabled reads as its own flat state, not a faded copy of the button.
        disabled && !loading && "border border-border bg-muted",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      <Text
        className={cn(
          buttonTextVariants({ variant }),
          disabled && !loading && "text-muted-foreground",
        )}
      >
        {loading ? "Please wait…" : label}
      </Text>
    </Pressable>
  );
}
