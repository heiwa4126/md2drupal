import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

async function convertMarkdownToHTML(inputFilePath: string, outputFilePath: string) {
  const mdContent = readFileSync(inputFilePath, "utf-8");

  const mdxOptions = {
    rehypePlugins: [
      () => {
        return (tree: any) => {
          visit(tree, "element", (node: any, index: number, parent: any) => {
            if (node.tagName === "img") {
              // Custom processing for <img> tags
              node.properties = {
                ...node.properties,
                className: "custom-img-class",
              };
            }

            if (node.tagName === "table") {
              // Custom processing for <table> tags
              const tableWrapper = {
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
              parent.children[index] = tableWrapper;
            }

            if (node.tagName === "pre" && node.children[0].tagName === "code") {
              const codeNode = node.children[0];
              const language = codeNode.properties.className[0].replace("language-", "");
              // Custom processing for code blocks
              codeNode.properties = {
                ...codeNode.properties,
                className: `language-${language} custom-code-class`,
              };
            }
          });
        };
      },
    ],
  };

  const vfile = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(mdxOptions.rehypePlugins[0])
    .use(rehypeStringify)
    .process(mdContent);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Converted HTML</title>
</head>
<body>
  ${String(vfile)}
</body>
</html>`;

  writeFileSync(outputFilePath, htmlContent);
}

function visit(
  node: any,
  tagName: string,
  callback: (node: any, index: number, parent: any) => void,
  index: number = 0,
  parent: any = null
) {
  if (node.tagName === tagName) {
    callback(node, index, parent);
  }
  if (node.children) {
    node.children.forEach((child: any, idx: number) => visit(child, tagName, callback, idx, node));
  }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: foo <input-markdown-file>");
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
