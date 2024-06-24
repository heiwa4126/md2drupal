import fs from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Processor } from "unified";
import { stream } from "unified-stream";

async function processMarkdownFile(inputFilePath: string, outputFilePath: string) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify) as unknown as Processor<undefined, undefined, undefined, undefined, undefined>;

  const readStream = fs.createReadStream(inputFilePath);
  const writeStream = fs.createWriteStream(outputFilePath);

  readStream.pipe(stream(processor)).pipe(writeStream);

  readStream.on("error", (error) => {
    console.error("File read error:", error);
  });

  writeStream.on("error", (error) => {
    console.error("File write error:", error);
  });
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

processMarkdownFile(inputFilePath, outputFilePath)
  .then(() => console.log(`Converted ${inputFilePath} to ${outputFilePath}`))
  .catch((error) => {
    console.error(`Error converting ${inputFilePath} to HTML:`, error);
    process.exit(1);
  });
