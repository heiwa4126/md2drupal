import { defineConfig } from "tsdown";

function fixCjsExtension({ format }: { format: string }) {
	if (format === "cjs") return { js: ".cjs" };
	return { js: ".js" };
}

export default defineConfig([
	{
		entry: ["src/**/*.ts", "!src/index.ts", "!src/**/*.test.ts"],
		format: ["esm", "cjs"],
		outDir: "dist",
		unbundle: true,
		sourcemap: false,
		clean: true,
		dts: true,
		outExtensions: fixCjsExtension,
	},
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		outDir: "dist",
		unbundle: true,
		sourcemap: false,
		clean: false,
		minify: true,
		dts: false,
		outExtensions: fixCjsExtension,
	},
]);
