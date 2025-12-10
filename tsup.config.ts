import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/**/*.ts", "!src/index.ts", "!src/**/*.test.ts"],
		format: ["esm", "cjs"],
		outDir: "dist",
		bundle: false,
		splitting: false,
		sourcemap: false,
		clean: true,
		dts: true,
	},
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		outDir: "dist",
		bundle: false,
		splitting: false,
		sourcemap: false,
		clean: false,
		minify: true,
		dts: true,
	},
]);
