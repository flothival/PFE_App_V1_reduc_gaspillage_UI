import { fileURLToPath } from "node:url";
import path, { dirname } from "path";
import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  viteFinal: async (cfg) => {
    return mergeConfig(cfg, {
      base: "/",
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@": path.join(projectRoot, "src"),
        },
      },
      server: {
        fs: {
          allow: [projectRoot, path.join(projectRoot, "node_modules")],
        },
      },
      optimizeDeps: {
        include: ["react", "react-dom", "react/jsx-runtime"],
      },
    });
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
