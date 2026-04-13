import { SlateEditor, YooEditor } from '@yoopta/editor';
import { Location } from 'slate';
import { LinkElement, LinkElementProps } from '../types';
type LinkElementOptions = {
    props: Omit<LinkElementProps, 'nodeType'>;
};
type LinkInsertOptions = LinkElementOptions & {
    selection?: Location | undefined;
    slate: SlateEditor;
};
type DeleteElementOptions = {
    slate: SlateEditor;
};
export type LinkCommands = {
    buildLinkElements: (editor: YooEditor, options: LinkElementOptions) => LinkElement;
    insertLink: (editor: YooEditor, options: LinkInsertOptions) => void;
    deleteLink: (editor: YooEditor, options: DeleteElementOptions) => void;
};
export declare const LinkCommands: LinkCommands;
export {};
//# sourceMappingURL=index.d.ts.map