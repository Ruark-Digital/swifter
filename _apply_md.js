const fs = require('fs');
const path = 'docs/API_DOCUMENTATION_PHASE_2.md';
let md = fs.readFileSync(path, 'utf8');
const orig = md;

function replace(needle, repl, label) {
  if (!md.includes(needle)) { console.error('MISS:', label); process.exit(1); }
  md = md.replace(needle, repl);
}

// 1. Manager contracts at-a-glance — add /edit + AI redline
replace(
  "| `PUT`  | `/manager/contracts/{contractId}` | Update contract     | `procurement`, `contract_manager` |\n",
  "| `PUT`  | `/manager/contracts/{contractId}` | Update contract     | `procurement`, `contract_manager` |\n" +
  "| `POST` | `/manager/contracts/{contractId}/edit` | Edit contract (post-publish) | `procurement`, `contract_manager` |\n" +
  "| `POST` | `/manager/contracts/{contractId}/ai/redline-suggestions` | Get AI redline suggestions | `procurement`, `contract_manager` |\n",
  'manager contracts at-a-glance'
);

// 2. Remove manager ratesheets approve/status row
replace(
  "| `GET`  | `/manager/contracts/{contractId}/ratesheets/{rateSheetId}/approve/status` | Check manager approval    | `contract_manager`, `procurement`   |\n",
  "",
  'manager ratesheets approve/status'
);

// 3. Approver contracts — drop Compliance table
replace(
  "#### Compliance\n\n| Method | Path                                             | Description                   |\n| ------ | ------------------------------------------------ | ----------------------------- |\n| `GET`  | `/approver/contracts/{contractId}/compliance`    | Get contract compliance details |\n\n",
  "",
  'approver contracts compliance table'
);

// drop approver contracts ratesheet rows
replace(
  "| `GET`  | `/approver/contracts/{contractId}/lems/{lemId}/ratesheet`    | Get rate sheet for a LEM      |\n| `GET`  | `/approver/contracts/{contractId}/ratesheets`                | List contract rate sheets     |\n| `GET`  | `/approver/contracts/{contractId}/ratesheets/{rateSheetId}`  | Get rate sheet for detail     |\n",
  "",
  'approver contracts ratesheet rows'
);

// Add AI redline for approver contracts
replace(
  "| `GET`  | `/approver/contracts/payment-savings/{savingId}`       | Get saving details   |\n\n### MSA Contract Sub-Resource Endpoints (from Swagger)",
  "| `GET`  | `/approver/contracts/payment-savings/{savingId}`       | Get saving details   |\n\n#### AI\n\n| Method | Path | Description |\n| ------ | ---- | ----------- |\n| `POST` | `/approver/contracts/{contractId}/ai/redline-suggestions` | Get AI redline suggestions |\n\n### MSA Contract Sub-Resource Endpoints (from Swagger)",
  'approver contracts AI redline'
);

// 4. Approver MSA — remove compliance, add LEMs + AI
replace(
  "| `GET`  | `/approver/msa-contracts/{contractId}/compliance`           | Get MSA contract compliance details |\n",
  "",
  'approver msa compliance row'
);
replace(
  "| `POST` | `/approver/msa-contracts/{dataId}/rfi/{rfiId}/response`     | Create RFI response |\n\n***\n\n## 24. Approver — Dashboards",
  "| `POST` | `/approver/msa-contracts/{dataId}/rfi/{rfiId}/response`     | Create RFI response |\n" +
  "| `GET`  | `/approver/msa-contracts/{contractId}/lems`                 | List MSA contract LEMs |\n" +
  "| `GET`  | `/approver/msa-contracts/{contractId}/lems/{lemId}`         | Get MSA contract LEM details |\n" +
  "| `POST` | `/approver/msa-contracts/{contractId}/lems/{lemId}/approve` | Approve or reject a LEM |\n" +
  "| `GET`  | `/approver/msa-contracts/{contractId}/lems/{lemId}/approve/status` | Check LEM approval status |\n" +
  "| `POST` | `/approver/msa-contracts/{contractId}/ai/redline-suggestions` | Get AI redline suggestions |\n\n***\n\n## 24. Approver — Dashboards",
  'approver msa additions'
);

// 5. Vendor contracts — add payment-savings + AI
replace(
  "| `GET`   | `/vendor/contracts/{contractId}/payment-holdbacks`                          | List holdbacks            |\n| `GET`   | `/vendor/contracts/payment-holdbacks/{holdBackId}`                          | Holdback detail           |\n",
  "| `GET`   | `/vendor/contracts/{contractId}/payment-holdbacks`                          | List holdbacks            |\n" +
  "| `GET`   | `/vendor/contracts/payment-holdbacks/{holdBackId}`                          | Holdback detail           |\n" +
  "| `GET`   | `/vendor/contracts/{contractId}/payment-savings`                            | List savings              |\n" +
  "| `GET`   | `/vendor/contracts/payment-savings/{savingId}`                              | Saving detail             |\n" +
  "| `POST`  | `/vendor/contracts/{contractId}/ai/redline-suggestions`                     | Get AI redline suggestions |\n",
  'vendor contracts payment-savings + AI'
);

