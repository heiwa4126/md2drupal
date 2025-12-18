import { defineConfig } from "tsdown";

function fixCjsExtension({ format }: { format: string }) {
	if (format === "cjs") return { js: ".cjs" };
	return { js: ".js" };
}

export default defineConfig([
	{
		clean: true,
		entry: ["src/**/*.ts", "!src/cli.ts", "!src/**/*.test.ts"],
		format: ["esm", "cjs"],
		outDir: "dist",
		unbundle: true,
		sourcemap: true,
		dts: true,
		outExtensions: fixCjsExtension,
	},
	{
		clean: false,
		entry: ["src/cli.ts"],
		format: ["esm"],
		outDir: "dist",
		unbundle: true,
		sourcemap: false,
		dts: false,
		minify: true,
		outExtensions: fixCjsExtension,
	},
]);
