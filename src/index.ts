import parseCommandline from "./args.js";
import convertMarkdownToHTML from "./converter1.js";

const args = parseCommandline();

convertMarkdownToHTML(args.inputFilePath, args.outputFilePath)
	.then(() => {
		console.log(`Converted ${args.inputFilePath} to ${args.outputFilePath}`);
	})
	.catch((error) => {
		console.error("Error during conversion:", error);
	});
