// src/config/assessmentConfig.js
export default {
  LANGUAGE: {
    sections: [
      {
        name: "Writing",
        type: "WRITING",
        rules: [
          { cefrLevels: ["A1", "A2"], count: 3 },
          { cefrLevels: ["B1", "B2"], count: 2 },
          { cefrLevels: ["C1", "C2"], count: 1 },
        ],
      },
      {
        name: "Speaking",
        type: "SPEAKING",
        rules: [
          { cefrLevels: ["A1", "A2"], count: 2 },
          { cefrLevels: ["B1", "B2"], count: 2 },
        ],
      },
      // Add more sections as needed
    ],
  },
  // Add SKILL etc. here
};
