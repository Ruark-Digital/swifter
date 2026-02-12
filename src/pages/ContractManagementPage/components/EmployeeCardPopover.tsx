import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, BriefcaseBusiness, Phone } from "lucide-react";

type Props = {
  triggerLabel: string;
  name: string;
  userId?: string;
  email?: string;
  role?: string;
  phone?: string;
};

const EmployeeCardPopover: React.FC<Props> = ({
  triggerLabel,
  name,
  userId = "USR-4021",
  email = "olamide@gmail.com",
  role = "Supervisor",
  phone = "+1 (344) 2213",
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <a href="#" className="text-blue-600 underline">
          {triggerLabel}
        </a>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[342px] p-5 rounded-2xl border border-slate-200 bg-white"
        data-testid="employee-card-popover"
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{name}</span>
            <span className="text-[10px] text-slate-500">{userId}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span className="text-sm text-slate-600">Email</span>
            <a
              href={`mailto:${email}`}
              className="ml-auto text-sm text-blue-600 underline"
            >
              {email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness
              className="h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
            <span className="text-sm text-slate-600">Role</span>
            <span className="ml-auto text-sm text-slate-700">{role}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span className="text-sm text-slate-600">Phone Number</span>
            <span className="ml-auto text-sm text-slate-700">{phone}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmployeeCardPopover;
