export type PermissionKind = "Action" | "DataAction" | "NotAction" | "NotDataAction";

export type Permission = {
  name: string;
  kind: PermissionKind;
  reason: string;
  risk?: "low" | "medium" | "high";
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  task: string;
  scope: "Resource" | "Resource Group" | "Subscription";
  permissions: Permission[];
  broadPermissions: string[];
};

export const scenarios: Scenario[] = [
  {
    id: "backup",
    name: "Backup Operator",
    description: "Perform backup and restore operations without deletion, policy management, or role assignment.",
    task: "I need a backup operator who can view backup status, run backups and restore recovery points, but cannot delete backups, change policies, or assign roles.",
    scope: "Resource Group",
    permissions: [
      {
        name: "Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems/read",
        kind: "Action",
        reason: "Read protected item and backup state.",
        risk: "low"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems/backup/action",
        kind: "Action",
        reason: "Allows an operator to trigger a backup operation.",
        risk: "medium"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems/recoveryPoints/restore/action",
        kind: "Action",
        reason: "Allows restoring a selected recovery point.",
        risk: "medium"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupJobs/read",
        kind: "Action",
        reason: "Allows viewing backup job status.",
        risk: "low"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupOperationResults/read",
        kind: "Action",
        reason: "Allows viewing operation results.",
        risk: "low"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems/delete",
        kind: "NotAction",
        reason: "Deletion is explicitly outside the task.",
        risk: "high"
      },
      {
        name: "Microsoft.RecoveryServices/vaults/backupPolicies/delete",
        kind: "NotAction",
        reason: "Policy deletion is not required.",
        risk: "high"
      },
      {
        name: "Microsoft.Authorization/roleAssignments/write",
        kind: "NotAction",
        reason: "Role assignment is unrelated to backup operations.",
        risk: "high"
      }
    ],
    broadPermissions: [
      "Microsoft.RecoveryServices/*",
      "Microsoft.Authorization/*"
    ]
  },
  {
    id: "vm-restart",
    name: "VM Restart Operator",
    description: "Restart selected VMs without changing networking, disks, identities, or RBAC.",
    task: "Allow an operator to read VM state and restart virtual machines, but do not allow delete, network changes, or role assignment.",
    scope: "Resource",
    permissions: [
      {
        name: "Microsoft.Compute/virtualMachines/read",
        kind: "Action",
        reason: "Read VM metadata and state.",
        risk: "low"
      },
      {
        name: "Microsoft.Compute/virtualMachines/restart/action",
        kind: "Action",
        reason: "Allows restarting a VM.",
        risk: "medium"
      },
      {
        name: "Microsoft.Compute/virtualMachines/delete",
        kind: "NotAction",
        reason: "VM deletion is not part of the task.",
        risk: "high"
      },
      {
        name: "Microsoft.Network/*",
        kind: "NotAction",
        reason: "Network administration is unrelated to restarting a VM.",
        risk: "high"
      },
      {
        name: "Microsoft.Authorization/roleAssignments/write",
        kind: "NotAction",
        reason: "RBAC changes are unrelated to the operational task.",
        risk: "high"
      }
    ],
    broadPermissions: [
      "Microsoft.Compute/*",
      "Microsoft.Network/*",
      "Microsoft.Authorization/*"
    ]
  },
  {
    id: "storage-reader",
    name: "Storage Reader",
    description: "Inspect storage resources without changing or deleting data.",
    task: "Create a read-only storage operator who can inspect storage account metadata and configuration but cannot modify resources.",
    scope: "Resource Group",
    permissions: [
      {
        name: "Microsoft.Storage/storageAccounts/read",
        kind: "Action",
        reason: "Read storage account metadata.",
        risk: "low"
      },
      {
        name: "Microsoft.Storage/storageAccounts/listKeys/action",
        kind: "Action",
        reason: "Optional demo permission: included to show that sensitive read-like operations should be reviewed separately.",
        risk: "high"
      },
      {
        name: "Microsoft.Storage/storageAccounts/write",
        kind: "NotAction",
        reason: "Resource changes are not required.",
        risk: "high"
      },
      {
        name: "Microsoft.Storage/storageAccounts/delete",
        kind: "NotAction",
        reason: "Deletion is not required.",
        risk: "high"
      }
    ],
    broadPermissions: [
      "Microsoft.Storage/*"
    ]
  },
  {
    id: "monitoring",
    name: "Monitoring Operator",
    description: "View monitoring information without changing alert rules or resources.",
    task: "Allow an operator to inspect Azure Monitor metrics and activity information without changing alerts or resources.",
    scope: "Resource Group",
    permissions: [
      {
        name: "Microsoft.Insights/metrics/read",
        kind: "Action",
        reason: "Read resource metrics.",
        risk: "low"
      },
      {
        name: "Microsoft.Insights/diagnosticSettings/read",
        kind: "Action",
        reason: "Inspect diagnostic configuration.",
        risk: "low"
      },
      {
        name: "Microsoft.Insights/alertRules/read",
        kind: "Action",
        reason: "Inspect alert rules.",
        risk: "low"
      },
      {
        name: "Microsoft.Insights/alertRules/write",
        kind: "NotAction",
        reason: "Changing alerts is outside the read-only monitoring task.",
        risk: "high"
      }
    ],
    broadPermissions: [
      "Microsoft.Insights/*"
    ]
  }
];