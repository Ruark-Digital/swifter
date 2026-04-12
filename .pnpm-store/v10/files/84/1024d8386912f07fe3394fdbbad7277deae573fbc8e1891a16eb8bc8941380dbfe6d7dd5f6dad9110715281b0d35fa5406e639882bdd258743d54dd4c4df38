import { YooEditor, YooptaPathIndex } from '@yoopta/editor';
import { ImageElement, ImageElementProps } from '../types';
type ImageElementOptions = {
    props?: Omit<ImageElementProps, 'nodeType'>;
};
type InsertImageOptions = ImageElementOptions & {
    at?: YooptaPathIndex;
    focus?: boolean;
};
export type ImageCommands = {
    buildImageElements: (editor: YooEditor, options?: Partial<ImageElementOptions>) => ImageElement;
    insertImage: (editor: YooEditor, options?: Partial<InsertImageOptions>) => void;
    deleteImage: (editor: YooEditor, blockId: string) => void;
    updateImage: (editor: YooEditor, blockId: string, props: Partial<ImageElementProps>) => void;
};
export declare const ImageCommands: ImageCommands;
export {};
//# sourceMappingURL=index.d.ts.map