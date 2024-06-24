import type { Root, Text, VFile } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// プラグインの型定義
const uppercaseText: Plugin = () => {
  return (tree: Root, file: VFile) => {
    visit(tree, "text", (node: Text) => {
      node.value = node.value.toUpperCase();
    });
  };
};

export default uppercaseText;
