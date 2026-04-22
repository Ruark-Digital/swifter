import { Card, CardContent } from "@/components/ui/card";

export type StatCardProps = {
  title: string;
  value: number;
  icon: any;
  iconColor?: string;
  iconBgColor?: string;
  onClick?: () => void;
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-gray-500",
  iconBgColor = "bg-gray-100",
  onClick,
}: StatCardProps) => {
  // Enhanced icon background colors for dark mode
  const getDarkModeIconBg = (bgColor: string) => {
    const darkModeMap: { [key: string]: string } = {
      'bg-gray-100': 'dark:bg-gray-800',
      'bg-green-100': 'dark:bg-green-900/30',
      'bg-red-100': 'dark:bg-red-900/30',
      'bg-yellow-100': 'dark:bg-yellow-900/30',
    };
    return darkModeMap[bgColor] || 'dark:bg-gray-800';
  };

  // Enhanced icon colors for dark mode
  const getDarkModeIconColor = (color: string) => {
    const darkModeMap: { [key: string]: string } = {
      'text-gray-600': 'dark:text-gray-400',
      'text-green-600': 'dark:text-green-400',
      'text-red-600': 'dark:text-red-400',
      'text-yellow-600': 'dark:text-yellow-400',
    };
    return darkModeMap[color] || 'dark:text-gray-400';
  };

  return (
    <Card 
      className={`p-6 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.08]' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${iconBgColor} ${getDarkModeIconBg(iconBgColor)}`}>
            <Icon className={`h-6 w-6 ${iconColor} ${getDarkModeIconColor(iconColor)}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};