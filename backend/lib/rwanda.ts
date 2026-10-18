// Rwanda's 30 districts by province. Sectors are free text on purpose:
// there are over 400 and I'm not going to type out a list I can't verify.
export const RWANDA_DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  Southern: [
    "Gisagara", "Huye", "Kamonyi", "Muhanga",
    "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  ],
  Western: [
    "Karongi", "Ngororero", "Nyabihu", "Nyamasheke",
    "Rubavu", "Rusizi", "Rutsiro",
  ],
  Northern: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  Eastern: [
    "Bugesera", "Gatsibo", "Kayonza", "Kirehe",
    "Ngoma", "Nyagatare", "Rwamagana",
  ],
};

export const RWANDA_DISTRICTS = Object.values(RWANDA_DISTRICTS_BY_PROVINCE).flat();

export const RW_PHONE_REGEX = /^0[7][0-9]{8}$/;