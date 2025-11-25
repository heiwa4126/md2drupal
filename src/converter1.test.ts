import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import convertMarkdownToHTML from "./converter1.js";

const TEST_OUTPUT_DIR = path.join(import.meta.dirname, "..", "testdata", "output");

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

	test("should convert test1.md to HTML matching test1.html", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "test1_output.html");
		const expectedFile = path.join(import.meta.dirname, "..", "testdata", "test1.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");
		const expectedHTML = readFileSync(expectedFile, "utf-8");

		expect(generatedHTML).toBe(expectedHTML);
	});

	test("should convert test2.md to HTML matching test2.html", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test2.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "test2_output.html");
		const expectedFile = path.join(import.meta.dirname, "..", "testdata", "test2.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");
		const expectedHTML = readFileSync(expectedFile, "utf-8");

		expect(generatedHTML).toBe(expectedHTML);
	});

	test("should create output file if it doesn't exist", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "new_output.html");

		expect(existsSync(outputFile)).toBe(false);

		await convertMarkdownToHTML(inputFile, outputFile);

		expect(existsSync(outputFile)).toBe(true);
	});

	test("should generate valid HTML with DOCTYPE and basic structure", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "structure_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

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
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "headers_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

		expect(generatedHTML).toContain('id="h1"');
		expect(generatedHTML).toContain('id="h2"');
		expect(generatedHTML).toContain('id="h3"');
	});

	test("should wrap tables in div.table-layer", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "table_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

		expect(generatedHTML).toContain('<div class="table-layer">');
		expect(generatedHTML).toContain('<table class="table-headling-x">');
	});

	test("should wrap images in Drupal structure", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "image_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

		expect(generatedHTML).toContain('<div class="img-grid--1">');
		expect(generatedHTML).toContain('<div class="lb-gallery">');
		expect(generatedHTML).toContain("<drupal-entity");
		expect(generatedHTML).toContain('data-entity-type="media"');
	});

	test("should convert bash/sh code blocks to php language class", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "code_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

		expect(generatedHTML).toContain('<code class="language-python">');
		expect(generatedHTML).toContain('<code class="language-php">');
		expect(generatedHTML).not.toContain('<code class="language-bash">');
		expect(generatedHTML).not.toContain('<code class="language-sh">');
	});

	test("should preserve anchor link consistency (href matches id)", async () => {
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test2.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "anchor_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

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
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test2.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "special_chars_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

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
		const inputFile = path.join(import.meta.dirname, "..", "testdata", "test1.md");
		const outputFile = path.join(TEST_OUTPUT_DIR, "gfm_test.html");

		await convertMarkdownToHTML(inputFile, outputFile);

		const generatedHTML = readFileSync(outputFile, "utf-8");

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
