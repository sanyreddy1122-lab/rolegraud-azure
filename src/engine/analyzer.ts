import type { Permission, Scenario } from "../data/scenarios";

export type RoleDefinition = {
  Name: string;
  IsCustom: true;
  Description: string;
  Actions: string[];
  NotActions: string[];
  DataActions: string[];
  NotDataActions: string[];
  AssignableScopes: string[];
};

export type Finding = {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export function analyzeScenario(scenario: Scenario) {
  const actions = scenario.permissions.filter(p => p.kind === "Action");
  const dataActions = scenario.permissions.filter(p => p.kind === "DataAction");
  const notActions = scenario.permissions.filter(p => p.kind === "NotAction");
  const notDataActions = scenario.permissions.filter(p => p.kind === "NotDataAction");

  const findings: Finding[] = [];

  if (scenario.broadPermissions.some(p => p.endsWith("/*"))) {
    findings.push({
      severity: "high",
      title: "Broad wildcard permission detected",
      detail: "Prefer task-specific actions instead of namespace-wide wildcards when the exact operations are known."
    });
  }

  if (scenario.permissions.some(p => p.risk === "high" && p.kind === "Action")) {
    findings.push({
      severity: "high",
      title: "Sensitive action requires review",
      detail: "This action can expose secrets or materially change access. Keep it only when the operational requirement explicitly needs it."
    });
  }

  if (notActions.length + notDataActions.length > 0) {
    findings.push({
      severity: "medium",
      title: "Explicit exclusions found",
      detail: "The generated role records operations that are outside the requested task so reviewers can see the security boundary."
    });
  }

  if (dataActions.length === 0 && dataActions.length + actions.length > 0) {
    findings.push({
      severity: "low",
      title: "No DataActions required",
      detail: "The demo scenario is primarily management/control-plane access. Review data-plane permissions separately if the workload needs direct data access."
    });
  }

  const role: RoleDefinition = {
    Name: `RoleGuard ${scenario.name}`,
    IsCustom: true,
    Description: scenario.description,
    Actions: actions.map(p => p.name),
    NotActions: notActions.map(p => p.name),
    DataActions: dataActions.map(p => p.name),
    NotDataActions: notDataActions.map(p => p.name),
    AssignableScopes: [
      scenario.scope === "Subscription"
        ? "/subscriptions/<subscription-id>"
        : scenario.scope === "Resource Group"
          ? "/subscriptions/<subscription-id>/resourceGroups/<resource-group>"
          : "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/<resource-provider>/<resource>"
    ]
  };

  const riskScore = Math.min(
    100,
    actions.filter(p => p.risk === "high").length * 30 +
    actions.filter(p => p.risk === "medium").length * 12 +
    (scenario.broadPermissions.length ? 25 : 0)
  );

  return {
    role,
    findings,
    actions,
    dataActions,
    notActions,
    notDataActions,
    riskScore,
    permissionCount: actions.length + dataActions.length
  };
}

export function permissionLabel(permission: Permission) {
  if (permission.kind === "Action") return "Control Action";
  if (permission.kind === "DataAction") return "Data Action";
  if (permission.kind === "NotAction") return "Excluded Action";
  return "Excluded Data Action";
}