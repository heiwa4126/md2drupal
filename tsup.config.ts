import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts", "!src/**/*.test.ts"],
	format: ["esm", "cjs"],
	outDir: "dist",
	bundle: false,
	splitting: false,
	sourcemap: true,
	clean: true,
	dts: {
		resolve: true,
	},
});
