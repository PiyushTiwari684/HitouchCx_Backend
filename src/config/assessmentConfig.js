// src/config/assessmentConfig.js

/**
 * Assessment Configuration
 *
 * IMPORTANT: Question Pool Requirements
 * ======================================
 * For random selection to work effectively, ensure you have enough questions in the pool.
 *
 * Recommended Formula:
 * Pool Size >= (Questions per Assessment) × (Expected Monthly Candidates) / 10
 *
 * Example:
 * - If you need 3 A1-A2 Writing questions per assessment
 * - And expect 100 candidates per month
 * - You need: 3 × 100 / 10 = 30 questions minimum in the pool
 *
 * Current Configuration:
 * - Total questions per assessment: 11
 * - Writing: 6 questions (3 A1-A2, 2 B1-B2, 1 C1-C2)
 * - Speaking: 5 questions (2 A1-A2, 2 B1-B2, 1 C1-C2)
 *
 * Required Question Pool:
 * - A1-A2 Writing: 30+ questions
 * - B1-B2 Writing: 20+ questions
 * - C1-C2 Writing: 20+ questions (increased!)
 * - A1-A2 Speaking: 20+ questions
 * - B1-B2 Speaking: 20+ questions
 * - C1-C2 Speaking: 15+ questions (NEW!)
 * Total: 125+ questions recommended
 */

export default {
  LANGUAGE: {
    totalDuration: 50, // Total test duration in minutes (increased for C1-C2)
    totalQuestions: 11, // Total questions across all sections

    sections: [
      {
        name: "Writing",
        type: "WRITING",
        durationMinutes: 25, // Time allocated for writing section
        rules: [
          { cefrLevels: ["A1", "A2"], count: 3 }, // Need 30+ questions in pool
          { cefrLevels: ["B1", "B2"], count: 2 }, // Need 20+ questions in pool
          { cefrLevels: ["C1", "C2"], count: 1 }, // Need 20+ questions in pool (increased!)
        ],
        // Subtotal: 6 writing questions per assessment
      },
      {
        name: "Speaking",
        type: "SPEAKING",
        durationMinutes: 25, // Time allocated for speaking section (increased!)
        rules: [
          { cefrLevels: ["A1", "A2"], count: 2 }, // Need 20+ questions in pool
          { cefrLevels: ["B1", "B2"], count: 2 }, // Need 20+ questions in pool
          { cefrLevels: ["C1", "C2"], count: 1 }, // Need 15+ questions in pool (NEW!)
        ],
        // Subtotal: 5 speaking questions per assessment
      },
      // Add more sections as needed (Reading, Listening, etc.)
    ],
    // Grand Total: 11 questions per assessment
  },

  // Future: Add SKILL assessment type here
  // SKILL: {
  //   totalDuration: 30,
  //   totalQuestions: 15,
  //   sections: [...],
  // },
};
