import { readFileSync, writeFileSync } from "fs";
import path from "path";
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

async function convertMarkdownToHTML(inputFilePath: string, outputFilePath: string) {
  const mdContent = readFileSync(inputFilePath, "utf-8");

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm) // Add support for GitHub Flavored Markdown (including tables)
    .use(remarkRehype)
    .use(() => {
      return (tree: Node) => {
        visit(tree, "element", (node: Node, index: number, parent: Node | null) => {
          if (node.tagName === "img") {
            // Custom processing for <img> tags
            node.properties = {
              ...node.properties,
              className: "custom-img-class",
            };
          }

          if (node.tagName === "table") {
            // Custom processing for <table> tags
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
            if (parent && parent.children) {
              parent.children[index] = tableWrapper;
            }
          }

          if (node.tagName === "pre" && node.children && node.children[0].tagName === "code") {
            const codeNode = node.children[0];
            const language = codeNode.properties?.className[0].replace("language-", "");
            // Custom processing for code blocks
            codeNode.properties = {
              ...codeNode.properties,
              className: `language-${language}`,
            };
          }
        });
      };
    })
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
  console.error("Usage: foo <input-markdown-file>");
  process.exit(1);
}

const inputFilePath = args[0];
const outputDir = path.dirname(inputFilePath);
const outputFilePath = path.join(outputDir, path.basename(inputFilePath, path.extname(inputFilePath)) + ".html");

convertMarkdownToHTML(inputFilePath, outputFilePath)
  .then(() => {
    console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error during conversion:", error);
  });
