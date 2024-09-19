import React from "react";
import { Spinner, Text, useTheme, View } from "tamagui";
import Touchable from "./Touchable";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "tertiary" | "disabled";
  buttonStyle?: Record<string, unknown>;
  textStyle?: Record<string, unknown>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
};

const sizeStyles = {
  sm: { height: 24, fontSize: 14, paddingHorizontal: 8 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 12 },
  lg: { height: 44, fontSize: 16, paddingHorizontal: 16 },
  xl: { height: 52, fontSize: 18, paddingHorizontal: 20 },
};

const deriveStyle = (
  size: keyof typeof sizeStyles,
  color: keyof ReturnType<typeof useTheme>,
  theme: any
) => {
  let backgroundColor, textColor, borderWidth, borderColor;

  if (color === "primary") {
    backgroundColor = theme.primary.val;
    textColor = theme.buttonText.val;
  } else if (color === "secondary") {
    backgroundColor = theme.secondary.val;
    textColor = theme.buttonText.val;
  } else if (color === "tertiary") {
    backgroundColor = theme.bg.val;
    textColor = theme.text.val;
    borderWidth = 1;
    borderColor = theme.border.val;
  } else if (color === "disabled") {
    backgroundColor = theme.border.val;
    textColor = theme.text.val;
  }

  return {
    height: sizeStyles[size].height,
    fontSize: sizeStyles[size].fontSize,
    backgroundColor,
    textColor,
    paddingHorizontal: sizeStyles[size].paddingHorizontal,
    borderWidth,
    borderColor,
  };
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  size = "lg",
  color = "primary",
  buttonStyle,
  textStyle,
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
}) => {
  const theme = useTheme();
  const {
    height,
    fontSize,
    backgroundColor,
    textColor,
    paddingHorizontal,
    borderWidth,
    borderColor,
  } = deriveStyle(size, color, theme);
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{
        borderRadius: 8,
        height,
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal,
        borderWidth,
        borderColor,
        flexDirection: "row",
        ...buttonStyle,
      }}
    >
      {isLoading ? (
        <Spinner size="small" color={textColor} />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 6 }}>{leftIcon}</View>}
          <Text
            style={{
              color: textColor,
              fontSize,
              ...textStyle,
            }}
          >
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: 6 }}>{rightIcon}</View>}
        </>
      )}
    </Touchable>
  );
};

export default Button;
