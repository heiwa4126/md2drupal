#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import pkg from "../package.json" with { type: "json" };
import type { ConvertOptions } from "./converter1.js";
import { convertMarkdownToHTML } from "./converter1.js";

const program = new Command();

program
	.name("md2drupal")
	.description("Convert Markdown files to Drupal-compatible HTML")
	.version(`md2drupal v${pkg.version}`)
	.argument("<input-file>", "Markdown file to convert")
	.option("-o, --output <file>", "Output HTML file path")
	.option("-c, --css", "Include GitHub Markdown CSS from CDN")
	.action((inputFile: string, options: { output?: string; css?: boolean }) => {
		const inputFilePath = inputFile;
		const outputFilePath =
			options.output ||
			path.join(
				path.dirname(inputFilePath),
				`${path.basename(inputFilePath, path.extname(inputFilePath))}.html`,
			);

		const convertOptions: ConvertOptions = {
			includeCss: options.css,
		};

		convertMarkdownToHTML(inputFilePath, outputFilePath, convertOptions)
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
