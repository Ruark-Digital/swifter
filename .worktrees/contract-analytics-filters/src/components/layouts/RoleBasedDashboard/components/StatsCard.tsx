/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Stats Card Component
interface CardStatsProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

type IconMapKey =
  | "folder"
  | "folder-open"
  | "clock"
  | "check"
  | "mail"
  | "check-circle"
  | "user"
  | "x-circle"
  | "building"
  | "users"
  | "award"
  | "building-clock"
  | "creditCard"
  | "file";

// Icon components mapping
export const IconMap: Record<
  IconMapKey,
  React.ComponentType<{ className?: string }>
> = {
  folder: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M23.4845 36.0001H22.2084C17.3961 36.0001 14.99 36.0001 13.495 34.1451C12 32.2901 12 29.3045 12 23.3334V19.4628C12 17.162 12 16.0115 12.3882 15.1483C12.665 14.5329 13.0742 14.0252 13.5701 13.6818C14.2658 13.2001 15.193 13.2001 17.0473 13.2001C18.2353 13.2001 18.8293 13.2001 19.3493 13.442C20.5365 13.9944 21.0261 15.3326 21.5618 16.662L22.2084 18.2667M18.005 18.2667H28.2584C30.409 18.2667 31.4843 18.2667 32.2568 18.9072C32.5912 19.1844 32.8783 19.5407 33.1017 19.9556C33.4497 20.6017 33.5631 21.4187 33.6 22.7001"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  "folder-open": ({ className }) => (
    <svg
      // width="30"
      // height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...{ className }}
    >
      <path
        d="M14.4845 26H13.2084C8.39613 26 5.98998 26 4.49499 24.145C3 22.29 3 19.3044 3 13.3333V9.4627C3 7.16183 3 6.0114 3.38824 5.14816C3.665 4.53282 4.0742 4.02508 4.57012 3.68169C5.26583 3.19995 6.19299 3.19995 8.04733 3.19995C9.23533 3.19995 9.82933 3.19995 10.3493 3.44189C11.5365 3.9943 12.0261 5.33248 12.5618 6.66191L13.2084 8.26662M9.00496 8.26662H19.2584C21.409 8.26662 22.4843 8.26662 23.2568 8.90703C23.5912 9.18428 23.8783 9.54053 24.1017 9.95545C24.4497 10.6016 24.5631 11.4185 24.6 12.7"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M6.11467 15.8907C6.63226 14.5117 6.89106 13.8222 7.39612 13.3892C8.21139 12.6903 9.38353 12.8074 10.388 12.8074H21.3028C24.275 12.8074 25.7611 12.8074 26.5027 13.7637C27.7756 15.4054 26.2738 18.0683 25.6689 19.6799C24.5844 22.5692 24.0422 24.0139 22.9622 24.895C21.3166 26.2376 18.9228 25.9803 16.9367 25.9803H12.5246C8.273 25.9803 6.14718 25.9803 5.04167 24.664C3.00085 22.2341 5.19681 18.336 6.11467 15.8907Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  ),
  clock: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 18v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  check: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M16 24l6 6 12-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  mail: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <rect
        x="12"
        y="16"
        width="24"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 18l12 8 12-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "check-circle": ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 24l3 3 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "x-circle": ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l8 8M28 20l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  building: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <rect
        x="14"
        y="12"
        width="20"
        height="24"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="18" y="16" width="2" height="2" fill="currentColor" />
      <rect x="22" y="16" width="2" height="2" fill="currentColor" />
      <rect x="26" y="16" width="2" height="2" fill="currentColor" />
      <rect x="18" y="20" width="2" height="2" fill="currentColor" />
      <rect x="22" y="20" width="2" height="2" fill="currentColor" />
      <rect x="26" y="20" width="2" height="2" fill="currentColor" />
    </svg>
  ),
  users: ({ className }) => (
    <svg
      // width="30"
      // height="29"
      className={className}
      viewBox="0 0 30 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_2346_28986)">
        <path
          d="M25.8249 21.5998C26.7241 21.5998 27.4393 21.034 28.0814 20.2428C29.396 18.6232 27.2377 17.3288 26.4145 16.6949C25.5777 16.0506 24.6434 15.6855 23.6961 15.5998M22.4961 13.1998C24.1529 13.1998 25.4961 11.8567 25.4961 10.1998C25.4961 8.54297 24.1529 7.19983 22.4961 7.19983"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <path
          d="M4.76685 21.5998C3.86769 21.5998 3.1525 21.034 2.51036 20.2428C1.19581 18.6232 3.35411 17.3288 4.17728 16.6949C5.01407 16.0506 5.9484 15.6855 6.8957 15.5998M7.4957 13.1998C5.83885 13.1998 4.4957 11.8567 4.4957 10.1998C4.4957 8.54297 5.83885 7.19983 7.4957 7.19983"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <path
          d="M10.5957 18.1334C9.36955 18.8915 6.1547 20.4396 8.11276 22.3768C9.06925 23.3231 10.1345 23.9999 11.4739 23.9999H19.1164C20.4557 23.9999 21.521 23.3231 22.4775 22.3768C24.4355 20.4396 21.2207 18.8915 19.9946 18.1334C17.1193 16.3555 13.4709 16.3555 10.5957 18.1334Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M19.4957 8.99968C19.4957 11.3193 17.6153 13.1997 15.2957 13.1997C12.9761 13.1997 11.0957 11.3193 11.0957 8.99968C11.0957 6.68009 12.9761 4.79968 15.2957 4.79968C17.6153 4.79968 19.4957 6.68009 19.4957 8.99968Z"
          stroke="currentColor"
          stroke-width="1.8"
        />
      </g>
      <defs>
        <clipPath id="clip0_2346_28986">
          <rect
            width="28.8"
            height="28.8"
            fill="white"
            transform="translate(0.897461)"
          />
        </clipPath>
      </defs>
    </svg>
  ),
  award: ({ className }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect
        width="48"
        height="48"
        rx="24"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 26l-2 10 8-4 8 4-2-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "building-clock": ({ className }) => (
    <svg
      // width="30"
      // height="29"
      className={className}
      viewBox="0 0 30 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.6301 2.40015H7.43008C4.45168 2.40015 3.83008 3.02175 3.83008 6.00015V26.4001H18.2301V6.00015C18.2301 3.02175 17.6085 2.40015 14.6301 2.40015Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path
        d="M21.8305 9.6001H18.2305V26.4001H25.4305V13.2001C25.4305 10.2217 24.8089 9.6001 21.8305 9.6001Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path
        d="M9.83105 7.19995L12.2311 7.19995M9.83105 10.8L12.2311 10.8M9.83105 14.4L12.2311 14.4"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14.0313 26.3998V21.5998C14.0313 20.4685 14.0313 19.9028 13.6798 19.5513C13.3283 19.1998 12.7626 19.1998 11.6313 19.1998H10.4313C9.29988 19.1998 8.73419 19.1998 8.38272 19.5513C8.03125 19.9028 8.03125 20.4685 8.03125 21.5998V26.3998"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  ),
  user: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 30 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.45911 18.5777C6.76138 19.5886 2.31005 21.6527 5.02121 24.2357C6.34559 25.4974 7.8206 26.3998 9.67506 26.3998H20.257C22.1114 26.3998 23.5864 25.4974 24.9108 24.2357C27.622 21.6527 23.1706 19.5886 21.4729 18.5777C17.4918 16.2072 12.4402 16.2072 8.45911 18.5777Z"
        stroke="#2A4467"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M20.3654 7.79978C20.3654 10.7821 17.9478 13.1998 14.9654 13.1998C11.9831 13.1998 9.56543 10.7821 9.56543 7.79978C9.56543 4.81744 11.9831 2.39978 14.9654 2.39978C17.9478 2.39978 20.3654 4.81744 20.3654 7.79978Z"
        stroke="#2A4467"
        stroke-width="1.8"
      />
    </svg>
  ),
  creditCard: ({ className }) => (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...{ className }}
    >
      <path
        d="M2.40039 14.3998C2.40039 10.1548 2.40039 8.03233 3.66375 6.61528C3.86582 6.38864 4.08852 6.17903 4.32934 5.98885C5.83495 4.7998 8.0901 4.7998 12.6004 4.7998H16.2004C20.7107 4.7998 22.9658 4.7998 24.4714 5.98885C24.7123 6.17903 24.935 6.38864 25.137 6.61528C26.4004 8.03233 26.4004 10.1548 26.4004 14.3998C26.4004 18.6448 26.4004 20.7673 25.137 22.1843C24.935 22.411 24.7123 22.6206 24.4714 22.8108C22.9658 23.9998 20.7107 23.9998 16.2004 23.9998H12.6004C8.0901 23.9998 5.83495 23.9998 4.32934 22.8108C4.08852 22.6206 3.86582 22.411 3.66375 22.1843C2.40039 20.7673 2.40039 18.6448 2.40039 14.3998Z"
        stroke="#2A4467"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12.001 19.1992H13.801"
        stroke="#2A4467"
        stroke-width="1.8"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M17.4014 19.1992L21.6014 19.1992"
        stroke="#2A4467"
        stroke-width="1.8"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M2.40039 10.7998H26.4004"
        stroke="#2A4467"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  ),
  file: ({ className }) => (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...{ className }}
    >
      <path
        d="M19.2002 20.3984L10.8002 20.3984"
        stroke="currentColor"
        stroke-width="2.16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M19.2002 15.5977L15.6002 15.5977"
        stroke="currentColor"
        stroke-width="2.16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24.6003 16.7984C24.6003 21.3239 24.6003 23.5867 23.1066 24.9925C21.6128 26.3984 19.2087 26.3984 14.4003 26.3984H13.4731C9.55962 26.3984 7.6029 26.3984 6.24402 25.441C5.85468 25.1667 5.50904 24.8414 5.21758 24.475C4.20034 23.196 4.20034 21.3544 4.20034 17.6712V14.6166C4.20034 11.0608 4.20034 9.28291 4.76306 7.86294C5.66772 5.58014 7.5809 3.7795 10.0064 2.92806C11.5151 2.39844 13.4041 2.39844 17.1822 2.39844C19.341 2.39844 20.4205 2.39844 21.2826 2.70108C22.6686 3.18761 23.7618 4.21655 24.2788 5.52101C24.6003 6.33242 24.6003 7.34837 24.6003 9.38026V16.7984Z"
        stroke="currentColor"
        stroke-width="2.16"
        stroke-linejoin="round"
      />
      <path
        d="M4.19995 14.4004C4.19995 12.1913 5.99081 10.4004 8.19995 10.4004C8.99889 10.4004 9.9408 10.5404 10.7176 10.3322C11.4078 10.1473 11.9469 9.60821 12.1318 8.91803C12.3399 8.14123 12.2 7.19933 12.2 6.40039C12.2 4.19125 13.9908 2.40039 16.2 2.40039"
        stroke="currentColor"
        stroke-width="2.16"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  ),
};

export const CardStats: React.FC<CardStatsProps> = ({
  title,
  value,
  icon,
  color,
  bgColor,
  onClick,
}) => {
  const IconComponent = IconMap[icon as IconMapKey] || IconMap.folder;

  return (
    <Card 
      className={cn(
        "bg-white dark:bg-slate-950",
        onClick && "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
          </div>
          <div className={cn("p-2.5 rounded-full", bgColor)}>
            <IconComponent className={cn(`h-8 w-8 `, color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
