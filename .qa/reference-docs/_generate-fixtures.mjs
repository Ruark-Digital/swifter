// Generates synthetic .docx fixtures for the docx-preview rewrite phase
// (Phase 02). Run from repo root:
//
//   node .qa/reference-docs/_generate-fixtures.mjs
//
// Produces:
//   .qa/reference-docs/sample-nda.docx          — short NDA-style contract
//   .qa/reference-docs/sample-with-table.docx   — contract with complex table
//
// Both docs are synthetic — no client data. Generated from public legal-
// template patterns + invented party names / dates / figures. Each
// exercises specific layout features the docx-preview pipeline must
// preserve. See sample-*.expected.md for per-doc feature checklists.
//
// Re-run anytime to regenerate from this script (e.g. after tweaking
// content to expose a new edge case). The .docx outputs are committed
// to the repo so test runs don't depend on this script executing.

import fs from "node:fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";

// ─────────────────────────────────────────────────────────────────────────────
// Fixture 1: short NDA (~2 pages)
// Exercises:
//   - Centered title block
//   - Numbered ordered list with multi-line items
//   - Bold/italic inline marks
//   - Default body styling (no exotic Word styles)
//   - Single explicit page break
// ─────────────────────────────────────────────────────────────────────────────

const ndaDoc = new Document({
  creator: "swifter test fixtures",
  title: "Mutual Non-Disclosure Agreement (sample)",
  description: "Synthetic NDA fixture for Phase 02 docx-preview rewrite testing.",
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "MUTUAL NON-DISCLOSURE AGREEMENT",
              bold: true,
              size: 32, // 16pt
            }),
          ],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("")] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "between", size: 22 })],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("")] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Acme Corporation Inc.", bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "and", size: 22 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Beta Industries Ltd.", bold: true, size: 24 })],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This Mutual Non-Disclosure Agreement (",
            }),
            new TextRun({ text: "“Agreement”", bold: true }),
            new TextRun({
              text: ") is entered into as of January 1, 2026 (the ",
            }),
            new TextRun({ text: "“Effective Date”", bold: true }),
            new TextRun({
              text: ") by and between Acme Corporation Inc. and Beta Industries Ltd. (each a ",
            }),
            new TextRun({ text: "“Party”", bold: true }),
            new TextRun({ text: " and collectively the " }),
            new TextRun({ text: "“Parties”", bold: true }),
            new TextRun({ text: ")." }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "1. Confidential Information" })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "“Confidential Information”", bold: true }),
            new TextRun({
              text: " means any information disclosed by one Party (the “Disclosing Party”) to the other Party (the “Receiving Party”), whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.",
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "2. Obligations" })],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "The Receiving Party agrees to:",
            }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "nda-obligations", level: 0 },
          children: [
            new TextRun({
              text: "Hold the Confidential Information in strict confidence and not disclose it to any third party without the prior written consent of the Disclosing Party.",
            }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "nda-obligations", level: 0 },
          children: [
            new TextRun({
              text: "Use the Confidential Information solely for the purpose of evaluating a potential business relationship between the Parties.",
            }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "nda-obligations", level: 0 },
          children: [
            new TextRun({
              text: "Take reasonable measures to protect the secrecy of the Confidential Information, no less than the measures used to protect its own confidential information of like importance.",
            }),
          ],
        }),
        new Paragraph({
          children: [new PageBreak()],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "3. Term and Termination" })],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This Agreement shall remain in effect for a period of three (3) years from the Effective Date, unless terminated earlier by mutual written agreement of the Parties. The confidentiality obligations under Section 2 shall survive termination for an additional period of five (5) years.",
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "4. Governing Law" })],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This Agreement shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to its conflict-of-laws principles.",
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          children: [
            new TextRun({
              text: "IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.",
              italics: true,
            }),
          ],
        }),
      ],
    },
  ],
  numbering: {
    config: [
      {
        reference: "nda-obligations",
        levels: [
          {
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixture 2: contract with complex table (~2-3 pages)
// Exercises:
//   - Multi-page layout with explicit page breaks
//   - Complex table with header row, varying column widths, multi-line cells
//   - Cell alignment variations (left, center, right)
//   - Heading hierarchy (h1, h2, h3)
//   - Inline bold/italic in cells
// ─────────────────────────────────────────────────────────────────────────────

const tableHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "f3f4f6", fill: "f3f4f6" },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Item #", bold: true })],
        }),
      ],
    }),
    new TableCell({
      width: { size: 40, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "f3f4f6", fill: "f3f4f6" },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Deliverable", bold: true })],
        }),
      ],
    }),
    new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "f3f4f6", fill: "f3f4f6" },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Due Date", bold: true })],
        }),
      ],
    }),
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "f3f4f6", fill: "f3f4f6" },
      children: [
        new Paragraph({
          alignment: AlignmentType.END,
          children: [new TextRun({ text: "Payment (CAD)", bold: true })],
        }),
      ],
    }),
  ],
});

