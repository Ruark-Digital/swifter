import { Card, CardContent } from "@/components/ui/card";

export type StatCardProps = {
  title: string;
  value: number;
  icon: any;
  iconColor?: string;
  iconBgColor?: string;
  onClick?: () => void;
  isActive?: boolean;
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-gray-500",
  iconBgColor = "bg-gray-100",
  onClick,
  isActive = false,
}: StatCardProps) => {
  return (
    <Card 
      className={`p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.08]' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${
              isActive ? ' dark:text-blue-300' : 'text-muted-foreground'
            }`}>{title}</p>
            <p className={`text-2xl font-bold ${
              isActive ? 'dark:text-blue-200' : 'text-muted'
            }`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};