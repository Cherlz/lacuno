export type Lens = { key: string; name: string; focus: string };

// The specialty "lenses" of the case conference. Each reviews the whole record
// but reports only what touches its own area.
export const LENSES: Lens[] = [
  {
    key: "ear",
    name: "Balance & ear",
    focus: "inner ear and vestibular system, hearing, vertigo vs light-headedness, positional symptoms, ENT findings",
  },
  {
    key: "neuro",
    name: "Nervous system",
    focus: "brain, spinal cord and nerves: neurological exam findings, numbness, weakness patterns, gait, vision changes, headaches, brain imaging",
  },
  {
    key: "heart",
    name: "Heart & circulation",
    focus: "heart rhythm, blood pressure including standing vs lying, ECG, fainting or near-fainting, circulation",
  },
  {
    key: "hormones",
    name: "Hormones & metabolism",
    focus: "thyroid, adrenal, blood sugar, electrolytes, vitamin levels (e.g. B12, D), anaemia and iron, kidney and liver function",
  },
  {
    key: "msk",
    name: "Muscles & bones",
    focus: "muscles, joints, bones and spine: muscle strength, muscle enzymes, bone density, neck problems, posture",
  },
  {
    key: "meds",
    name: "Medicines (pharmacist)",
    focus: "all medicines across all doctors: duplicates, interactions, side effects that overlap with the symptoms, timing of symptom changes vs medicine changes",
  },
];

export function lensByKey(key: string) {
  return LENSES.find((l) => l.key === key);
}
