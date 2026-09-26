/**
 * Built-in weight-category templates.
 *
 * A template describes one association/season's full set of weight-category
 * sheets. Each entry in `categories` becomes one printable page: an age
 * group + sex, and the ordered list of weight-class labels for that page.
 *
 * Built-ins are read-only in the UI (they can be duplicated into an
 * editable custom template, but not edited or deleted directly) so that
 * "SGFI 2026-27" always stays available as a known-good starting point.
 */

const BUILT_IN_TEMPLATES = [
  {
    id: "sgfi-2026-27",
    builtin: true,
    association: "SGFI",
    season: "2026-27",
    documentTitle: "TAEKWONDO SGFI KYORUGI STUDENTS LIST",
    categories: [
      {
        ageGroup: "U-14 (Cadet)",
        sex: "Boys",
        weights: ["Under-18", "18 - 21", "21 - 23", "23 - 25", "25 - 27", "27 - 29", "29 - 32", "32 - 35", "35 - 38", "38 - 41", "Over-41"]
      },
      {
        ageGroup: "U-14 (Cadet)",
        sex: "Girls",
        weights: ["Under-16", "16 - 18", "18 - 20", "20 - 22", "22 - 24", "24 - 26", "26 - 29", "29 - 32", "32 - 35", "35 - 38", "Over-38"]
      },
      {
        ageGroup: "U-17 (Junior)",
        sex: "Boys",
        weights: ["Under-35", "35 - 38", "38 - 41", "41 - 45", "45 - 48", "48 - 51", "51 - 55", "55 - 59", "59 - 63", "63 - 68", "68 - 73", "73 - 78", "Over-78"]
      },
      {
        ageGroup: "U-17 (Junior)",
        sex: "Girls",
        weights: ["Under-32", "32 - 35", "35 - 38", "38 - 42", "42 - 44", "44 - 46", "46 - 49", "49 - 52", "52 - 55", "55 - 59", "59 - 63", "63 - 68", "Over-68"]
      },
      {
        ageGroup: "U-19 (Senior)",
        sex: "Boys",
        weights: ["41 - 45", "45 - 48", "48 - 51", "51 - 55", "55 - 59", "59 - 63", "63 - 68", "68 - 73", "73 - 78", "Over-78"]
      },
      {
        ageGroup: "U-19 (Senior)",
        sex: "Girls",
        weights: ["Under-40", "40 - 42", "42 - 44", "44 - 46", "46 - 49", "49 - 52", "52 - 55", "55 - 59", "59 - 63", "63 - 68", "Over-68"]
      }
    ]
  },
  {
    // Reproduces the blank student-list template originally uploaded
    // (age brackets: Sub Junior / Cadet / Junior / Senior), with the same
    // "Under-X" style weight labels used on that original form. The source
    // document listed a "Senior Boys" table twice with two different,
    // non-overlapping weight scales; the second one (the lower, female-
    // typical scale) has been labelled "Girls" here to match every other
    // age group, which lists one Boys and one Girls table.
    id: "Association",
    builtin: true,
    association: "Association",
    season: "",
    documentTitle: "TAEKWONDO ASSOCIATION KYORUGI STUDENTS LIST",
    categories: [
      {
        ageGroup: "Sub Junior (8-11 years)",
        sex: "Boys",
        weights: ["Under-18", "Under-21", "Under-23", "Under-25", "Under-27", "Under-29", "Under-32", "Under-35", "Under-38", "Under-41", "Under-44", "Under-50","over-50"]
      },
      {
        ageGroup: "Sub Junior (8-11 years)",
        sex: "Girls",
        weights: ["Under-16", "Under-18", "Under-20", "Under-22", "Under-24", "Under-26", "Under-29", "Under-32", "Under-35", "Under-38", "Under-41", "Under-47","over-47"]
      },
      {
        ageGroup: "Cadet (12-14 years)",
        sex: "Boys",
        weights: ["Under-33", "Under-37", "Under-41", "Under-45", "Under-49", "Under-53", "Under-57", "Under-61", "Under-65", "Over-65"]
      },
      {
        ageGroup: "Cadet (12-14 years)",
        sex: "Girls",
        weights: ["Under-29", "Under-33", "Under-37", "Under-41", "Under-44", "Under-47", "Under-51", "Under-55", "Under-59", "Over-59"]
      },
      {
        ageGroup: "Junior (15-17 years)",
        sex: "Boys",
        weights: ["Under-45", "Under-48", "Under-51", "Under-55", "Under-59", "Under-63", "Under-68", "Under-73", "Under-78", "Over-78"]
      },
      {
        ageGroup: "Junior (15-17 years)",
        sex: "Girls",
        weights: ["Under-42", "Under-44", "Under-46", "Under-49", "Under-52", "Under-55", "Under-59", "Under-63", "Under-68", "Over-68"]
      },
      {
        ageGroup: "Senior (17+ years)",
        sex: "Boys",
        weights: ["Under-54", "Under-58", "Under-63", "Under-68", "Under-74", "Under-80", "Under-87", "Over-87"]
      },
      {
        ageGroup: "Senior (17+ years)",
        sex: "Girls",
        weights: ["Under-46", "Under-49", "Under-53", "Under-57", "Under-62", "Under-67", "Under-73", "Over-73"]
      }
    ]
  }
];

// Exposed as a global for plain <script> usage (no bundler in this project).
window.BUILT_IN_TEMPLATES = BUILT_IN_TEMPLATES;
