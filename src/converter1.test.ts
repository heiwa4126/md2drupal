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

	test("should fallback gracefully on broken YAML Front Matter", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test_broken_yaml.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "broken_yaml_output.html");
		await convertMarkdownToHTML(inputFile, outputFile);
		const html = readFileSync(outputFile, "utf-8");
		expect(html).toContain("<title>Broken YAML Test</title>");
		expect(html).not.toContain('<meta name="description"');
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
	async function testConversion(
		testName: string,
		options?: { includeCss?: boolean },
	): Promise<void> {
		const { inputFile, outputFile } = getTestFilePaths(testName, `${testName}_output`);
		await convertMarkdownToHTML(inputFile, outputFile, options);
		const generatedHTML = readFileSync(outputFile, "utf-8");

		const expectedFileName = options?.includeCss
			? `${testName}_expected_with_css.html`
			: `${testName}_expected.html`;
		const expectedFile = path.join(import.meta.dirname, "..", "testdata", expectedFileName);
		const expectedHTML = readFileSync(expectedFile, "utf-8");

		expect(normalizeHTML(generatedHTML)).toBe(normalizeHTML(expectedHTML));
	}

	test.each([
		["test1", undefined, "test1_expected.html"],
		["test2", undefined, "test2_expected.html"],
		["test3", undefined, "test3_expected.html"],
		["test3", { includeCss: true }, "test3_expected_with_css.html"],
		["test4", undefined, "test4_expected.html"],
	])("should convert %s.md to HTML matching %s", async (testName, options, _expectedFile) => {
		await testConversion(testName, options);
	});

	test.each([
		[
			"should create output file if it doesn't exist",
			"test1",
			"new_output",
			(_html: string, outputFile: string) => {
				expect(existsSync(outputFile)).toBe(true);
			},
		],
		[
			"should generate valid HTML with DOCTYPE and basic structure",
			"test1",
			"structure_test",
			(html: string, _outputFile: string) => {
				expect(html).toContain("<!DOCTYPE html>");
				expect(html).toContain("<html>");
				expect(html).toContain("<head>");
				expect(html).toContain("<title>h1</title>");
				expect(html).toContain("</head>");
				expect(html).toContain("<body>");
				expect(html).toContain("</body>");
				expect(html).toContain("</html>");
			},
		],
		[
			"should handle headers with URL-encoded IDs",
			"test1",
			"headers_test",
			(html: string, _outputFile: string) => {
				expect(html).toContain('id="h1"');
				expect(html).toContain('id="h2"');
				expect(html).toContain('id="h3"');
			},
		],
		[
			"should wrap tables in div.table-layer",
			"test1",
			"table_test",
			(html: string, _outputFile: string) => {
				expect(html).toContain('<div class="table-layer">');
				expect(html).toContain('<table class="table-headling-x">');
			},
		],
		[
			"should wrap images in Drupal structure",
			"test1",
			"image_test",
			(html: string, _outputFile: string) => {
				expect(html).toContain('<div class="img-grid--1">');
				expect(html).toContain('<div class="lb-gallery">');
				expect(html).toContain("<drupal-entity");
				expect(html).toContain('data-entity-type="media"');
			},
		],
		[
			"should convert bash/sh code blocks to php language class",
			"test1",
			"code_test",
			(html: string, _outputFile: string) => {
				expect(html).toContain('<code class="language-python">');
				expect(html).toContain('<code class="language-php">');
				expect(html).not.toContain('<code class="language-bash">');
				expect(html).not.toContain('<code class="language-sh">');
			},
		],
	])("%s", async (_desc, testName, outputName, check) => {
		const { outputFile } = getTestFilePaths(testName, outputName);
		const html = await convertAndRead(testName, outputName);
		check(html, outputFile);
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

	test("should use first heading as title", async () => {
		const html1 = await convertAndRead("test1", "title_test1");
		expect(html1).toContain("<title>h1</title>");

		const html2 = await convertAndRead("test2", "title_test2");
		expect(html2).toContain("<title>CMS アンカー生成のテストケース</title>");
	});

	test("should include CSS when includeCss option is true", async () => {
		const { inputFile, outputFile } = getTestFilePaths("test3", "test3_css");
		await convertMarkdownToHTML(inputFile, outputFile, { includeCss: true });
		const generatedHTML = readFileSync(outputFile, "utf-8");

		// Check for CSS link
		expect(generatedHTML).toContain('<link rel="stylesheet" href="');
		expect(generatedHTML).toContain(
			"https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css",
		);

		// Check for style tag with padding
		expect(generatedHTML).toContain("<style>body {padding: 1.5em;}</style>");

		// Check for body class
		expect(generatedHTML).toContain('<body class="markdown-body">');
	});

	test("should not include CSS when includeCss option is false or undefined", async () => {
		const { inputFile, outputFile } = getTestFilePaths("test3", "test3_no_css");
		await convertMarkdownToHTML(inputFile, outputFile);
		const generatedHTML = readFileSync(outputFile, "utf-8");

		// Should not contain CSS link
		expect(generatedHTML).not.toContain('<link rel="stylesheet"');

		// Should not contain style tag
		expect(generatedHTML).not.toContain("<style>");

		// Should not have class on body
		expect(generatedHTML).toContain("<body>");
		expect(generatedHTML).not.toContain('<body class="markdown-body">');
	});

	test("should include charset meta tag in all generated HTML", async () => {
		const generatedHTML = await convertAndRead("test1", "charset_test");
		expect(generatedHTML).toContain('<meta charset="utf-8">');
	});

	test("should extract and use Front Matter description for meta tag", async () => {
		const generatedHTML = await convertAndRead("test4", "frontmatter_description_test");
		expect(generatedHTML).toContain(
			'<meta name="description" content="This is a test document for YAML Front Matter support in md2drupal. It demonstrates meta tag generation from Front Matter data.">',
		);
	});

	test("should extract and use Front Matter keywords (array) for meta tag", async () => {
		const generatedHTML = await convertAndRead("test4", "frontmatter_keywords_test");
		expect(generatedHTML).toContain(
			'<meta name="keywords" content="markdown, drupal, yaml, front-matter, html, meta-tags">',
		);
	});

	test("should extract and use Front Matter author for meta tag", async () => {
		const generatedHTML = await convertAndRead("test4", "frontmatter_author_test");
		expect(generatedHTML).toContain('<meta name="author" content="Test Author">');
	});

	test("should not include YAML Front Matter in HTML body", async () => {
		const generatedHTML = await convertAndRead("test4", "frontmatter_removal_test");
		expect(generatedHTML).not.toContain("---");
		expect(generatedHTML).not.toContain("description:");
		expect(generatedHTML).not.toContain("keywords:");
		expect(generatedHTML).not.toContain("author:");
	});

	test("should handle documents without Front Matter (backward compatibility)", async () => {
		const generatedHTML = await convertAndRead("test1", "no_frontmatter_test");
		expect(generatedHTML).toContain('<meta charset="utf-8">');
		expect(generatedHTML).not.toContain('<meta name="description"');
		expect(generatedHTML).not.toContain('<meta name="keywords"');
		expect(generatedHTML).not.toContain('<meta name="author"');
	});
});
