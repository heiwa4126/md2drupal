import { readFile } from "node:fs/promises";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it, test } from "vitest";
import { drupalFixupPlugin } from "./drupal_fixup.js";

// 共通テスト実行関数
async function processMarkdown(markdown: string) {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(drupalFixupPlugin)
		.use(rehypeStringify)
		.process(markdown);
	return String(result);
}

// ファイル読み込み→変換
async function processFile(path: string) {
	const content = await readFile(path, "utf-8");
	return processMarkdown(content);
}

describe("drupalFixupPlugin", () => {
	describe("Header ID generation", () => {
		test.each([
			{
				name: "should generate URL-encoded IDs for headings",
				markdown: "## 目次\n\n## Test Heading",
				expects: [
					{ type: "contain", value: 'id="%E7%9B%AE%E6%AC%A1"' },
					{ type: "contain", value: 'id="test-heading"' },
				],
			},
			{
				name: "should remove special characters before encoding",
				markdown: '## CLI "cosign"の使い方',
				expects: [{ type: "contain", value: "cli-cosign" }],
			},
			{
				name: "should handle multiple special characters",
				markdown: '## 疑問 1: "Fulcio CA" の秘密鍵で署名しないのはなぜ?',
				expects: [{ type: "match", value: /id="[^"]*%E7%96%91%E5%95%8F-1-fulcio-ca/ }],
			},
		])("$name", async ({ markdown, expects }) => {
			const html = await processMarkdown(markdown);
			for (const exp of expects) {
				if (exp.type === "contain") expect(html).toContain(exp.value);
				if (exp.type === "match") expect(html).toMatch(exp.value);
			}
		});
	});

	describe("Table wrapping", () => {
		it("should wrap tables with div.table-layer", async () => {
			const html = await processMarkdown("| A | B |\n|---|---|\n| 1 | 2 |");
			expect(html).toContain('<div class="table-layer">');
			expect(html).toContain('<table class="table-headling-x">');
		});
	});

	describe("Image wrapping", () => {
		test.each([
			{
				name: "should wrap images with Drupal-specific structure",
				markdown: "![alt text](image.png)",
				expects: [
					{ type: "contain", value: '<div class="img-grid--1">' },
					{ type: "contain", value: '<div class="lb-gallery">' },
					{ type: "contain", value: "<drupal-entity" },
					{ type: "contain", value: 'alt="alt text"' },
					{ type: "contain", value: 'title="alt text"' },
				],
			},
			{
				name: "should remove <p> wrapping around image divs",
				markdown: "![test](image.png)",
				expects: [{ type: "notMatch", value: /<p[^>]*>\s*<div class="img-grid--1">/ }],
			},
		])("$name", async ({ markdown, expects }) => {
			const html = await processMarkdown(markdown);
			for (const exp of expects) {
				if (exp.type === "contain") expect(html).toContain(exp.value);
				if (exp.type === "notMatch") expect(html).not.toMatch(exp.value);
			}
		});
	});

	describe("Code block language conversion", () => {
		test.each([
			{
				name: "should convert empty shell code block to language-php",
				markdown: "```sh\n```",
				expects: [
					{ type: "contain", value: 'class="language-php"' },
					{ type: "notContain", value: 'class="language-sh"' },
				],
			},
			{
				name: "should convert language-sh to language-php",
				markdown: "```sh\nls -la\n```",
				expects: [
					{ type: "contain", value: 'class="language-php"' },
					{ type: "notContain", value: 'class="language-sh"' },
				],
			},
			{
				name: "should convert language-bash to language-php",
				markdown: "```bash\necho hello\n```",
				expects: [
					{ type: "contain", value: 'class="language-php"' },
					{ type: "notContain", value: 'class="language-bash"' },
				],
			},
			{
				name: "should trim code content",
				markdown: "```python\n  code with spaces  \n```",
				expects: [{ type: "contain", value: "code with spaces" }],
			},
		])("$name", async ({ markdown, expects }) => {
			const html = await processMarkdown(markdown);
			for (const exp of expects) {
				if (exp.type === "contain") expect(html).toContain(exp.value);
				if (exp.type === "notContain") expect(html).not.toContain(exp.value);
			}
		});
	});

	describe("test2.md - anchor link consistency", () => {
		it("should have matching href and id attributes for all links", async () => {
			const html = await processFile("testdata/test2.md");
			// Extract all href values from links
			const hrefMatches = html.matchAll(/<a href="#([^"]+)"/g);
			const hrefs = Array.from(hrefMatches).map((m) => m[1]);
			// Extract all id values from headings (h1-h4)
			const idMatches = html.matchAll(/<h[1-4] id="([^"]+)"/g);
			const ids = Array.from(idMatches).map((m) => m[1]);
			// Skip the first heading (h1) as it's not in TOC
			const idsToCheck = ids.slice(1);
			// Each href should match a corresponding id
			expect(hrefs.length).toBe(idsToCheck.length);
			for (let i = 0; i < hrefs.length; i++) {
				expect(hrefs[i]).toBe(idsToCheck[i]);
			}
		});

		test.each([
			{ text: "目次", expected: "%E7%9B%AE%E6%AC%A1" },
			{
				text: "括弧のテスト: Sigstore(シグストア)とは何か",
				expected:
					"%E6%8B%AC%E5%BC%A7%E3%81%AE%E3%83%86%E3%82%B9%E3%83%88-sigstore%E3%82%B7%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%81%A8%E3%81%AF%E4%BD%95%E3%81%8B",
			},
			{
				text: "コロンのテスト: 補足: Provenance について",
				expected:
					"%E3%82%B3%E3%83%AD%E3%83%B3%E3%81%AE%E3%83%86%E3%82%B9%E3%83%88-%E8%A3%9C%E8%B6%B3-provenance-%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6",
			},
			{
				text: 'CLI "cosign"の使い方',
				expected: "cli-cosign%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9",
			},
		])("should handle special characters consistently: $text", async ({ text, expected }) => {
			const html = await processMarkdown(`## ${text}`);
			expect(html).toContain(`id="${expected}"`);
		});
	});

	describe("test1.md - full integration", () => {
		it("should process test1.md correctly", async () => {
			const content = await readFile("testdata/test1.md", "utf-8");
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(content);

			const html = String(result);

			// Should have heading IDs
			expect(html).toMatch(/<h1 id="[^"]+"/);
			expect(html).toMatch(/<h2 id="[^"]+"/);
			expect(html).toMatch(/<h3 id="[^"]+"/);

			// Should have table wrapper
			expect(html).toContain('<div class="table-layer">');

			// Should have image wrapper
			expect(html).toContain('<div class="img-grid--1">');

			// Should convert sh/bash to php
			expect(html).toContain('class="language-php"');
			expect(html).not.toContain('class="language-sh"');
			expect(html).not.toContain('class="language-bash"');

			// Should keep python as-is
			expect(html).toContain('class="language-python"');
		});
	});
});
