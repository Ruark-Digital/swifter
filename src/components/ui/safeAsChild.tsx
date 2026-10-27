import * as React from "react";

export const getSafeAsChild = (children: React.ReactNode) => {
  const childArray = React.Children.toArray(children);

  if (childArray.length === 1 && React.isValidElement(childArray[0])) {
    return childArray[0];
  }

  return <span>{children}</span>;
};
