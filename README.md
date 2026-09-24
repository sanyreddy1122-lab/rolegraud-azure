# RoleGuard — Azure Least-Privilege RBAC

A 2-day hackathon starter for the problem:

- Required Azure actions are discovered through trial and error.
- Control-plane actions and data-plane actions are confused.
- Operators keep unnecessary standing permissions.

## What is included

- React + TypeScript + Vite frontend
- Four deterministic demo scenarios
- Permission classification: Actions / DataActions / exclusions
- Wildcard/broad-permission review
- Scope recommendation
- Azure custom-role JSON export
- Copy/download buttons
- Azure Static Web Apps deployment workflow
- No paid dependency and no database required

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Build

```bash
npm run build
```

## Deploy to Azure Static Web Apps

1. Push this repository to GitHub.
2. Create an Azure Static Web App using the Free plan.
3. Connect the GitHub repository.
4. Set the app location to `/`.
5. Set the output location to `dist`.
6. Azure will create/configure a GitHub Actions workflow.

A workflow template is also included under `.github/workflows/`.

## Important security note

This is a hackathon prototype. The permission examples are curated demo mappings, not a substitute for Microsoft's current Azure RBAC permission catalog. Before production use, verify every action/data action and test the resulting custom role in a non-production subscription.

## Suggested next feature

Add an Azure Function:

`POST /api/analyze-role`

Input:

```json
{
  "task": "Allow backup and restore but not deletion"
}
```

Then use a curated permission catalog and explicit user confirmation before creating a real Azure custom role.

## 3-minute demo

1. Select `Backup Operator`.
2. Explain the task in the text box.
3. Click `Generate role`.
4. Show Control Actions vs Data Actions.
5. Show the security findings.
6. Show the narrow scope.
7. Click `Copy JSON` or `Download`.
8. Explain that the next version can connect the exported definition to Azure RBAC after explicit confirmation.
