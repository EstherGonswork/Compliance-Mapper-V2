import { COPY } from "@/data/copy";
import { REGIONS } from "@/data/rules";
import { glanceRows } from "@/lib/compare";
import type { EngineOutput, RegionId } from "@/lib/types";

interface Props {
  a: { region: RegionId; output: EngineOutput };
  b: { region: RegionId; output: EngineOutput };
}

export function CompareGlance({ a, b }: Props) {
  const rows = glanceRows(a.output, b.output);
  return (
    <section className="bt-glance" aria-labelledby="bt-glance-title">
      <h3 id="bt-glance-title">{COPY.glance.title}</h3>
      <div className="bt-table-wrap">
        <table>
          <caption className="bt-sr">{COPY.glance.caption}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="bt-sr">Item</span>
              </th>
              <th scope="col">
                {REGIONS[a.region].flag} {REGIONS[a.region].name}
              </th>
              <th scope="col">
                {REGIONS[b.region].flag} {REGIONS[b.region].name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>{r.a}</td>
                <td>{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
