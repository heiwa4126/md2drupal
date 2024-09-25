import { readFileSync, writeFileSync } from "node:fs";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import drupalFixupPlugin from "./drupalfixup.js";

/**
 * Converts a Markdown file to HTML and writes the output to a file.
 * @param inputFilePath - The path to the input Markdown file.
 * @param outputFilePath - The path to the output HTML file.
 */
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

export default convertMarkdownToHTML;
