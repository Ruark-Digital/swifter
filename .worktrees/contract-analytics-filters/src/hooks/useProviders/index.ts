import { useMemo,  ComponentProps } from "react";
import { CustomComponentType, Providers } from "./type";
import { createElement } from "react";

// type RenderElementType = {
//   type: Providers["types"];
//   props: Providers["props"];
//   ref?: LegacyRef<Providers["types"]> | null;
//   key: string | null;
// };

const renderChildren = (
  child?: Providers
): React.ReactElement | React.ReactElement[] =>{
  console.log(child?.children)
  return child?.children?.length
    ? createElement(child.types, child?.props)
    : createElement(
        child?.types ?? "",
        child?.props,
        child?.children?.map((item) => renderChildren?.(item))
      );
  }

type GetProvider<T extends CustomComponentType<any>> = {
  provider: T;
  props?: ComponentProps<T>;
  children?: Providers[];
};

export const getProvider = <T extends CustomComponentType<any>>({  
  provider,
  props,
  children,
}: GetProvider<T>): Providers => {
  return {
    types: provider,
    props: props,
    children: children ?? [],
  };
};

/**
 * The useEntryPoint function is a custom hook that takes in an object props of type EntryPoint and returns an element based on the provided props.
 * @param props
 * @returns - entryPoint (type: React.ReactElement): The created entry point element.
 *
 * @example
 *   Example Usage:
 * ```
 * const MyComponent = () => {
 *   const entryPointProps = {
 *    types: "div",
 *    props: { className: "my-class" },
 *     children: []
 *    };
 *
 *  const entryPoint = useEntryPoint(entryPointProps);
 *
 *   return entryPoint;
 * };
 * ``
 */
export const useProviders = (props: Providers) => {
  const entryPoint = useMemo(() => {
    const children = props?.children?.map?.(renderChildren) ?? [];

    console.log({ props })

    return !props?.children?.length
      ? createElement(props.types, props.props)
      : createElement(props.types, props.props, ...children);
  }, [props]);

  console.log(entryPoint); //TODO: remove this line in production

  return entryPoint;
};
