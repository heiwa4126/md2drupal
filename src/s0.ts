import fs from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

async function convertMarkdownToHtml(inputFilePath: string, outputFilePath: string) {
  const markdownContent = fs.readFileSync(inputFilePath, "utf-8");

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm) // GFMのサポートを追加
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdownContent);

  fs.writeFileSync(outputFilePath, String(file));
}

if (process.argv.length !== 3) {
  console.error("Usage: foo <input-file.md>");
  process.exit(1);
}

const inputFilePath = process.argv[2];
if (!fs.existsSync(inputFilePath)) {
  console.error(`File not found: ${inputFilePath}`);
  process.exit(1);
}

const outputFilePath = path.format({
  ...path.parse(inputFilePath),
  base: undefined,
  ext: ".html",
});

convertMarkdownToHtml(inputFilePath, outputFilePath)
  .then(() => console.log(`Converted ${inputFilePath} to ${outputFilePath}`))
  .catch((error) => {
    console.error(`Error converting ${inputFilePath} to HTML:`, error);
    process.exit(1);
  });
