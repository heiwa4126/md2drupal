import minimist from "minimist";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import drupalFixupPlugin from "./drupalfixup.js";

async function convertMarkdownToHTML(inputFilePath: string, outputFilePath: string) {
  const mdContent = readFileSync(inputFilePath, "utf-8");

  const processor = unified()
    .use(remarkParse) // -> mdast
    .use(remarkGfm) // Add support for GitHub Flavored Markdown (including tables)
    .use(remarkRehype) // -> hast
    .use(drupalFixupPlugin)
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

const args = minimist(process.argv.slice(2));
const inputFilePath = args._[0];

if (!inputFilePath) {
  console.error("Usage: md2drupal <input-markdown-file>");
  process.exit(1);
}

const outputDir = path.dirname(inputFilePath);
const outputFilePath = path.join(outputDir, `${path.basename(inputFilePath, path.extname(inputFilePath))}.html`);

convertMarkdownToHTML(inputFilePath, outputFilePath)
  .then(() => {
    console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error during conversion:", error);
  });
