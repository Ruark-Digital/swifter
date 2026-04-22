import { ComponentProps, ComponentType } from "react";

export type CustomComponentType<T = unknown> = ComponentType<T>;

 
export type Providers = {
  types: CustomComponentType<any>;
  props: ComponentProps<CustomComponentType<any>> | null | undefined;
  children?: Providers[];
};
