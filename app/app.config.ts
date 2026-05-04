export default defineAppConfig({
  ui: {
    colors: {
      primary: "pink",
      secondary: "purple",
    },
    strategy: "override",
    input: {
      base: "relative bg-secondary-200 border border-secondary-800 dark:border-primary-200 text-gray-900 focus:ring-primary-400",
      color: {
        white: {
          outlined: "bg-primary-100 text-gray-900 ",
        },
        neutral: {
          outline: "bg-primary-200 text-gray-900",
        },
      },
    },
  },
});
