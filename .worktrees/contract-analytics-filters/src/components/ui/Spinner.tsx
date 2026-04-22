import React, { CSSProperties, ComponentType } from "react";
import classNames from "clsx";
import { CgSpinner } from "react-icons/cg";

type SpinnerProps = {
  className?: string;
  color?: string;
  indicator?: ComponentType;
  isSpinning?: boolean;
  size?: number;
  style?: CSSProperties;
};

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>((props, ref) => {
  const {
    className,
    color,
    indicator,
    isSpinning = true,
    size = 20,
    style,
    ...rest
  } = props;

  const spinnerColor = color;
  const Component = indicator ? indicator : CgSpinner;

  const spinnerStyle = {
    height: size,
    width: size,
    ...style,
  };

  const spinnerClass = classNames(
    isSpinning && "animate-spin",
    spinnerColor && `text-${spinnerColor}`,
    className
  );

  return (
    <div ref={ref} style={spinnerStyle} className={spinnerClass}>
      <Component {...rest} />
    </div>
  );
});

Spinner.displayName = "Spinner";

export default Spinner;