const tableRowsData = [
  ["1", "Initial requirements specification document, including scope, deliverables, and acceptance criteria.", "Jan 15, 2026", "12,500.00"],
  ["2", "Architecture design document with system diagrams and technology stack rationale.", "Feb 1, 2026", "18,750.00"],
  ["3", "Phase 1 prototype demonstrating core user flows and data persistence.", "Mar 15, 2026", "37,500.00"],
  ["4", "Phase 2 production-ready release with full feature set and user documentation.", "May 1, 2026", "62,500.00"],
  ["5", "Acceptance testing report and remediation of all critical and high-severity defects.", "May 30, 2026", "18,750.00"],
  ["6", "Final delivery, knowledge transfer sessions, and 30-day post-launch support.", "Jun 30, 2026", "25,000.00"],
];

const tableBodyRows = tableRowsData.map(
  ([itemNo, deliverable, due, payment]) =>
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(itemNo)],
            }),
          ],
        }),
        new TableCell({
          children: [new Paragraph(deliverable)],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(due)],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.END,
              children: [new TextRun(payment)],
            }),
          ],
        }),
      ],
    })
);

const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const tableBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
  insideHorizontal: tableBorder,
  insideVertical: tableBorder,
};

const sowDoc = new Document({
  creator: "swifter test fixtures",
  title: "Statement of Work (sample)",
  description: "Synthetic SOW fixture exercising complex table layout.",
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "STATEMENT OF WORK #001", bold: true, size: 32 }),
          ],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("")] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Pursuant to Master Services Agreement dated October 1, 2025",
              italics: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "1. Engagement Summary" })],
        }),
        new Paragraph({
          children: [
            new TextRun(
              "This Statement of Work (the “SOW”) describes the deliverables, schedule, and compensation for the engagement between Acme Corporation Inc. (the “Client”) and Beta Industries Ltd. (the “Vendor”). All terms not defined herein have the meanings set forth in the Master Services Agreement."
            ),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "1.1 Scope of Work" })],
        }),
        new Paragraph({
          children: [
            new TextRun(
              "The Vendor shall design, develop, test, and deliver a custom data-analytics platform comprising the components described in the deliverables schedule below. All work shall be performed in accordance with the technical specifications attached as Schedule A."
            ),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "2. Deliverables and Payment Schedule" })],
        }),
        new Paragraph({
          children: [
            new TextRun(
              "Payments are due net-30 from invoice date upon Client acceptance of each deliverable. Late payments accrue interest at the rate set forth in Section 5.3 of the Master Services Agreement."
            ),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [tableHeaderRow, ...tableBodyRows],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total contract value: ",
              bold: true,
            }),
            new TextRun("CAD $175,000.00 (exclusive of applicable taxes)."),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "3. Acceptance Criteria" })],
        }),
        new Paragraph({
          children: [
            new TextRun(
              "Each deliverable shall be deemed accepted upon the earlier of (a) the Client's written confirmation of acceptance, or (b) the expiration of fifteen (15) business days following delivery without the Client's written notice of rejection. Rejected deliverables shall be remedied at no additional cost within thirty (30) days."
            ),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "3.1 Defect Severity" })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Critical:", bold: true }),
            new TextRun(
              " System unavailable or data integrity compromised. Remediation within 24 hours."
            ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "High:", bold: true }),
            new TextRun(
              " Major feature non-functional with no reasonable workaround. Remediation within 3 business days."
            ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Medium:", bold: true }),
            new TextRun(
              " Feature partially functional or workaround available. Remediation within 10 business days."
            ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Low:", bold: true }),
            new TextRun(
              " Cosmetic or minor functional issue. Remediation in next scheduled release."
            ),
          ],
        }),
      ],
    },
  ],
});

// Generate both files
const ndaBuf = await Packer.toBuffer(ndaDoc);
fs.writeFileSync(".qa/reference-docs/sample-nda.docx", ndaBuf);
console.log(`Wrote .qa/reference-docs/sample-nda.docx (${ndaBuf.length} bytes)`);

const sowBuf = await Packer.toBuffer(sowDoc);
fs.writeFileSync(".qa/reference-docs/sample-with-table.docx", sowBuf);
console.log(`Wrote .qa/reference-docs/sample-with-table.docx (${sowBuf.length} bytes)`);
