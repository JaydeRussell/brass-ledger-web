"use client";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";

// Styled re-exports of Radix's own pieces, composed like Radix's API
// itself rather than one over-abstracted component — this needs to serve
// two different shapes of consumer: a plain menu-of-items (the theme
// toggle, the admin page's role change) and a popover with arbitrary rich
// content inside it (eventSettings.tsx's search input + filtered list +
// buttons, none of which are DropdownMenu.Item). Content/Item are the
// only pieces this app's own styling needs; Root/Trigger are re-exported
// unstyled since a trigger is always some existing button/element.
export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(function DropdownMenuContent({ className = "", sideOffset = 8, collisionPadding = 16, ...props }, ref) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        // collisionPadding above is Radix's real viewport-collision
        // awareness (replaces eventSettings.tsx's manual
        // max-w-[calc(100vw-2rem)] clamp); the max-w-[calc(100vw-2rem)]
        // here is kept anyway as a CSS-only fallback in case Radix's
        // positioning logic and this app's own layout ever disagree —
        // cheap insurance, not load-bearing.
        className={`z-20 max-w-[calc(100vw-2rem)] rounded-md border border-surface-border bg-surface-2 p-1 text-text-primary shadow-lg outline-none ${className}`}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
});

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item>
>(function DropdownMenuItem({ className = "", ...props }, ref) {
  return (
    <RadixDropdownMenu.Item
      ref={ref}
      className={`cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm text-text-primary outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface-1 ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Label>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label>
>(function DropdownMenuLabel({ className = "", ...props }, ref) {
  return (
    <RadixDropdownMenu.Label
      ref={ref}
      className={`px-2 py-1 text-xs font-medium text-text-tertiary ${className}`}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>
>(function DropdownMenuSeparator({ className = "", ...props }, ref) {
  return <RadixDropdownMenu.Separator ref={ref} className={`my-1 h-px bg-surface-border ${className}`} {...props} />;
});
