import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { classifyTransaction } from "../collab/pagination/classifyTransaction";

// Minimal schema mimicking the subset of StarterKit nodes that
// classifyTransaction's heuristics check. Avoids pulling the full
// TipTap StarterKit + collab providers into a unit test.
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "text*",
      group: "block",
      toDOM: () => ["p", 0] as const,
      parseDOM: [{ tag: "p" }],
    },
    horizontalRule: {
      group: "block",
      toDOM: () => ["hr"] as const,
      parseDOM: [{ tag: "hr" }],
    },
    text: { group: "inline" },
  },
});

const docOf = (text: string) =>
  schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);

const stateOf = (text: string) =>
  EditorState.create({ schema, doc: docOf(text) });

describe("classifyTransaction", () => {
  it("returns 'noop' when doc is unchanged", () => {
    const state = stateOf("hello");
    const tr = state.tr; // empty transaction
    expect(classifyTransaction(tr)).toBe("noop");
  });

  it("returns 'text' for single-character insert", () => {
    const state = stateOf("hello");
    const tr = state.tr.insertText("x", 2, 2); // insert 'x' inside paragraph
    expect(classifyTransaction(tr)).toBe("text");
  });

  it("returns 'text' for single-character delete", () => {
    const state = stateOf("hello");
    const tr = state.tr.delete(2, 3); // delete one char
    expect(classifyTransaction(tr)).toBe("text");
  });

  it("returns 'structural' for multi-character range delete", () => {
    const state = stateOf("hello world");
    const tr = state.tr.delete(2, 7); // delete 'hello' (5 chars > 1)
    expect(classifyTransaction(tr)).toBe("structural");
  });

  it("returns 'structural' for paste of multiple paragraphs", () => {
    const state = stateOf("hello");
    const paraA = schema.node("paragraph", null, [schema.text("para1")]);
    const paraB = schema.node("paragraph", null, [schema.text("para2")]);
    const tr = state.tr.replaceWith(
      0,
      state.doc.content.size,
      [paraA, paraB]
    );
    expect(classifyTransaction(tr)).toBe("structural");
  });

  it("returns 'structural' for horizontal-rule insert", () => {
    const state = stateOf("hello");
    const hr = schema.nodes.horizontalRule.create();
    const tr = state.tr.insert(state.doc.content.size, hr);
    expect(classifyTransaction(tr)).toBe("structural");
  });
});
