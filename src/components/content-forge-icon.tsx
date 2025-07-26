import { cn } from "@/lib/utils";
import * as React from "react";

export function ContentForgeIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <rect width="256" height="256" fill="none" />
      <path
        d="M88,134.9,172,50.9a20,20,0,0,1,28.3,28.3L116.3,163.2a12,12,0,0,1-17,0L54.9,118.9a20,20,0,0,1,28.3-28.3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="24"
      />
      <path
        d="M195.9,116.3,216,136.4V200a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8h63.6l20.1,20.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="24"
      />
    </svg>
  );
}
