import { LISTS } from './plugin';
import { NumberedListElement, BulletedListElement, TodoListElement, TodoListElementProps } from './types';
import './styles.css';
declare module 'slate' {
    interface CustomTypes {
        Element: NumberedListElement | BulletedListElement | TodoListElement;
    }
}
export default LISTS;
declare const NumberedList: import("@yoopta/editor").YooptaPlugin<Pick<import("./types").ListElementMap, "numbered-list">, Record<string, unknown>>;
declare const BulletedList: import("@yoopta/editor").YooptaPlugin<Pick<import("./types").ListElementMap, "bulleted-list">, Record<string, unknown>>;
declare const TodoList: import("@yoopta/editor").YooptaPlugin<Pick<import("./types").ListElementMap, "todo-list">, Record<string, unknown>>;
export { TodoListCommands, BulletedListCommands, NumberedListCommands } from './commands';
export { NumberedListElement, BulletedListElement, TodoListElement, NumberedList, BulletedList, TodoList, TodoListElementProps, };
//# sourceMappingURL=index.d.ts.map