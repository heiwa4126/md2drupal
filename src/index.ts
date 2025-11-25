#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import convertMarkdownToHTML from "./converter1.js";

const program = new Command();

program
	.name("md2drupal")
	.description("Convert Markdown files to Drupal-compatible HTML")
	.version("0.0.5-alpha1")
	.argument("<input-file>", "Markdown file to convert")
	.option("-o, --output <file>", "Output HTML file path")
	.action((inputFile: string, options: { output?: string }) => {
		const inputFilePath = inputFile;
		const outputFilePath =
			options.output ||
			path.join(
				path.dirname(inputFilePath),
				`${path.basename(inputFilePath, path.extname(inputFilePath))}.html`,
			);

		convertMarkdownToHTML(inputFilePath, outputFilePath)
			.then(() => {
				console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
			})
			.catch((error) => {
				console.error("Error during conversion:", error);
				process.exit(1);
			});
	});

program.parse();

export default convertMarkdownToHTML;
