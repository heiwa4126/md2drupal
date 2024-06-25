import type { Element, Parent } from "hast";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

let n: Node;
let e: Element;

type MyNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, any>;
  children?: MyNode[];
  value?: string;
};

function processImageNode(node: MyNode): MyNode {
  const altText = node.properties?.alt || "";
  return {
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
          },
        ],
      },
    ],
  };
}

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
function processImageNode2(node: Element, index: number, parent: Parent | null) {
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

// hast -> hast plugin
function customPlugin2() {
  // note: Node -> Parent -> Element
  return (tree: Node) => {
    visit(tree, "element", (node: Element, index: number, parent: Parent | null) => {
      if (["h1", "h2", "h3", "h4"].includes(node.tagName) && node.children.length > 0) {
        // Add IDs to headings
        processHeaderNode(node);
      } else if (node.tagName === "table") {
        // Custom processing for <table> tags
        processTableNode(node, index, parent);
      } else if (node.tagName === "img") {
        processImageNode2(node, index, parent);
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

function customPlugin() {
  return (tree: MyNode) => {
    visit(tree, "element", (node: MyNode, index: number, parent: MyNode | null) => {
      if (["h1", "h2", "h3", "h4"].includes(node.tagName ?? "") && (node.children?.length || 0) > 0) {
        const textContent = node.children?.map((child) => child.value).join(" ") || "";
        const id = encodeURIComponent(textContent.toLowerCase().replace(/\s+/g, "-"));
        node.properties = { ...node.properties, id };
      }

      // Process images
      else if (node.tagName === "img") {
        const imgWrapper = processImageNode(node);
        if (parent?.children) {
          parent.children[index] = imgWrapper;
        }
      }

      // Custom processing for <table> tags
      else if (node.tagName === "table") {
        const tableWrapper: MyNode = {
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

      // if (node.tagName === "pre" && node.children && node.children[0].tagName === "code") {
      //   const codeNode = node.children[0];
      //   const language = codeNode.properties?.className[0].replace("language-", "");
      //   // Custom processing for code blocks
      //   codeNode.properties = {
      //     ...codeNode.properties,
      //     className: `language-${language}`,
      //   };
      // }
    });

    // Remove <p> wrapping <div class="img-grid--1">
    visit(tree, "element", (node: MyNode, index: number, parent: MyNode | null) => {
      if (node.tagName === "div" && node.properties?.className === "img-grid--1") {
        if (parent && parent.tagName === "p") {
          parent.tagName = "div";
          parent.properties = {};
        }
      }
    });
  };
}

async function convertMarkdownToHTML(inputFilePath: string, outputFilePath: string) {
  const mdContent = readFileSync(inputFilePath, "utf-8");

  const processor = unified()
    .use(remarkParse) // -> mdast
    .use(remarkGfm) // Add support for GitHub Flavored Markdown (including tables)
    .use(remarkRehype) // -> hast
    .use(customPlugin2)
    .use(rehypeStringify); // hast -> HTML

  const file = await processor.process(mdContent);
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<title>Converted HTML</title>
</head>
<body>
${String(file)}
</body>
</html>`;

  writeFileSync(outputFilePath, htmlContent);
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: md2drupal <input-markdown-file>");
  process.exit(1);
}

const inputFilePath = args[0];
const outputDir = path.dirname(inputFilePath);
const outputFilePath = path.join(outputDir, `${path.basename(inputFilePath, path.extname(inputFilePath))}.html`);

convertMarkdownToHTML(inputFilePath, outputFilePath)
  .then(() => {
    console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error during conversion:", error);
  });
