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

export type SecurityMetrics = {
  totalPermissions: number;
  requiredPermissions: number;
  excludedPermissions: number;
  controlPlanePermissions: number;
  dataPlanePermissions: number;
  highRiskPermissions: number;
  mediumRiskPermissions: number;
  lowRiskPermissions: number;
  deletePermissions: number;
  rbacPermissions: number;
  wildcardPermissions: number;
};

export function analyzeScenario(scenario: Scenario) {
  /*
   * ---------------------------------------------------------
   * 1. CLASSIFY PERMISSIONS
   * ---------------------------------------------------------
   */

  const actions = scenario.permissions.filter(
    p => p.kind === "Action"
  );

  const dataActions = scenario.permissions.filter(
    p => p.kind === "DataAction"
  );

  const notActions = scenario.permissions.filter(
    p => p.kind === "NotAction"
  );

  const notDataActions = scenario.permissions.filter(
    p => p.kind === "NotDataAction"
  );

  /*
   * ---------------------------------------------------------
   * 2. SECURITY FINDINGS
   * ---------------------------------------------------------
   */

  const findings: Finding[] = [];

  // Wildcard detection
  if (scenario.broadPermissions.length > 0) {
    findings.push({
      severity: "high",
      title: "Broad wildcard permissions detected",
      detail:
        "The scenario is associated with namespace-wide permissions. Prefer task-specific Azure actions whenever the exact operation is known."
    });
  }

  // High-risk required actions
  const highRiskActions = actions.filter(
    p => p.risk === "high"
  );

  if (highRiskActions.length > 0) {
    findings.push({
      severity: "high",
      title: "High-risk permissions require review",
      detail:
        `${highRiskActions.length} required permission(s) have high security impact. Keep them only when they are directly required by the operational task.`
    });
  }

  // Delete operations
  const deletePermissions = scenario.permissions.filter(
    p => p.name.toLowerCase().includes("/delete")
  );

  if (deletePermissions.length > 0) {
    findings.push({
      severity: "high",
      title: "Delete operation detected",
      detail:
        "Delete permissions can cause irreversible resource or data changes. Verify that deletion is explicitly required."
    });
  }

  // RBAC operations
  const rbacPermissions = scenario.permissions.filter(
    p =>
      p.name.startsWith("Microsoft.Authorization/") ||
      p.name.toLowerCase().includes("roleassignments")
  );

  if (rbacPermissions.length > 0) {
    findings.push({
      severity: "high",
      title: "RBAC permission detected",
      detail:
        "Role-assignment permissions can change who has access to Azure resources. They should normally be separated from operational permissions."
    });
  }

  // Explicit exclusions
  if (notActions.length + notDataActions.length > 0) {
    findings.push({
      severity: "medium",
      title: "Explicit exclusions found",
      detail:
        "The generated role records operations outside the requested task, making the intended security boundary easier to review."
    });
  }

  // Data plane analysis
  if (dataActions.length === 0 && actions.length > 0) {
    findings.push({
      severity: "low",
      title: "No DataActions required",
      detail:
        "This scenario currently uses management/control-plane permissions only. Review data-plane permissions separately if direct data access is required."
    });
  }

  // Read-only detection
  const writePermissions = actions.filter(
    p =>
      p.name.toLowerCase().includes("/write") ||
      p.name.toLowerCase().includes("/action") ||
      p.name.toLowerCase().includes("/delete")
  );

  if (
    writePermissions.length === 0 &&
    actions.length > 0 &&
    dataActions.length === 0
  ) {
    findings.push({
      severity: "low",
      title: "Read-oriented role detected",
      detail:
        "The current required permissions appear to be primarily read operations."
    });
  }

  /*
   * ---------------------------------------------------------
   * 3. SECURITY METRICS
   * ---------------------------------------------------------
   */

  const highRiskPermissions = scenario.permissions.filter(
    p => p.risk === "high"
  ).length;

  const mediumRiskPermissions = scenario.permissions.filter(
    p => p.risk === "medium"
  ).length;

  const lowRiskPermissions = scenario.permissions.filter(
    p => p.risk === "low"
  ).length;

  const wildcardPermissions = scenario.broadPermissions.length;

  const metrics: SecurityMetrics = {
    totalPermissions: scenario.permissions.length,

    requiredPermissions:
      actions.length + dataActions.length,

    excludedPermissions:
      notActions.length + notDataActions.length,

    controlPlanePermissions:
      actions.length,

    dataPlanePermissions:
      dataActions.length,

    highRiskPermissions,

    mediumRiskPermissions,

    lowRiskPermissions,

    deletePermissions:
      deletePermissions.length,

    rbacPermissions:
      rbacPermissions.length,

    wildcardPermissions
  };

  /*
   * ---------------------------------------------------------
   * 4. GENERATE AZURE CUSTOM ROLE
   * ---------------------------------------------------------
   */

  const assignableScope =
    scenario.scope === "Subscription"
      ? "/subscriptions/<subscription-id>"
      : scenario.scope === "Resource Group"
        ? "/subscriptions/<subscription-id>/resourceGroups/<resource-group>"
        : "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/<resource-provider>/<resource>";

  const role: RoleDefinition = {
    Name: `RoleGuard ${scenario.name}`,

    IsCustom: true,

    Description: scenario.description,

    Actions: actions.map(
      p => p.name
    ),

    NotActions: notActions.map(
      p => p.name
    ),

    DataActions: dataActions.map(
      p => p.name
    ),

    NotDataActions: notDataActions.map(
      p => p.name
    ),

    AssignableScopes: [
      assignableScope
    ]
  };

  /*
   * ---------------------------------------------------------
   * 5. RISK SCORE
   * ---------------------------------------------------------
   */

  let riskScore = 0;

  riskScore +=
    highRiskPermissions * 25;

  riskScore +=
    mediumRiskPermissions * 10;

  riskScore +=
    wildcardPermissions * 20;

  riskScore +=
    deletePermissions.length * 15;

  riskScore +=
    rbacPermissions.length * 20;

  riskScore = Math.min(
    100,
    riskScore
  );

  /*
   * ---------------------------------------------------------
   * 6. RETURN COMPLETE ANALYSIS
   * ---------------------------------------------------------
   */

  return {
    role,

    findings,

    actions,

    dataActions,

    notActions,

    notDataActions,

    metrics,

    riskScore,

    permissionCount:
      actions.length +
      dataActions.length
  };
}

/*
 * ---------------------------------------------------------
 * PERMISSION LABEL
 * ---------------------------------------------------------
 */

export function permissionLabel(
  permission: Permission
) {
  if (
    permission.kind === "Action"
  ) {
    return "Control Action";
  }

  if (
    permission.kind === "DataAction"
  ) {
    return "Data Action";
  }

  if (
    permission.kind === "NotAction"
  ) {
    return "Excluded Action";
  }

  return "Excluded Data Action";
}
