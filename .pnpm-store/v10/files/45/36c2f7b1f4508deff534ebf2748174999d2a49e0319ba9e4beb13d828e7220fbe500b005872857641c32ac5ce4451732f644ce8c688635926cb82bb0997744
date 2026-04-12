import { CursorState } from '@slate-yjs/core';
import { BaseRange, BaseText, NodeEntry } from 'slate';
export declare const REMOTE_CURSOR_DECORATION_PREFIX = "remote-cursor-";
export declare const REMOTE_CURSOR_CARET_DECORATION_PREFIX = "remote-caret-";
export declare type RemoteCaretDecoration<TCursorData extends Record<string, unknown> = Record<string, unknown>> = {
    [key: `${typeof REMOTE_CURSOR_CARET_DECORATION_PREFIX}${string}`]: CursorState<TCursorData> & {
        isBackward: boolean;
    };
};
export declare type RemoteCursorDecoration<TCursorData extends Record<string, unknown> = Record<string, unknown>> = {
    [key: `${typeof REMOTE_CURSOR_DECORATION_PREFIX}${string}`]: CursorState<TCursorData>;
};
export declare type RemoteCursorDecoratedRange<TCursorData extends Record<string, unknown> = Record<string, unknown>> = BaseRange & RemoteCursorDecoration<TCursorData>;
export declare type RemoteCaretDecoratedRange<TCursorData extends Record<string, unknown> = Record<string, unknown>> = BaseRange & RemoteCaretDecoration<TCursorData>;
export declare type TextWithRemoteCursors<TCursorData extends Record<string, unknown> = Record<string, unknown>> = BaseText & RemoteCursorDecoration<TCursorData> & RemoteCaretDecoration<TCursorData>;
export declare function getRemoteCursorsOnLeaf<TCursorData extends Record<string, unknown>, TLeaf extends TextWithRemoteCursors<TCursorData>>(leaf: TLeaf): CursorState<TCursorData>[];
export declare function getRemoteCaretsOnLeaf<TCursorData extends Record<string, unknown>, TLeaf extends TextWithRemoteCursors<TCursorData>>(leaf: TLeaf): (CursorState<TCursorData> & {
    isBackward: boolean;
})[];
export declare type UseDecorateRemoteCursorsOptions = {
    carets?: boolean;
};
export declare function useDecorateRemoteCursors<TCursorData extends Record<string, unknown> = Record<string, unknown>>({ carets }?: UseDecorateRemoteCursorsOptions): (entry: NodeEntry<import("slate").Node>) => (RemoteCursorDecoratedRange<TCursorData> | RemoteCaretDecoratedRange<TCursorData>)[];
//# sourceMappingURL=useDecorateRemoteCursors.d.ts.map