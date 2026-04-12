import { HeadingTwo } from './plugin/HeadingTwo';
import { HeadingOne } from './plugin/HeadingOne';
import { HeadingThree } from './plugin/HeadingThree';
import { HeadingOneElement, HeadingThreeElement, HeadingTwoElement } from './types';
import './styles.css';
declare module 'slate' {
    interface CustomTypes {
        Element: HeadingOneElement | HeadingTwoElement | HeadingThreeElement;
    }
}
declare const Headings: {
    HeadingOne: import("@yoopta/editor").YooptaPlugin<Record<"heading-one", HeadingOneElement>, Record<string, unknown>>;
    HeadingTwo: import("@yoopta/editor").YooptaPlugin<Record<"heading-two", HeadingTwoElement>, Record<string, unknown>>;
    HeadingThree: import("@yoopta/editor").YooptaPlugin<Record<"heading-three", HeadingThreeElement>, Record<string, unknown>>;
};
export { HeadingOneCommands, HeadingTwoCommands, HeadingThreeCommands } from './commands';
export default Headings;
export { HeadingOne, HeadingTwo, HeadingThree, HeadingOneElement, HeadingTwoElement, HeadingThreeElement };
//# sourceMappingURL=index.d.ts.map