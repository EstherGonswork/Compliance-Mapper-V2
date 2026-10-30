# Boiler Parts Compliance Mapper, version 2

A Next.js static site. Version 2 adds compare mode, a guided category question and an explainer. Pick a target region, equipment type and operating pressure to see the applicable boiler code, the required marking and what to request from the supplier.

- **Six regions:** United States (ASME), European Union (PED), United Kingdom (PESR), India (IBR), China (TSG) and Australia / New Zealand (AS standards).
- **Styled in the Rivexa palette:** violet #4A3587 and teal #22BAA2, with Urbanist for body text and Chillax for headings. Dark mode follows the device setting.
- **Rules live in one data file:** `data/rules.ts`. Changing a threshold or a line of guidance never touches the interface code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # rule tests plus the regression check against the old HTML tool
npm run build      # production build
```

## Edit a rule

Open `data/rules.ts`. Every threshold and every line of text is there.

| To change | Edit |
|---|---|
| The 15 psig line between Section IV and Section I | `US_RULES.bands.steam[0].max` |
| The 160 psig hot water limit or the 250 F temperature limit | `US_RULES.bands.hotwater[0].max`, `US_RULES.hotWaterTempLimitF` |
| The Section VIII division limits | `US_RULES.bands.vesselpart` |
| The IBR 22.75 litre and 1 kg/cm² limits | `INDIA_RULES.boiler` |
| The IBR 3.5 kg/cm² pipe limit and 254 mm diameter | `INDIA_RULES.pipe` |
| The 0.5 bar PED/PESR scope limit | `PED_RULES.scopeBar` |
| Any wording, checklist item or marking | The matching text in the same file |

Text can use placeholders such as `{psi}`, `{limit}` and `{body}`. The list is at the top of `data/rules.ts`. The numbers in the sentences come from the limits, so changing `max: 15` to another value also updates the sentence that quotes it.

Run `npm test` after an edit. The tests check every threshold edge and confirm no placeholder is left unfilled.

## What changed from the HTML version

- The calculation code moved out of the page into `lib/engine.ts`, a pure function that is easy to test.
- A pressure typed in its own unit now stays exact. In the HTML version, 15 psi could convert to bar and back as 15.000000000000002 and land in the wrong band.
- Every result has a shareable link. The address bar updates as you change inputs, and opening the link restores them.
- A "Copy summary" button puts the result and supplier checklist on the clipboard.
- A hint under the pressure field says to enter gauge pressure.
- The page works in dark mode, on phones, with keyboard focus rings and a polite screen reader announcement of new results.

## Tests

- `tests/engine.test.ts` checks each threshold on both sides, the EU and UK wording, unit conversion and that no output has an unfilled placeholder.
- `tests/parity.test.ts` loads the calculation code from the old HTML page (`tests/fixtures/original-index.html`), runs both versions across more than 10,000 combinations of region, equipment, unit, pressure, volume and category, and expects identical results. The only allowed differences are a short list of wording edits, written out in the test file.

## What is new in version 2

| Feature | What it does | Cost |
| --- | --- | --- |
| Compare mode | Tick "Compare with a second region" to see two markets side by side, with an at-a-glance table above two full result cards. The link carries the second region (`cmp=`). | Free |
| Guided category | Under the EU and UK category field, "Help me find the category" asks what the part is, what it holds and the fluid group, plus a volume or DN. It names the Annex II table and tells you when the part falls under Sound Engineering Practice (SEP). One tap applies the answer to the category field. | Free |
| Written explainer | "Explain in plain language" on each result gives four short sections: in plain words, why this applies, what to do first and what to watch. The text lives in `data/explainer.ts`. | Free |
| AI explainer | The visitor pastes their own Anthropic key and the browser asks Claude for a short explanation plus three questions to put to the supplier. | The visitor's own usage |

## The guided category, and what it leaves open

The guide uses the Article 4 entry limits of the Pressure Equipment Directive for each of the nine Annex II tables. Those limits decide whether a part is SEP.

The lines that split Category I, II, III and IV exist in the directive as chart lines. No text source I could open prints them, so `data/ped.ts` ships with an empty `bands` list for every table. Above the entry limits, the guide says "Category I or higher", names the table and shows the PS and size values to read against it.

To make the guide name the category, add bands to `data/ped.ts` from the charts in Annex II. Each band lists the largest value of each measure that still belongs to that category, from Category I upward. A point exactly on a line belongs to the lower category. The tests in `tests/pedGuide.test.ts` show a worked example.

```ts
bands: [
  { category: "I", max: { psv: 50 } },
  { category: "II", max: { psv: 200 } },
  // ...
]
```

Ask a pressure equipment specialist to read the charts and sign off on the numbers before you ship them.

## Key safety

- The key is typed into a password field and held in memory.
- "Remember on this device" is off by default. When ticked, the key is saved in this browser's local storage under `compliance-mapper.key`. "Forget key" removes it.
- The key goes only to `https://api.anthropic.com/v1/messages`. The only facts sent are the region, equipment, pressure and the rules text shown on screen. There is no free text input, so nothing a visitor types reaches the AI.
- Pages on the same github.io address share browser storage. Other sites on that address can read a remembered key, so keep the tick box off on shared computers.
- Use a key with a low spend limit and delete it in the Anthropic console when you finish testing.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 60 tests
npm run typecheck
```

## Publish on GitHub Pages (free)

The file `.github/workflows/pages.yml` builds and publishes the site every time you push to `main`. It reads the repository name and sets the base path itself, so any repository name works.

1. Create a new repository and upload the project files. If the `.github` folder does not arrive, add it with Add file, then Create new file, typing `.github/workflows/pages.yml` as the name.
2. Open Settings, then Pages. Under Build and deployment, set Source to GitHub Actions.
3. Open the Actions tab and wait for the green tick. The site address appears in the deploy step.

A site at the root of its own domain needs no base path. Run `npm run build` instead.

## Publish on Vercel (free tier)

1. Push this folder to a repository.
2. In Vercel select Add New, then Project, and import the repository.
3. Keep the default settings and deploy.

To embed it on another site:

```html
<iframe src="https://YOUR-SITE-ADDRESS/" width="100%" height="900" style="border:0" title="Boiler Parts Compliance Mapper"></iframe>
```
