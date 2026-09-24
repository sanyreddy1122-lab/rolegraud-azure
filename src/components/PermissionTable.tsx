import type { Permission } from "../data/scenarios";
import { permissionLabel } from "../engine/analyzer";

export default function PermissionTable({ permissions }: { permissions: Permission[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Type</th>
            <th>Risk</th>
            <th>Why?</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((p, i) => (
            <tr key={`${p.name}-${i}`}>
              <td><code>{p.name}</code></td>
              <td>
                <span className={`badge ${p.kind.toLowerCase()}`}>
                  {permissionLabel(p)}
                </span>
              </td>
              <td>
                <span className={`risk ${p.risk ?? "low"}`}>{p.risk ?? "low"}</span>
              </td>
              <td>{p.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}