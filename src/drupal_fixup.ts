import type { Element, Parent } from "hast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Processes a table node by wrapping it in a div element with a specific class name.
 * @param node - The table node to be processed.
 * @param index - The index of the table node in the parent's children array.
 * @param parent - The parent node of the table node.
 */
function processTableNode(node: Element, index: number, parent: Parent | null) {
	const tableWrapper: Element = {
		type: "element",
		tagName: "div",
		properties: { className: "table-layer" },
		children: [
			{
				...node,
				properties: {
					...node.properties,
					className: "table-headling-x",
				},
			},
		],
	};
	if (parent?.children) {
		parent.children[index] = tableWrapper;
	}
}

/**
 * Processes an image node and wraps it with necessary elements for Drupal integration.
 * @param node - The image node to process.
 * @param index - The index of the node in the parent's children array.
 * @param parent - The parent node of the image node.
 */
function processImageNode(node: Element, index: number, parent: Parent | null) {
	const altText = node.properties?.alt || "";
	const imgWrapper: Element = {
		type: "element",
		tagName: "div",
		properties: { className: "img-grid--1" },
		children: [
			{
				type: "element",
				tagName: "div",
				properties: { className: "lb-gallery" },
				children: [
					{
						type: "element",
						tagName: "drupal-entity",
						properties: {
							alt: altText,
							title: altText,
							"data-entity-type": "media",
							"data-entity-uuid": "11111111-2222-3333-4444-555555555555",
							"data-embed-button": "media_browser",
							"data-entity-embed-display": "media_image",
							"data-entity-embed-display-settings": JSON.stringify({
								image_style: "crop_freeform",
								image_link: "",
								image_loading: { attribute: "lazy" },
								svg_render_as_image: true,
								svg_attributes: { width: "", height: "" },
							}),
						},
						children: [],
					},
				],
			},
		],
	};
	if (parent?.children) {
		parent.children[index] = imgWrapper;
	}
}

/**
 * Retrieves the text content from an HTML element.
 *
 * @param element - The HTML element to extract the text from.
 * @returns The text content of the element.
 */
function getTextFromElement(element: Element): string {
	let text = "";

	visit(element, "text", (node) => {
		text += node.value;
	});

	return text;
}

/**
 * Processes a header node by generating an ID based on its text content and updating the node properties.
 * The ID is URL-encoded to match the href values in links, enabling simple string comparison.
 * @param node - The header node to process.
 */
function processHeaderNode(node: Element) {
	const textContent = getTextFromElement(node);
	// URL-encode the slugified text to match remark's link generation
	const slug = textContent
		.toLowerCase()
		.replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF-]/g, "") // Keep alphanumeric, whitespace, and CJK characters
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
		.replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
	const id = encodeURIComponent(slug);
	node.properties = { ...node.properties, id };
}

/**
 * Custom plugin for processing Markdown AST tree.
 * This plugin performs various operations on the tree, such as adding IDs to headings,
 * custom processing for table tags, and processing image nodes.
 *
 * @param tree - The Markdown AST tree to process.
 * @returns A function that performs the custom processing on the tree.
 */
export function drupalFixupPlugin() {
	// note:
	//   hast -> hast plugin
	//   Element -> Parent -> Node
	return (tree: Node) => {
		visit(tree, "element", handleElementNode);

		// --- 分岐ごとの処理を小関数化 ---
		function handleElementNode(node: Element, index: number, parent: Parent | null) {
			if (isHeading(node)) {
				processHeaderNode(node);
				return;
			}
			if (node.tagName === "table") {
				processTableNode(node, index, parent);
				return;
			}
			if (node.tagName === "img") {
				processImageNode(node, index, parent);
				return;
			}
			if (isCodeBlock(node)) {
				trimCodeText(node);
				convertShellToPhp(node);
				return;
			}
			// shell→php変換だけ必要な場合
			if (isShellCode(node)) {
				convertShellToPhp(node);
			}
		}

		function isHeading(node: Element): boolean {
			return ["h1", "h2", "h3", "h4"].includes(node.tagName) && node.children.length > 0;
		}

		function isCodeBlock(node: Element): boolean {
			return node.tagName === "code" && node.children.length > 0;
		}

		function trimCodeText(node: Element) {
			const firstChild = node.children[0];
			if (firstChild && firstChild.type === "text" && "value" in firstChild) {
				firstChild.value = firstChild.value.trim();
			}
		}

		function isShellCode(node: Element): boolean {
			return (
				node.tagName === "code" &&
				Array.isArray(node.properties?.className) &&
				(node.properties?.className.includes("language-sh") ||
					node.properties?.className.includes("language-bash"))
			);
		}

		function convertShellToPhp(node: Element) {
			if (
				Array.isArray(node.properties?.className) &&
				(node.properties?.className.includes("language-sh") ||
					node.properties?.className.includes("language-bash"))
			) {
				node.properties.className = ["language-php"];
			}
		}

		// Remove <p> wrapping <div class="img-grid--1">
		visit(tree, "element", (node: Element, index: number, parent: Parent | null) => {
			if (node.tagName === "p" && node.children.length > 0) {
				const firstChild = node.children[0];
				if (firstChild && firstChild.type === "element") {
					const child = firstChild as Element;
					if (
						child.tagName === "div" &&
						child.properties &&
						child.properties.className === "img-grid--1"
					) {
						if (parent?.children) {
							parent.children[index] = child;
						}
					}
				}
			}
		});
	};
}
