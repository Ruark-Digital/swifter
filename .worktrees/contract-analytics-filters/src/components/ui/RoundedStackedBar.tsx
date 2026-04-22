import React from 'react';
import { RectangleProps } from 'recharts';

interface RoundedStackedBarProps extends RectangleProps {
  isTopSegment?: boolean;
  isBottomSegment?: boolean;
  cornerRadius?: number;
}

export const RoundedStackedBar: React.FC<RoundedStackedBarProps> = ({
  isTopSegment = false,
  isBottomSegment = false,
  cornerRadius = 8,
  ...props
}) => {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props;

  // Convert to numbers to ensure proper calculations
  const xNum = Number(x);
  const yNum = Number(y);
  const widthNum = Number(width);
  const heightNum = Number(height);

  if (widthNum <= 0 || heightNum <= 0) {
    return null;
  }

  // Create the path for the rounded rectangle
  const createRoundedPath = () => {
    const radius = Math.min(cornerRadius, widthNum / 2, heightNum / 2);
    
    if (isBottomSegment) {
      // Bottom segment: flat base, rounded top
      return `
        M ${xNum} ${yNum + heightNum}
        L ${xNum} ${yNum + radius}
        Q ${xNum} ${yNum} ${xNum + radius} ${yNum}
        L ${xNum + widthNum - radius} ${yNum}
        Q ${xNum + widthNum} ${yNum} ${xNum + widthNum} ${yNum + radius}
        L ${xNum + widthNum} ${yNum + heightNum}
        Z
      `;
    } else if (isTopSegment) {
      // Top segment: rounded top, rounded inward bottom
      return `
        M ${xNum} ${yNum + heightNum - radius}
        Q ${xNum} ${yNum + heightNum} ${xNum + radius} ${yNum + heightNum}
        L ${xNum + widthNum - radius} ${yNum + heightNum}
        Q ${xNum + widthNum} ${yNum + heightNum} ${xNum + widthNum} ${yNum + heightNum - radius}
        L ${xNum + widthNum} ${yNum + radius}
        Q ${xNum + widthNum} ${yNum} ${xNum + widthNum - radius} ${yNum}
        L ${xNum + radius} ${yNum}
        Q ${xNum} ${yNum} ${xNum} ${yNum + radius}
        Z
      `;
    } else {
      // Middle segment: rounded inward top and bottom
      return `
        M ${xNum} ${yNum + radius}
        Q ${xNum} ${yNum} ${xNum + radius} ${yNum}
        L ${xNum + widthNum - radius} ${yNum}
        Q ${xNum + widthNum} ${yNum} ${xNum + widthNum} ${yNum + radius}
        L ${xNum + widthNum} ${yNum + heightNum - radius}
        Q ${xNum + widthNum} ${yNum + heightNum} ${xNum + widthNum - radius} ${yNum + heightNum}
        L ${xNum + radius} ${yNum + heightNum}
        Q ${xNum} ${yNum + heightNum} ${xNum} ${yNum + heightNum - radius}
        Z
      `;
    }
  };

  return (
    <g>
      <path
        d={createRoundedPath()}
        fill={fill}
        className="transition-all duration-200 hover:opacity-80"
      />
    </g>
  );
};

// Helper function to determine segment position in stack
export const getSegmentPosition = (
  dataKeys: string[],
  currentKey: string,
  data: any[],
  dataIndex: number
): { isTop: boolean; isBottom: boolean } => {
  const item = data[dataIndex];
  if (!item) return { isTop: false, isBottom: false };

  // Find segments with non-zero values for this data point
  const activeSegments = dataKeys.filter(key => (item[key] || 0) > 0);
  
  if (activeSegments.length === 0) {
    return { isTop: false, isBottom: false };
  }

  const currentIndex = activeSegments.indexOf(currentKey);
  
  return {
    isTop: currentIndex === activeSegments.length - 1, // Last active segment is top
    isBottom: currentIndex === 0 // First active segment is bottom
  };
};