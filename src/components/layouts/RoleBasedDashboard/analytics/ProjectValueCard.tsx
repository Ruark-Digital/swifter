import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  name: string;
  value: number;
  contractCount?: number;
};

type Props = {
  rows?: Row[];
};

export const ProjectValueCard: React.FC<Props> = ({ rows }) => {
  const data = (rows && rows.length > 0
    ? rows
    : [
        { name: "City Hall Renovation", value: 2200000, contractCount: 3 },
        { name: "Warehouse Expansion", value: 1800000, contractCount: 2 },
      ]
  ).map((r) => ({
    name: r.name,
    valueM: r.value / 1_000_000,
    contractCount: r.contractCount ?? 0,
  }));

  const max = Math.max(0, ...data.map((d) => d.valueM));
  const domainMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;
  const axis = Array.from({ length: 11 }).map((_, i) =>
    Math.round((domainMax / 10) * i)
  );
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
            Contract Value by Project
          </CardTitle>
          <div className="inline-flex items-center gap-2 border border-[#E5E7EB] dark:border-slate-700 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-[#6B6B6B] dark:text-slate-400">Top 10</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-[#E5E7EB] dark:bg-slate-700" />
          </div>
        </div>
        <Tabs value="ytd" className="w-full">
          {/* Horizontal scroll on overflow; `!flex-none shrink-0` defeats
              shadcn TabsTrigger's baked-in `flex-1` so pills don't stretch. */}
          <TabsList className="bg-transparent p-0 gap-2 flex overflow-x-auto h-auto w-full justify-start">
            <TabsTrigger
              className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold bg-[#F0F0F0] text-[#2A4467] dark:bg-slate-800 dark:text-slate-100 data-[state=active]:bg-[#F0F0F0] data-[state=active]:dark:bg-slate-800"
              value="ytd"
            >
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger
                key={t}
                value={t.replace(/\s+/g, "")}
                className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-5 flex-1 min-h-0 overflow-y-auto">
        {data.map((row, idx) => {
          const pct =
            domainMax > 0
              ? Math.min(100, Math.max(0, Math.round((row.valueM / domainMax) * 100)))
              : 0;
          return (
            <div key={idx} className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{row.name}</p>
                <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">
                  ${row.valueM.toFixed(1)}M
                </p>
              </div>
              <div className="w-full h-2.5 bg-[#DDDDDD] dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-2.5 bg-[#43A047] rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {idx === 2 && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl p-2 w-[150px] shadow">
                  <p className="text-[14px] font-medium text-[#0F0F0F] dark:text-slate-100">
                    {row.name}
                  </p>
                  <p className="text-[12px] text-[#6B6B6B] dark:text-slate-400">
                    {row.contractCount}{" "}
                    {row.contractCount === 1 ? "Contract" : "Contracts"}
                  </p>
                  <p className="text-[12px] text-[#6B6B6B] dark:text-slate-400">
                    ${row.valueM.toFixed(1)}M
                  </p>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between">
          {axis.map((n) => (
            <span key={n} className="text-[12px] font-semibold text-[#475467] dark:text-slate-400">
              {n}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
