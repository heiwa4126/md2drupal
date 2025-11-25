#!/usr/bin/env node

import path from "node:path";
import { parseArgs } from "node:util";
import convertMarkdownToHTML from "./converter1.js";

type Args = {
	inputFilePath: string;
	outputFilePath: string;
};

function parseCommandline(): Args {
	const { positionals } = parseArgs({
		allowPositionals: true,
		options: {},
	});

	const inputFilePath = positionals[0];

	if (!inputFilePath) {
		console.error("Usage: md2drupal <input-markdown-file>");
		process.exit(1);
	}

	const outputDir = path.dirname(inputFilePath);
	const outputFilePath = path.join(
		outputDir,
		`${path.basename(inputFilePath, path.extname(inputFilePath))}.html`,
	);
	return { inputFilePath, outputFilePath };
}

const args = parseCommandline();

convertMarkdownToHTML(args.inputFilePath, args.outputFilePath)
	.then(() => {
		console.log(`Converted ${args.inputFilePath} to ${args.outputFilePath}`);
	})
	.catch((error) => {
		console.error("Error during conversion:", error);
	});

export default convertMarkdownToHTML;
