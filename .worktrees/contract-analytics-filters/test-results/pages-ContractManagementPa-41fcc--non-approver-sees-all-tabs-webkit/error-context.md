# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - heading "Oops, Something went wrong here..." [level=1] [ref=e6]:
      - text: Oops,
      - text: Something went wrong here...
    - paragraph [ref=e7]: "Oh no, there's an issue with the app.items.map is not a function. (In 'items.map((it) => ({ id: it?.deliverableId ?? \"-\", title: it?.title ?? \"-\", dueDate: it?.date ?? it?.dueDate ?? \"-\", // submissionDate: it?.submissionDate ?? \"\", submissionStatus: it?.submissionStatus === \"submitted\" ? \"Submitted\" : it?.submissionStatus === \"late\" ? \"Late\" : \"Pending\", kpi: it?.kpi?.kpiText ?? it?.kpi ?? \"-\", status: it?.status === \"approved\" ? \"Approved\" : it?.status === \"rejected\" ? \"Rejected\" : it?.status === \"pending\" ? \"Pending\" : \"Under Review\" }))', 'items.map' is undefined)"
    - link "Home" [ref=e8]:
      - /url: /
  - region "Notifications (F8)":
    - list
```