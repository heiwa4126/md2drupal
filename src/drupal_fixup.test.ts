import { readFile } from "node:fs/promises";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { drupalFixupPlugin } from "./drupal_fixup.js";

describe("drupalFixupPlugin", () => {
	describe("Header ID generation", () => {
		it("should generate URL-encoded IDs for headings", async () => {
			const markdown = "## 目次\n\n## Test Heading";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			expect(html).toContain('id="%E7%9B%AE%E6%AC%A1"');
			expect(html).toContain('id="test-heading"');
		});

		it("should remove special characters before encoding", async () => {
			const markdown = '## CLI "cosign"の使い方';
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			// Special chars should be removed before encoding
			expect(html).toContain("cli-cosign");
		});

		it("should handle multiple special characters", async () => {
			const markdown = '## 疑問 1: "Fulcio CA" の秘密鍵で署名しないのはなぜ?';
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			// Colons, quotes, and question marks should be removed
			expect(html).toMatch(/id="[^"]*%E7%96%91%E5%95%8F-1-fulcio-ca/);
		});
	});

	describe("Table wrapping", () => {
		it("should wrap tables with div.table-layer", async () => {
			const markdown = "| A | B |\n|---|---|\n| 1 | 2 |";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			expect(html).toContain('<div class="table-layer">');
			expect(html).toContain('<table class="table-headling-x">');
		});
	});

	describe("Image wrapping", () => {
		it("should wrap images with Drupal-specific structure", async () => {
			const markdown = "![alt text](image.png)";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			expect(html).toContain('<div class="img-grid--1">');
			expect(html).toContain('<div class="lb-gallery">');
			expect(html).toContain("<drupal-entity");
			expect(html).toContain('alt="alt text"');
			expect(html).toContain('title="alt text"');
		});

		it("should remove <p> wrapping around image divs", async () => {
			const markdown = "![test](image.png)";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			// Should not have <p> wrapping the img-grid div
			expect(html).not.toMatch(/<p[^>]*>\s*<div class="img-grid--1">/);
		});
	});

	describe("Code block language conversion", () => {
		it("should convert language-sh to language-php", async () => {
			const markdown = "```sh\nls -la\n```";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			expect(html).toContain('class="language-php"');
			expect(html).not.toContain('class="language-sh"');
		});

		it("should convert language-bash to language-php", async () => {
			const markdown = "```bash\necho hello\n```";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			expect(html).toContain('class="language-php"');
			expect(html).not.toContain('class="language-bash"');
		});

		it("should trim code content", async () => {
			const markdown = "```python\n  code with spaces  \n```";
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(markdown);

			const html = String(result);
			// Content should be trimmed
			expect(html).toContain("code with spaces");
		});
	});

	describe("test2.md - anchor link consistency", () => {
		it("should have matching href and id attributes for all links", async () => {
			const content = await readFile("testdata/test2.md", "utf-8");
			const result = await unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype)
				.use(drupalFixupPlugin)
				.use(rehypeStringify)
				.process(content);

			const html = String(result);

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

		it("should handle special characters consistently", async () => {
			const testCases = [
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
			];

			for (const { text, expected } of testCases) {
				const markdown = `## ${text}`;
				const result = await unified()
					.use(remarkParse)
					.use(remarkGfm)
					.use(remarkRehype)
					.use(drupalFixupPlugin)
					.use(rehypeStringify)
					.process(markdown);

				const html = String(result);
				expect(html).toContain(`id="${expected}"`);
			}
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
