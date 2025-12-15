# md2drupal - AI Coding Agent Instructions

## Project Overview

TypeScript-based CLI tool that converts Markdown to Drupal-compatible HTML using the Unified ecosystem (remark/rehype). This is also a learning project for Unified processing pipelines and TypeScript packaging.

## Architecture

### Processing Pipeline (src/converter1.ts)

Two-pass processing pipeline:

**First Pass** (Title & Front Matter extraction):
1. `remarkParse` - Parse Markdown to mdast
2. `remarkGfm` - Add GFM support
3. `remarkFrontmatter` - Recognize YAML Front Matter as mdast node
4. `remarkExtractFrontmatter` - Extract Front Matter data to `file.data` (uses `yaml.parse`)
5. `remarkRehype` - Convert to hast
6. `rehypeStringify` - Serialize (for processing)
7. Extract first heading text for title, store Front Matter data

**Second Pass** (Full conversion):
1. `remarkParse` - Parse Markdown to mdast
2. `remarkGfm` - Add GFM support (tables, strikethrough, etc.)
3. `remarkFrontmatter` - Recognize and remove YAML Front Matter from output
4. `remarkRehype` - Convert mdast to hast (Markdown AST to HTML AST)
5. `drupalFixupPlugin` - Custom hast transformations for Drupal
6. `rehypeStringify` - Serialize hast to HTML string

**Error Handling**: YAML parse errors are caught, logged to stderr, and ignored (processing continues without Front Matter)

### Custom Drupal Transformations (src/drupal_fixup.ts)

The plugin uses `unist-util-visit` to traverse the hast tree and applies:

- **Headers (h1-h4)**: Generate URL-encoded IDs from text content. Slugification removes special chars, converts to lowercase, replaces spaces with hyphens, then URL-encodes to match remark-generated anchor hrefs
- **Tables**: Wrap in `<div class="table-layer">` with `table-headling-x` class
- **Images**: Transform into Drupal's nested structure: `div.img-grid--1 > div.lb-gallery > drupal-entity` with media entity metadata
- **Code blocks**: Convert `language-sh` and `language-bash` to `language-php` for Drupal's syntax highlighter, trim whitespace from code content
- **Paragraphs**: Remove `<p>` wrappers around image divs to prevent invalid HTML nesting

### YAML Front Matter & Meta Tags (src/converter1.ts)

**FrontMatterData Interface**:
```typescript
export interface FrontMatterData {
  description?: string;
  keywords?: string | string[];
  author?: string;
}
```

**Meta Tag Generation**:
- `generateMetaTags(data: FrontMatterData): string` - Generates HTML meta tags from Front Matter
- Uses `escape-html` for XSS protection on all content attribute values
- Keywords: Arrays are joined with ", " (comma + space)
- Returns empty string if no Front Matter fields present

**HTML Output Structure**:
```html
<head>
  <meta charset="utf-8">  <!-- Always first element -->
  <title>...</title>
  <meta name="description" content="...">  <!-- If present in Front Matter -->
  <meta name="keywords" content="...">     <!-- If present in Front Matter -->
  <meta name="author" content="...">       <!-- If present in Front Matter -->
  <!-- CSS link and style (if includeCss option) -->
</head>
```

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

### Entry Point (src/cli.ts)

CLI using Commander.js with two options:

- `-o, --output <file>`: Specify output HTML file path
- `-c, --css`: Enable GitHub Markdown CSS injection for standalone preview

Default behavior: converts `input.md` to `input.html` in the same directory. Shebang `#!/usr/bin/env node` enables direct execution.

## Build & Distribution

### Dual Format Package (tsdown.config.ts)

- Outputs both ESM (.js) and CJS (.cjs) from single TypeScript source
- `unbundle: true` - Each source file becomes separate output file
- Generates `.d.ts` type definitions for library code
- Excludes `*.test.ts` files from build
- CLI (`cli.ts`) is built as ESM-only with minification enabled

### Package Exports (package.json)

- Main entry: `dist/converter1.js` (library function)
- Binary: `dist/cli.js` (CLI tool)
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
- `test4.md`: YAML Front Matter test (description, keywords array, author)
  - `test4_expected.html`: Output with meta tags from Front Matter

**All expected HTML files include `<meta charset="utf-8">` as the first element in `<head>`**

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

- `pnpm run cli` - Run CLI via tsx (no build needed)
- `pnpm test` - Run test suite
- `pnpm run build` - Build with tsdown
- `pnpm run smoke-test` - Test both ESM and CJS dist outputs

### Pre-publish Checklist (automated in prepublishOnly)

1. Lint with Biome
2. Run full test suite
3. Clean dist/
4. Build
5. Smoke test (verify CLI works in both formats)


## Code Quality Tools

- **Biome**: Linter and formatter (100 char line width, strict rules in biome.jsonc)
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Vitest**: Test runner with node environment

### Complexity & Duplication Checks (lizard)

- Use `lizard .` to check cyclomatic complexity (CCN) and function length. Refactor any function with CCN > 15 or that triggers a warning.
- Use `lizard -Eduplicate .` to detect duplicated code blocks (DCD). Focus on reducing duplication especially in test code.
- After major refactoring, always re-run lizard to confirm no warnings remain.
- If duplication is found in test code, prefer parameterized tests (e.g. `test.each`) and helper functions to reduce redundancy.
- If duplication or complexity is found in production code, refactor by extracting small functions and simplifying logic. Confirm all tests pass after refactoring.

#### Example Policy
- No function in production code should exceed CCN 15 (lizard warning threshold).
- Test code should avoid copy-paste by using parameterized tests and shared helpers.
- Document any exceptions or justified complexity in this file.

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
- `remark-frontmatter`: YAML Front Matter recognition in mdast
- `remark-extract-frontmatter`: Extract Front Matter data to VFile.data
- `yaml`: YAML parsing for Front Matter
- `escape-html`: HTML escaping for XSS protection in meta tags
- `commander`: CLI argument parsing
- `unist-util-visit`: AST traversal utility
- **No runtime dependencies on bundlers** - Pure TypeScript compilation

## Common Patterns

- **Unified plugins return void**: They mutate the AST tree in place
- **Visit pattern**: Use `visit(tree, nodeType, callback)` for AST transformations
- **Properties as objects**: hast element properties are objects (e.g., `{ className: "foo" }`)
- **Testing philosophy**: Golden file testing for integration, isolated processor testing for units
