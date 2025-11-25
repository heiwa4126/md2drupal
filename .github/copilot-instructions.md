# md2drupal - AI Coding Agent Instructions

## Project Overview

TypeScript-based CLI tool that converts Markdown to Drupal-compatible HTML using the Unified ecosystem (remark/rehype). This is also a learning project for Unified processing pipelines and TypeScript packaging.

## Architecture

### Processing Pipeline (src/converter1.ts)

Unified pipeline transforms Markdown → mdast → hast → HTML:

1. `remarkParse` - Parse Markdown to mdast
2. `remarkGfm` - Add GFM support (tables, strikethrough, etc.)
3. `remarkRehype` - Convert mdast to hast (Markdown AST to HTML AST)
4. `drupalFixupPlugin` - Custom hast transformations for Drupal
5. `rehypeStringify` - Serialize hast to HTML string

### Custom Drupal Transformations (src/drupal_fixup.ts)

The plugin uses `unist-util-visit` to traverse the hast tree and applies:

- **Headers (h1-h4)**: Generate URL-encoded IDs from text content. Slugification removes special chars, converts to lowercase, replaces spaces with hyphens, then URL-encodes to match remark-generated anchor hrefs
- **Tables**: Wrap in `<div class="table-layer">` with `table-headling-x` class
- **Images**: Transform into Drupal's nested structure: `div.img-grid--1 > div.lb-gallery > drupal-entity` with media entity metadata
- **Code blocks**: Convert `language-sh` and `language-bash` to `language-php` for Drupal's syntax highlighter, trim whitespace from code content
- **Paragraphs**: Remove `<p>` wrappers around image divs to prevent invalid HTML nesting

### Conversion Options (src/converter1.ts)

The `convertMarkdownToHTML` function accepts an optional `ConvertOptions` parameter:

```typescript
export interface ConvertOptions {
  includeCss?: boolean;
}
```

- **`includeCss: true`**: Injects GitHub Markdown CSS from CDN for standalone HTML preview
  - Adds `<link rel="stylesheet" href="${DEFAULT_CSS_URL}">` to `<head>`
  - Adds `<style>body {padding: ${DEFAULT_PADDING};}</style>` to `<head>`
  - Adds `class="markdown-body"` to `<body>` tag
- **`includeCss: false` or undefined (default)**: Generates minimal HTML for Drupal CMS pasting

**Constants**:
- `DEFAULT_CSS_URL`: GitHub Markdown CSS CDN URL (currently 5.8.1)
- `DEFAULT_PADDING`: Body padding value (`"1.5em"`)

### Entry Point (src/index.ts)

CLI using Commander.js with two options:

- `-o, --output <file>`: Specify output HTML file path
- `-c, --css`: Enable GitHub Markdown CSS injection for standalone preview

Default behavior: converts `input.md` to `input.html` in the same directory. Shebang `#!/usr/bin/env node` enables direct execution.

## Build & Distribution

### Dual Format Package (tsup.config.ts)

- Outputs both ESM (.js) and CJS (.cjs) from single TypeScript source
- `bundle: false` - Each source file becomes separate output file
- Generates `.d.ts` type definitions with source maps
- Excludes `*.test.ts` files from build

### Package Exports (package.json)

- Main entry: `dist/converter1.js` (library function)
- Binary: `dist/index.js` (CLI tool)
- **Critical**: Uses `prepublishOnly` hook to run full test suite before publishing to npm

## Testing Strategy (Vitest)

### File-based Integration Tests (src/converter1.test.ts)

Converts testdata/*.md files and compares against golden *.html files. Tests use `import.meta.dirname` for path resolution.

**Test Data**:
- `test1.md`: Complex document with tables, images, code blocks (Drupal-specific transformations)
- `test2.md`: Japanese characters and special characters in headers (anchor link consistency)
- `test3.md`: Simple document with headings, paragraphs, lists
  - `test3_expected.html`: Default output (no CSS)
  - `test3_expected_with_css.html`: CSS-enabled output (with GitHub Markdown CSS)

**Helper Functions**:
- `testConversion(testName, options?)`: Converts markdown and compares with expected HTML
  - Accepts optional `ConvertOptions` parameter
  - Selects appropriate expected file based on `options.includeCss`
- `convertAndRead()`: Converts and returns generated HTML
- `normalizeHTML()`: Removes whitespace differences for comparison

Setup/teardown:

- `beforeEach`: Create `testdata/output/` directory
- `afterEach`: Delete output directory

### Unit Tests (src/drupal_fixup.test.ts)

Direct testing of Unified plugin transformations. Build processor inline:

```typescript
const result = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(drupalFixupPlugin)
  .use(rehypeStringify)
  .process(markdown);
```

**Critical**: Anchor link consistency tests validate that header IDs match remark-generated TOC hrefs character-for-character (URL-encoding must match exactly).

## Development Workflows

### Quick Commands

- `pnpm run main` - Run CLI via tsx (no build needed)
- `pnpm test` - Run test suite
- `pnpm run build` - Build with tsup
- `pnpm run smoke-test` - Test both ESM and CJS dist outputs

### Pre-publish Checklist (automated in prepublishOnly)

1. Lint with Biome
2. Run full test suite
3. Clean dist/
4. Build
5. Smoke test (verify CLI works in both formats)

### Code Quality Tools

- **Biome**: Linter and formatter (100 char line width, strict rules in biome.jsonc)
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Vitest**: Test runner with node environment

## Project-Specific Conventions

### Import Extensions

Always use `.js` extension in imports (for ESM compatibility):

```typescript
import drupalFixupPlugin from "./drupal_fixup.js";
```

### Type Imports

Use `type` keyword for type-only imports:

```typescript
import type { Element, Parent } from "hast";
```

### Package.json Imports

Use import attributes for JSON:

```typescript
import pkg from "../package.json" with { type: "json" };
```

### AST Node Type Narrowing

Pattern from drupal_fixup.ts - check type before accessing properties:

```typescript
if (firstChild && firstChild.type === "text" && "value" in firstChild) {
  firstChild.value = firstChild.value.trim();
}
```

## External Dependencies

- `unified` ecosystem: Core processing pipeline
- `commander`: CLI argument parsing
- `unist-util-visit`: AST traversal utility
- **No runtime dependencies on bundlers** - Pure TypeScript compilation

## Common Patterns

- **Unified plugins return void**: They mutate the AST tree in place
- **Visit pattern**: Use `visit(tree, nodeType, callback)` for AST transformations
- **Properties as objects**: hast element properties are objects (e.g., `{ className: "foo" }`)
- **Testing philosophy**: Golden file testing for integration, isolated processor testing for units
