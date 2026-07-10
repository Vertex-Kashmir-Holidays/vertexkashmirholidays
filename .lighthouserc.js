module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/tours",
        "http://localhost:3000/tours/luxury-kashmir-honeymoon-package-5n-6d",
        "http://localhost:3000/destinations",
        "http://localhost:3000/destinations/srinagar",
        "http://localhost:3000/blog",
        "http://localhost:3000/blog/is-kashmir-safe-for-tourists",
        "http://localhost:3000/contact",
        "http://localhost:3000/about",
      ],
      numberOfRuns: 3,
      startServerCommand: "yarn start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 30000,
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
