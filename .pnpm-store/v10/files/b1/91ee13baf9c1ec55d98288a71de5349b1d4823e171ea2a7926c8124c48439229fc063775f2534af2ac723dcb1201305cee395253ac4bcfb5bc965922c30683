import { YooEditor, YooptaPathIndex } from '@yoopta/editor';
import { BulletedListElement, TodoListElement, NumberedListElement, TodoListElementProps } from '../types';
export type ListElementOptions = {
    text?: string;
};
export type ListInsertOptions = ListElementOptions & {
    at: YooptaPathIndex;
    focus?: boolean;
};
export type TodoListElementOptions = ListElementOptions & {
    props?: TodoListElementProps;
};
export type TodoListInsertOptions = TodoListElementOptions & {
    at: YooptaPathIndex;
    focus?: boolean;
};
export type BulletedListCommands = {
    buildBulletedListElements: (editor: YooEditor, options?: Partial<ListElementOptions>) => BulletedListElement;
    insertBulletedList: (editor: YooEditor, options?: Partial<ListInsertOptions>) => void;
    deleteBulletedList: (editor: YooEditor, blockId: string) => void;
};
export declare const BulletedListCommands: BulletedListCommands;
export type NumberedListCommands = {
    buildNumberedListElements: (editor: YooEditor, options?: Partial<ListElementOptions>) => NumberedListElement;
    insertNumberedList: (editor: YooEditor, options?: Partial<ListInsertOptions>) => void;
    deleteNumberedList: (editor: YooEditor, blockId: string) => void;
};
export declare const NumberedListCommands: NumberedListCommands;
export type TodoListCommands = {
    buildTodoListElements: (editor: YooEditor, options?: Partial<TodoListElementOptions>) => TodoListElement;
    insertTodoList: (editor: YooEditor, options?: Partial<TodoListInsertOptions>) => void;
    deleteTodoList: (editor: YooEditor, blockId: string) => void;
    updateTodoList: (editor: YooEditor, blockId: string, props: Partial<TodoListElementProps>) => void;
};
export declare const TodoListCommands: TodoListCommands;
//# sourceMappingURL=index.d.ts.map