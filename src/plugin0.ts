// https://zenn.dev/januswel/articles/745787422d425b01e0c1

import type { Paragraph } from "mdast";
import type { Plugin } from "unified";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import type { VFileCompatible } from "vfile";

function isMessage(node: unknown): node is Paragraph {
  // if (!isParagraph(node)) {
  //   return false;
  // }

  // const { children } = node;

  // const firstChild = children[0];
  // if (!(isText(firstChild) && firstChild.value.startsWith(MESSAGE_BEGGINING))) {
  //   return false;
  // }

  // const lastChild = children[children.length - 1];
  // if (!(isText(lastChild) && lastChild.value.endsWith(MESSAGE_ENDING))) {
  //   return false;
  // }

  return true;
}

function visitor(node: Paragraph, index: number, parent: Parent | undefined) {
  // ここに変換処理を書く
}

const plugin: Plugin = () => {
  return (tree: Node, _file: VFileCompatible) => {
    visit(tree, isMessage, visitor);
  };
};
