import minimist from "minimist";
import path from "node:path";

type Args = {
	inputFilePath: string;
	outputFilePath: string;
};

function parseCommandline(): Args {
	const args = minimist(process.argv.slice(2));
	const inputFilePath = args._[0];

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

export default parseCommandline;
