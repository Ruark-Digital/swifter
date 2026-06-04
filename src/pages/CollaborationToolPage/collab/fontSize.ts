// Minimal FontSize extension for TipTap v3 — extends TextStyle with a
// `fontSize` attribute. The official @tiptap/extension-font-size package
// only has an experimental v3.0.0-next release, so we ship our own
// small implementation following the TextStyle pattern (same as
// @tiptap/extension-font-family which IS stable in v3.23.4).
//
// Required by Phase 02 REQ-R-03: docx-preview emits inline font specs
// as <span style="font-family: X; font-size: Yp">text</span>. This
// extension's parseHTML rule picks up the font-size from such spans
// during setContent and stores it as a TextStyle mark attribute. CSS
// inline-style render via renderHTML preserves it back to DOM.

import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});
