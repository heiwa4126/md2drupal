import type { Heading, Root } from "mdast";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import { drupalFixupPlugin } from "./drupal_fixup.js";

/**
 * Extracts plain text from an mdast heading node by recursively collecting all text nodes.
 * @param node - The mdast heading node to extract text from.
 * @returns The concatenated text content.
 */
function getTextFromMdastNode(node: Heading): string {
	let text = "";
	visit(node, "text", (textNode) => {
		text += textNode.value;
	});
	return text;
}

/**
 * Extracts the text content of the first heading found in the mdast tree.
 * @param tree - The mdast root node.
 * @returns The text content of the first heading, or an empty string if none found.
 */
function extractFirstHeadingText(tree: Root): string {
	let headingText = "";
	visit(tree, "heading", (node: Heading) => {
		if (!headingText) {
			headingText = getTextFromMdastNode(node);
			return EXIT; // Stop after finding the first heading
		}
	});
	return headingText;
}

/**
 * Converts a Markdown file to HTML and writes the output to a file.
 * @param inputFilePath - The path to the input Markdown file.
 * @param outputFilePath - The path to the output HTML file.
 */
export async function convertMarkdownToHTML(inputFilePath: string, outputFilePath: string) {
	const mdContent = readFileSync(inputFilePath, "utf-8");

	// First pass: parse to mdast and extract title
	const mdastProcessor = unified().use(remarkParse).use(remarkGfm);
	const mdast = mdastProcessor.parse(mdContent) as Root;
	const title = extractFirstHeadingText(mdast) || "Converted HTML";

	// Second pass: full conversion pipeline
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
<title>${title}</title>
</head>
<body>
${String(file)}
</body>
</html>`;

	// Create output directory if it doesn't exist
	const outputDir = path.dirname(outputFilePath);
	mkdirSync(outputDir, { recursive: true });

	writeFileSync(outputFilePath, htmlContent);
}
