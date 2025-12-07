import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  if (isBuild) {
    return {
      css: {
        preprocessorOptions: {
          scss: {
            api: "modern-compiler"
          }
        }
      },
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "mapboxgl",
          fileName: (format) => {
            if (format === "umd") return "index.umd.js";
            if (format === "es") return "index.js";
            if (format === "cjs") return "index.cjs";
            return `index.${format}.js`;
          },
          formats: ["es", "cjs", "umd"]
        },
        rollupOptions: {
          external: ["mapbox-gl"],
          output: {
            globals: {
              "mapbox-gl": "mapboxgl"
            },
            extend: true
          }
        }
      }
    };
  }

  return {
    root: "example",
    envDir: resolve(__dirname, "."),
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
