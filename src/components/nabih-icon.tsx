import { cn } from "@/lib/utils";
import * as React from "react";

export function NabihIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <rect width="256" height="256" fill="none"/>
      <path d="M128,24a95.8,95.8,0,0,0-63.4,22.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <path d="M191.4,46.5A95.9,95.9,0,0,1,224,128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <path d="M224,128a96,96,0,0,1-192,0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <path d="M32,128A95.9,95.9,0,0,1,64.6,46.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <path d="M160,152a32,32,0,0,1-64,0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <line x1="128" y1="184" x2="128" y2="232" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
      <line x1="104" y1="232" x2="152" y2="232" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
    </svg>
  );
}
