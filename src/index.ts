import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type Node = {
  type: string;
  tagName?: string;
  properties?: Record<string, any>;
  children?: Node[];
  value?: string;
};

function processImageNode(node: Node): Node {
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

function customPlugin() {
  return (tree: Node) => {
    visit(tree, "element", (node: Node, index: number, parent: Node | null) => {
      // Add IDs to headings
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
        const tableWrapper: Node = {
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
    visit(tree, "element", (node: Node, index: number, parent: Node | null) => {
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
    .use(remarkParse)
    .use(remarkGfm) // Add support for GitHub Flavored Markdown (including tables)
    .use(remarkRehype)
    .use(customPlugin)
    .use(rehypeStringify);

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
