// DocxStyleAttribute — adds a `data-docx-style` global attribute to
// paragraph + heading nodes so docx-preview's Word-style class names
// (translated by fileUtils.tsx's translateWordStyleClasses → e.g.
// "BodyText", "Heading 1", "Article L2") survive TipTap's setContent.
//
// Phase 02 REQ-R-02/REQ-R-05: docx-preview emits class names like
// `docx_bodytext` on paragraphs. The translation layer rewrites these
// to `data-docx-style="BodyText"`. TipTap's default Paragraph/Heading
// nodes don't preserve arbitrary data-* attrs through setContent
// (their addAttributes is empty). This extension declares the attribute
// globally so it survives.
//
// CSS rules in collaboration.css (T5) target via
// `.ct-tiptap [data-docx-style="Heading 1"] { ... }` — gives every
// Word style a CSS-themable hook without per-style heading mappings.

import { Extension } from "@tiptap/core";

export const DocxStyleAttribute = Extension.create({
  name: "docxStyleAttribute",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          docxStyle: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute("data-docx-style") || null,
            renderHTML: (attributes) => {
              if (!attributes.docxStyle) return {};
              return { "data-docx-style": attributes.docxStyle };
            },
          },
        },
      },
    ];
  },
});
