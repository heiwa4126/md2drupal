import type { Root } from "hast";

import drupalFixupPlugin from "./drupalfixup.js";

describe("drupalFixupPlugin", () => {
  it("should add IDs to headings", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: {},
          children: [{ type: "text", value: "Heading 1" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: {},
          children: [{ type: "text", value: "Heading 2" }],
        },
      ],
    };

    const expectedTree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "h1",
          properties: { id: "heading-1" },
          children: [{ type: "text", value: "Heading 1" }],
        },
        {
          type: "element",
          tagName: "h2",
          properties: { id: "heading-2" },
          children: [{ type: "text", value: "Heading 2" }],
        },
      ],
    };

    const plugin = drupalFixupPlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it("should process table nodes", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [],
        },
      ],
    };

    const expectedTree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "div",
          properties: { className: "table-layer" },
          children: [
            {
              type: "element",
              tagName: "table",
              properties: { className: "table-headling-x" },
              children: [],
            },
          ],
        },
      ],
    };

    const plugin = drupalFixupPlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it("should process image nodes", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { alt: "Alt Text" },
          children: [],
        },
      ],
    };

    const expectedTree: Root = {
      type: "root",
      children: [
        {
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
                    alt: "Alt Text",
                    title: "Alt Text",
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
        },
      ],
    };

    const plugin = drupalFixupPlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it("should remove <p> wrapping <div class='img-grid--1'>", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "div",
              properties: { className: "img-grid--1" },
              children: [],
            },
          ],
        },
      ],
    };

    const expectedTree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "div",
          properties: { className: "img-grid--1" },
          children: [],
        },
      ],
    };

    const plugin = drupalFixupPlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });
});
