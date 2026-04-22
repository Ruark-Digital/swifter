import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Descendant } from "slate";
import {
  buildBlockData,
  generateId,
  type YooptaContentValue,
  type SlateElement,
} from "@yoopta/editor";

type MdNode = {
  type: string;
  depth?: number;
  children?: MdNode[];
  value?: string;
};

const textNode = (text: string): Descendant => ({ text });

const buildElement = (type: string, children: Descendant[], props?: any): SlateElement => {
  return {
    id: generateId(),
    type,
    children,
    props,
  };
};

function flattenText(node: MdNode): string {
  if (node.type === "text" && typeof node.value === "string") return node.value;
  if (!node.children || node.children.length === 0) return "";
  return node.children.map(flattenText).join("");
}

export async function markdownToYoopta(markdown: string): Promise<YooptaContentValue> {
  const ast = unified().use(remarkParse).parse(markdown) as MdNode;
  const blocks: YooptaContentValue = {};
  let order = 0;

  const pushBlock = (el: SlateElement) => {
    const id = el.id;
    blocks[id] = buildBlockData({
      id,
      type: el.type,
      value: [el],
      meta: { order: order++, depth: 0 },
    });
  };

  const visit = (nodes: MdNode[]) => {
    for (const node of nodes) {
      switch (node.type) {
        case "heading": {
          const depth = Math.min(Math.max(node.depth || 1, 1), 3);
          const type = depth === 1 ? "heading-one" : depth === 2 ? "heading-two" : "heading-three";
          const txt = flattenText(node).trim();
          if (txt) pushBlock(buildElement(type, [textNode(txt)]));
          break;
        }
        case "paragraph": {
          const txt = flattenText(node).trim();
          if (txt) pushBlock(buildElement("paragraph", [textNode(txt)]));
          break;
        }
        case "list": {
          const ordered = (node as any).ordered === true;
          const type = ordered ? "numbered-list" : "bulleted-list";
          const items = (node.children || []).filter((c) => c.type === "listItem");
          const lines: Descendant[] = [];
          for (const item of items) {
            const content = (item.children || []).map(flattenText).join("").trim();
            if (content) lines.push(textNode(content));
          }
          if (lines.length) pushBlock(buildElement(type, lines));
          break;
        }
        case "blockquote": {
          const txt = flattenText(node).trim();
          if (txt) pushBlock(buildElement("blockquote", [textNode(txt)]));
          break;
        }
        case "code": {
          const lang = (node as any).lang;
          const value = (node as any).value || "";
          pushBlock(buildElement("code", [textNode(value)], lang ? { language: lang } : undefined));
          break;
        }
        case "thematicBreak": {
          pushBlock(buildElement("divider", [textNode("")]),);
          break;
        }
        default: {
          // ignore other node types or recurse into children
          if (node.children && node.children.length) visit(node.children);
          break;
        }
      }
    }
  };

  visit(ast.children || []);
  return blocks;
}

