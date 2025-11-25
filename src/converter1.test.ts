import { parseHTML } from "linkedom";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { convertMarkdownToHTML } from "./converter1.js";

const TEST_OUTPUT_DIR = path.join(import.meta.dirname, "..", "testdata", "output");

/**
 * Normalize HTML by parsing and serializing it.
 * This removes formatting differences like whitespace and indentation.
 */
function normalizeHTML(html: string): string {
	const { document } = parseHTML(html);

	// Helper function to recursively trim text nodes
	function trimTextNodes(node: Node): void {
		if (node.nodeType === 3) {
			// Text node
			if (node.textContent) {
				node.textContent = node.textContent.trim();
			}
		} else if (node.nodeType === 1) {
			// Element node
			for (const child of Array.from(node.childNodes)) {
				trimTextNodes(child);
			}
		}
	}

	trimTextNodes(document.documentElement);

	// Remove whitespace between tags and normalize remaining whitespace
	const normalized = document.documentElement.outerHTML
		.replace(/>\s+</g, "><") // Remove whitespace between tags
		.replace(/\s+/g, " ") // Normalize all remaining whitespace to single space
		.trim();
	return normalized;
}

describe("convertMarkdownToHTML", () => {
	beforeEach(() => {
		// Create output directory if it doesn't exist
		if (!existsSync(TEST_OUTPUT_DIR)) {
			mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
		}
	});

	afterEach(() => {
		// Clean up output directory after each test
		if (existsSync(TEST_OUTPUT_DIR)) {
			rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
		}
	});

	/**
	 * Helper function to get test file paths
	 */
	function getTestFilePaths(testName: string, outputName: string) {
		return {
			inputFile: path.join(import.meta.dirname, "..", "testdata", `${testName}.md`),
			outputFile: path.join(TEST_OUTPUT_DIR, `${outputName}.html`),
		};
	}

	/**
	 * Helper function to convert and read generated HTML
	 */
	async function convertAndRead(testName: string, outputName: string): Promise<string> {
		const { inputFile, outputFile } = getTestFilePaths(testName, outputName);
		await convertMarkdownToHTML(inputFile, outputFile);
		return readFileSync(outputFile, "utf-8");
	}

	/**
	 * Helper function to test markdown to HTML conversion against expected output
	 */
	async function testConversion(testName: string): Promise<void> {
		const generatedHTML = await convertAndRead(testName, `${testName}_output`);
		const expectedFile = path.join(
			import.meta.dirname,
			"..",
			"testdata",
			`${testName}_expected.html`,
		);
		const expectedHTML = readFileSync(expectedFile, "utf-8");

		expect(normalizeHTML(generatedHTML)).toBe(normalizeHTML(expectedHTML));
	}

	test("should convert test1.md to HTML matching test1_expected.html", async () => {
		await testConversion("test1");
	});

	test("should convert test2.md to HTML matching test2_expected.html", async () => {
		await testConversion("test2");
	});

	test("should create output file if it doesn't exist", async () => {
		const { outputFile } = getTestFilePaths("test1", "new_output");

		expect(existsSync(outputFile)).toBe(false);

		await convertAndRead("test1", "new_output");

		expect(existsSync(outputFile)).toBe(true);
	});

	test("should generate valid HTML with DOCTYPE and basic structure", async () => {
		const generatedHTML = await convertAndRead("test1", "structure_test");

		expect(generatedHTML).toContain("<!DOCTYPE html>");
		expect(generatedHTML).toContain("<html>");
		expect(generatedHTML).toContain("<head>");
		expect(generatedHTML).toContain("<title>Converted HTML</title>");
		expect(generatedHTML).toContain("</head>");
		expect(generatedHTML).toContain("<body>");
		expect(generatedHTML).toContain("</body>");
		expect(generatedHTML).toContain("</html>");
	});

	test("should handle headers with URL-encoded IDs", async () => {
		const generatedHTML = await convertAndRead("test1", "headers_test");

		expect(generatedHTML).toContain('id="h1"');
		expect(generatedHTML).toContain('id="h2"');
		expect(generatedHTML).toContain('id="h3"');
	});

	test("should wrap tables in div.table-layer", async () => {
		const generatedHTML = await convertAndRead("test1", "table_test");

		expect(generatedHTML).toContain('<div class="table-layer">');
		expect(generatedHTML).toContain('<table class="table-headling-x">');
	});

	test("should wrap images in Drupal structure", async () => {
		const generatedHTML = await convertAndRead("test1", "image_test");

		expect(generatedHTML).toContain('<div class="img-grid--1">');
		expect(generatedHTML).toContain('<div class="lb-gallery">');
		expect(generatedHTML).toContain("<drupal-entity");
		expect(generatedHTML).toContain('data-entity-type="media"');
	});

	test("should convert bash/sh code blocks to php language class", async () => {
		const generatedHTML = await convertAndRead("test1", "code_test");

		expect(generatedHTML).toContain('<code class="language-python">');
		expect(generatedHTML).toContain('<code class="language-php">');
		expect(generatedHTML).not.toContain('<code class="language-bash">');
		expect(generatedHTML).not.toContain('<code class="language-sh">');
	});

	test("should preserve anchor link consistency (href matches id)", async () => {
		const generatedHTML = await convertAndRead("test2", "anchor_test");

		// Extract all anchor hrefs and header ids
		const hrefMatches = generatedHTML.matchAll(/href="#([^"]+)"/g);
		const idMatches = generatedHTML.matchAll(/id="([^"]+)"/g);

		const hrefs = Array.from(hrefMatches).map((m) => m[1]);
		const ids = Array.from(idMatches).map((m) => m[1]);

		// All hrefs should reference existing ids
		for (const href of hrefs) {
			expect(ids).toContain(href);
		}
	});

	test("should handle special characters in headers correctly", async () => {
		const generatedHTML = await convertAndRead("test2", "special_chars_test");

		// Check URL-encoded IDs for special characters
		expect(generatedHTML).toContain('id="%E7%9B%AE%E6%AC%A1"'); // 目次
		expect(generatedHTML).toContain(
			'id="%E6%8B%AC%E5%BC%A7%E3%81%AE%E3%83%86%E3%82%B9%E3%83%88-sigstore%E3%82%B7%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%81%A8%E3%81%AF%E4%BD%95%E3%81%8B"',
		); // 括弧のテスト
		expect(generatedHTML).toContain(
			'href="#%E7%96%91%E5%95%8F%E7%AC%A6%E3%81%AE%E3%83%86%E3%82%B9%E3%83%88-%E3%81%AA%E3%81%9C%E7%9F%AD%E5%91%BD%E3%81%AA%E8%A8%BC%E6%98%8E%E6%9B%B8%E3%82%92%E4%BD%BF%E3%81%86%E3%81%AE%E3%81%8B"',
		); // 疑問符のテスト
	});

	test("should process GitHub Flavored Markdown (GFM) features", async () => {
		const generatedHTML = await convertAndRead("test1", "gfm_test");

		// GFM tables should be rendered
		expect(generatedHTML).toContain("<table");
		expect(generatedHTML).toContain("<thead>");
		expect(generatedHTML).toContain("<tbody>");
	});

	test("should handle files with different output paths", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const customOutputDir = path.join(TEST_OUTPUT_DIR, "custom", "nested");
		const outputFile = path.join(customOutputDir, "custom_output.html");

		// Create nested directory
		mkdirSync(customOutputDir, { recursive: true });

		await convertMarkdownToHTML(inputFile, outputFile);

		expect(existsSync(outputFile)).toBe(true);

		const generatedHTML = readFileSync(outputFile, "utf-8");
		expect(generatedHTML).toContain('<h1 id="h1">h1</h1>');
	});
});