// 6. Vendor MSA — add changes, LEMs, ratesheets, AI
replace(
  "| `POST` | `/vendor/msa-contracts/{dataId}/rfi/{rfiId}/response`            | Create RFI response |\n",
  "| `POST` | `/vendor/msa-contracts/{dataId}/rfi/{rfiId}/response`            | Create RFI response |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/changes/stats`               | Get MSA contract change statistics |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/changes`                     | List MSA contract changes |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/changes/{changeId}/comment`  | Get MSA contract change comments |\n" +
  "| `POST` | `/vendor/msa-contracts/{contractId}/changes/{changeId}/comment`  | Add a comment to an MSA contract change |\n" +
  "| `POST` | `/vendor/msa-contracts/changes/{changeId}/comment/{commentId}/reply` | Reply to an MSA contract change comment |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/lems`                        | List MSA contract LEMs |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/lems/{lemId}`                | Get MSA contract LEM details |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/lems/{lemId}/ratesheet`      | Get rate sheet for an MSA LEM |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/ratesheets`                  | List MSA contract rate sheets |\n" +
  "| `GET`  | `/vendor/msa-contracts/{contractId}/ratesheets/{rateSheetId}`    | Get MSA rate sheet detail |\n" +
  "| `POST` | `/vendor/msa-contracts/{contractId}/ai/redline-suggestions`      | Get AI redline suggestions |\n",
  'vendor msa additions'
);

// 7. User compliance removals
replace(
  "| `GET`  | `/user/contracts/{contractId}/compliance`                            | Get contract compliance details |\n",
  "",
  'user contracts compliance'
);
md = md.replace(/\| `GET`  \| `\/user\/msa-contracts\/\{contractId\}\/compliance`[^\n]*\n/g, '');

// User contracts: add create-claim + AI
replace(
  "| `GET`  | `/user/contracts/rfi/{rfiId}`                                        | Get a specific RFI |\n",
  "| `GET`  | `/user/contracts/rfi/{rfiId}`                                        | Get a specific RFI |\n" +
  "| `POST` | `/user/contracts/{contractId}/claims`                                | Create a contract claim |\n" +
  "| `POST` | `/user/contracts/{contractId}/ai/redline-suggestions`                | Get AI redline suggestions |\n",
  'user contracts AI redline'
);

// User MSA: add LEMs + AI
replace(
  "| `GET`  | `/user/msa-contracts/{contractId}/rfi`                                | List contract RFIs |",
  "| `GET`  | `/user/msa-contracts/{contractId}/lems`                               | List MSA contract LEMs |\n" +
  "| `GET`  | `/user/msa-contracts/{contractId}/lems/{lemId}`                       | Get MSA contract LEM details |\n" +
  "| `POST` | `/user/msa-contracts/{contractId}/ai/redline-suggestions`             | Get AI redline suggestions |\n" +
  "| `GET`  | `/user/msa-contracts/{contractId}/rfi`                                | List contract RFIs |",
  'user msa additions'
);

// 8. Top-level file-comment section
replace(
  "## Common Response Codes",
  "## File Comments (Shared)\n\n| Method | Path | Description |\n| ------ | ---- | ----------- |\n| `GET`  | `/file-comment/{fileId}` | List comments attached to a file (cross-role) |\n\nResponse shape: `{ data: { comments: [...] } }`. Rich comments use the `__ct__` sentinel field for ProseMirror payload.\n\n***\n\n## Common Response Codes",
  'file-comment section'
);

// 9. Manager MSA additions block
replace(
  "### POST `/manager/msa-contracts` — Create MSA Contract",
  "Additional manager MSA endpoints:\n\n| Method | Path | Description |\n| ------ | ---- | ----------- |\n| `POST` | `/manager/msa-contracts/{contractId}/edit` | Edit MSA contract (post-publish) |\n| `POST` | `/manager/msa-contracts/{contractId}/ai/redline-suggestions` | Get AI redline suggestions |\n| `GET`  | `/manager/msa-contracts/{contractId}/lems` | List MSA contract LEMs |\n| `GET`  | `/manager/msa-contracts/{contractId}/lems/{lemId}` | Get MSA contract LEM details |\n| `POST` | `/manager/msa-contracts/{contractId}/lems/{lemId}/approve` | Approve or reject a LEM |\n| `GET`  | `/manager/msa-contracts/{contractId}/lems/{lemId}/approve/status` | Check LEM approval status |\n| `GET`  | `/manager/msa-contracts/{contractId}/lems/{lemId}/ratesheet` | Get rate sheet for an MSA LEM |\n| `GET`  | `/manager/msa-contracts/{contractId}/ratesheets` | List MSA contract rate sheets |\n| `GET`  | `/manager/msa-contracts/{contractId}/ratesheets/{rateSheetId}` | Get MSA rate sheet detail |\n| `POST` | `/manager/msa-contracts/{contractId}/ratesheets/{rateSheetId}/approve` | Approve or reject a rate sheet |\n\n***\n\n### POST `/manager/msa-contracts` — Create MSA Contract",
  'manager msa additions'
);

console.log('changed bytes:', md.length - orig.length);
fs.writeFileSync(path, md);
