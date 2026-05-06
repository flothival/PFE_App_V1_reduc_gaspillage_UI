import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

/** Tokens light/dark : même feuille que l’app (`create-app` + export thème studio). */

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  tags: ["autodocs"],
};

export default preview;
