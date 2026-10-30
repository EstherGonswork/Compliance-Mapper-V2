/**
 * Plain-language wording for the free explainer. Edit this file to change what it says.
 * Placeholders: {body} the reviewing body for the EU or UK, {code} the applicable code name.
 */

import type { RegionId } from "@/lib/types";

export const EXPLAINER = {
  headings: {
    plain: "In plain words",
    why: "Why this applies",
    first: "What to do first",
    watch: "What to watch",
  },

  plain: {
    us: "In the United States, boilers and pressure parts are built and stamped to the ASME Boiler and Pressure Vessel Code. Pressure sets which section applies, and for hot water boilers the design temperature matters too.",
    eu: "In the European Union, pressure equipment above 0.5 bar must meet the Pressure Equipment Directive. The category it falls into sets how much a third party checks the manufacturer's work.",
    uk: "In the United Kingdom, pressure equipment above 0.5 bar must meet the Pressure Equipment (Safety) Regulations 2016. The category it falls into sets how much a third party checks the manufacturer's work.",
    in: "In India, the Indian Boiler Regulations cover boilers and the parts and pipes that go into them. Approval and inspection happen in stages, and design sign-off comes before manufacture starts.",
    cn: "In China, boilers and pressure vessels count as special equipment. The maker needs a manufacturing license, and inspection bodies supervise the work at each stage.",
    au: "In Australia and New Zealand, boilers and pressure vessels are built to the AS 1228 and AS 1210 standards. The state or territory regulator handles design registration.",
  } satisfies Record<RegionId, string>,

  first: {
    us: "Ask your supplier for their ASME certificate of authorization and the stamp they will apply to your part.",
    eu: "Ask your supplier which category and conformity module they are working to, and which {body} reviews the file.",
    uk: "Ask your supplier which category and conformity module they are working to, and which {body} reviews the file.",
    in: "Ask your supplier whether the design has gone to the Inspecting Authority yet. Manufacturing cannot begin before that sign-off.",
    cn: "Ask your supplier for their China Manufacture License and the TSG class they are certifying to.",
    au: "Ask your supplier for the AS 4343 hazard level they have assigned and whether the design is registered.",
  } satisfies Record<RegionId, string>,

  watch: {
    us: "The section shown holds only up to its limits. If the design pressure rises above them, or the design temperature does for hot water, a different section applies.",
    eu: "The marking and the reviewing body differ between the EU and the UK. Check the marking line matches the market the part ships to.",
    uk: "The marking and the reviewing body differ between the EU and the UK. Check the marking line matches the market the part ships to.",
    in: "IBR tests capacity and pressure against separate limits. Share the exact capacity with your supplier so the boiler definition can be confirmed.",
    cn: "The class depends on pressure, volume and medium taken together, so ask for the class in writing.",
    au: "The hazard level depends on pressure, volume, temperature and fluid taken together, so ask for the level in writing.",
  } satisfies Record<RegionId, string>,

  /** Added when the EU or UK result still needs a category. */
  openCategory:
    "The category is still open. Use the guided question under the category field, or ask your {body} which Annex II table they used.",
};
