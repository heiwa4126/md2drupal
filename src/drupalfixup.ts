import type { Element, Parent } from "hast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Processes a table node by wrapping it in a div element with a specific class name.
 * @param node - The table node to be processed.
 * @param index - The index of the table node in the parent's children array.
 * @param parent - The parent node of the table node.
 */
function processTableNode(node: Element, index: number, parent: Parent | null) {
  const tableWrapper: Element = {
    type: "element",
    tagName: "div",
    properties: { className: "table-layer" },
    children: [
      {
        ...node,
        properties: {
          ...node.properties,
          className: "table-headling-x",
        },
      },
    ],
  };
  if (parent?.children) {
    parent.children[index] = tableWrapper;
  }
}

/**
 * Processes an image node and wraps it with necessary elements for Drupal integration.
 * @param node - The image node to process.
 * @param index - The index of the node in the parent's children array.
 * @param parent - The parent node of the image node.
 */
function processImageNode(node: Element, index: number, parent: Parent | null) {
  const altText = node.properties?.alt || "";
  const imgWrapper: Element = {
    type: "element",
    tagName: "div",
    properties: { className: "img-grid--1" },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: "lb-gallery" },
        children: [
          {
            type: "element",
            tagName: "drupal-entity",
            properties: {
              alt: altText,
              title: altText,
              "data-entity-type": "media",
              "data-entity-uuid": "11111111-2222-3333-4444-555555555555",
              "data-embed-button": "media_browser",
              "data-entity-embed-display": "media_image",
              "data-entity-embed-display-settings": JSON.stringify({
                image_style: "crop_freeform",
                image_link: "",
                image_loading: { attribute: "lazy" },
                svg_render_as_image: true,
                svg_attributes: { width: "", height: "" },
              }),
            },
            children: [],
          },
        ],
      },
    ],
  };
  if (parent?.children) {
    parent.children[index] = imgWrapper;
  }
}

/**
 * Retrieves the text content from an HTML element.
 *
 * @param element - The HTML element to extract the text from.
 * @returns The text content of the element.
 */
function getTextFromElement(element: Element): string {
  let text = "";

  visit(element, "text", (node) => {
    text += node.value;
  });

  return text;
}

/**
 * Processes a header node by generating an ID based on its text content and updating the node properties.
 * @param node - The header node to process.
 */
function processHeaderNode(node: Element) {
  const textContent = getTextFromElement(node);
  const id = encodeURIComponent(textContent.toLowerCase().replace(/\s+/g, "-"));
  node.properties = { ...node.properties, id };
}

/**
 * Custom plugin for processing Markdown AST tree.
 * This plugin performs various operations on the tree, such as adding IDs to headings,
 * custom processing for table tags, and processing image nodes.
 *
 * @param tree - The Markdown AST tree to process.
 * @returns A function that performs the custom processing on the tree.
 */
function drupalFixupPlugin() {
  // note:
  //   hast -> hast plugin
  //   Element -> Parent -> Node
  return (tree: Node) => {
    visit(tree, "element", (node: Element, index: number, parent: Parent | null) => {
      if (["h1", "h2", "h3", "h4"].includes(node.tagName) && node.children.length > 0) {
        // Add IDs to headings
        processHeaderNode(node);
      } else if (node.tagName === "table") {
        // Custom processing for <table> tags
        processTableNode(node, index, parent);
      } else if (node.tagName === "img") {
        processImageNode(node, index, parent);
      }
    });

    // Remove <p> wrapping <div class="img-grid--1">
    visit(tree, "element", (node: Element, index: number, parent: Parent | null) => {
      if (node.tagName === "p" && node.children.length > 0 && node.children[0].type === "element") {
        const child = node.children[0] as Element;
        if (child.tagName === "div" && child.properties.className === "img-grid--1") {
          // node.tagName = "div";
          // node.properties = {};
          if (parent?.children) {
            parent.children[index] = child;
          }
        }
      }
    });
  };
}

export default drupalFixupPlugin;
