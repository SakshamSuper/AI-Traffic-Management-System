import os

base_dir = r'c:\Users\saksh\Downloads\Projects anti\Traffic\frontend'
def ensure_dir(path):
    os.makedirs(os.path.dirname(os.path.join(base_dir, path)), exist_ok=True)

files = {}

files['src/components/ui/button.tsx'] = '''import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
'''

files['src/components/ui/card.tsx'] = '''import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
'''

files['src/components/ui/badge.tsx'] = '''import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
'''

files['src/components/ui/input.tsx'] = '''import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
'''

files['src/components/ui/label.tsx'] = '''import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70")

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
'''

files['src/components/ui/select.tsx'] = '''import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)} position={position} {...props}>
        <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
'''

files['src/components/ui/dialog.tsx'] = '''import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)} {...props} />
  )
)
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
DialogDescription.displayName = DialogPrimitive.Description.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
'''

files['src/components/ui/tabs.tsx'] = '''import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
  )
)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)} {...props} />
  )
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props} />
  )
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
'''

files['src/components/ui/switch.tsx'] = '''import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitives.Root className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className)} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0")} />
    </SwitchPrimitives.Root>
  )
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
'''

files['src/components/ui/progress.tsx'] = '''import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>>(
  ({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root ref={ref} className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
      <ProgressPrimitive.Indicator className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  )
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
'''

files['src/components/ui/separator.tsx'] = '''import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root ref={ref} decorative={decorative} orientation={orientation} className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} {...props} />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
'''

files['src/components/ui/tooltip.tsx'] = '''import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className)} {...props} />
  )
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
'''

files['src/components/ui/scroll-area.tsx'] = '''import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>>(
  ({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar ref={ref} orientation={orientation} className={cn("flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", className)} {...props}>
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
)
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
'''

files['src/components/ui/avatar.tsx'] = '''import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Root ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
  )
)
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Image>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
  )
)
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Fallback>, React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} {...props} />
  )
)
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
'''

files['src/components/ui/slider.tsx'] = '''import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
'''

files['src/components/ui/toast.tsx'] = '''import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport ref={ref} className={cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className)} {...props} />
  )
)
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>>(
  ({ className, variant, ...props }, ref) => {
    return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
  }
)
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Action ref={ref} className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className)} {...props} />
  )
)
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close ref={ref} className={cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className)} toast-close="" {...props}>
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
)
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  )
)
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
  )
)
ToastDescription.displayName = ToastPrimitives.Description.displayName

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
'''

files['src/components/ui/toaster.tsx'] = '''"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
'''

files['src/components/ui/use-toast.ts'] = '''import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
}

let count = 0
const listeners: Set<Function> = new Set()
let toasts: Toast[] = []

export function toast(props: Omit<Toast, "id">) {
  const id = count++.toString()
  const newToast = { ...props, id }
  toasts = [...toasts, newToast]
  listeners.forEach((listener) => listener())
  
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    listeners.forEach((listener) => listener())
  }, 3000)
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>(toasts)

  React.useEffect(() => {
    const listener = () => setCurrentToasts([...toasts])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { toasts: currentToasts, toast }
}
'''

files['src/components/layout/Sidebar.tsx'] = '''import Link from "next/link"
import { LayoutDashboard, Camera, TrafficCone, BarChart3, Bell, Settings, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cameras", label: "Live Cameras", icon: Camera },
    { href: "/signals", label: "Traffic Signals", icon: TrafficCone },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border/50 text-card-foreground shadow-sm transition-all duration-300">
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
          <TrafficCone className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TrafficAI</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={cn("flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", isActive ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-muted text-muted-foreground hover:text-foreground")}> 
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
            {user?.username?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Admin"}</p>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
'''

files['src/components/layout/Header.tsx'] = '''import { Bell, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function Header() {
  const [time, setTime] = useState(new Date())
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mr-4 border-r border-border pr-4">
          {connected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-destructive" />}
          <span>{connected ? "Connected" : "Offline"}</span>
        </div>
        <div className="text-sm font-medium tabular-nums mr-4">
          {time.toLocaleTimeString()}
        </div>
        <Button variant="ghost" size="icon">
          <Moon className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  )
}
'''

files['src/components/layout/DashboardLayout.tsx'] = '''import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
'''

files['src/components/dashboard/KpiCards.tsx'] = '''import { Car, Gauge, Camera, Bell, Siren, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function KpiCards() {
  const kpis = [
    { title: "Total Vehicles", value: "12,450", icon: Car, trend: "+12%", color: "text-blue-500" },
    { title: "Avg Congestion", value: "45%", icon: Gauge, trend: "-5%", color: "text-yellow-500" },
    { title: "Online Cameras", value: "24/24", icon: Camera, trend: "100%", color: "text-green-500" },
    { title: "Active Alerts", value: "3", icon: Bell, trend: "-2", color: "text-orange-500" },
    { title: "Avg Speed", value: "42 km/h", icon: Gauge, trend: "+1 km/h", color: "text-indigo-500" },
    { title: "Emergency Events", value: "0", icon: Siren, trend: "0", color: "text-red-500" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon
        return (
          <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className={`p-3 rounded-full bg-muted/50 ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{kpi.value}</h3>
              </div>
              <div className="flex items-center text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {kpi.trend}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
'''

files['src/components/dashboard/LiveVideoGrid.tsx'] = '''import { Maximize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function LiveVideoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative aspect-video bg-black rounded-xl overflow-hidden group border border-border/50">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            [Live Stream {i}]
          </div>
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
            <div>
              <Badge variant="default" className="bg-black/50 backdrop-blur text-white border-none">Cam {i} - Main St</Badge>
              <div className="mt-1">
                <Badge variant="outline" className="bg-black/50 backdrop-blur text-green-400 border-green-400/50">FPS: 30</Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="destructive" className="bg-red-500/80">Congestion: High</Badge>
              <Badge variant="outline" className="bg-black/50 backdrop-blur text-white">Vehicles: 42</Badge>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 flex gap-2">
            <div className="flex gap-1 bg-black/50 p-1 rounded-full backdrop-blur">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            </div>
            <button className="p-1.5 bg-black/50 backdrop-blur text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
'''

files['src/components/dashboard/CongestionHeatmap.tsx'] = '''import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CongestionHeatmap() {
  return (
    <Card className="col-span-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Congestion Heatmap (Last 24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
          [Heatmap Chart Placeholder]
        </div>
      </CardContent>
    </Card>
  )
}
'''

files['src/components/dashboard/AlertsPanel.tsx'] = '''import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"

export function AlertsPanel() {
  return (
    <Card className="h-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Live Alerts</CardTitle>
        <Badge variant="destructive">3 Unread</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 hover:bg-muted/50 transition-colors flex gap-3 border-l-4 border-l-orange-500">
              <div className="mt-0.5">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">High Congestion Detected</p>
                <p className="text-xs text-muted-foreground mt-1">Cam {i} - Main St Intersection</p>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3 mr-1" /> 2 mins ago
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
'''

files['src/components/dashboard/SignalStatusGrid.tsx'] = '''import { Card, CardContent } from "@/components/ui/card"

export function SignalStatusGrid() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Intersection {i}</p>
              <p className="text-sm text-muted-foreground">Phase: N-S Green</p>
              <p className="text-2xl font-bold mt-2 tabular-nums">45s</p>
            </div>
            <div className="flex flex-col gap-2 p-2 bg-black/80 rounded-xl border border-border/50">
              <div className={`w-6 h-6 rounded-full ${i === 1 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-red-500/20'}`} />
              <div className={`w-6 h-6 rounded-full ${i === 2 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]' : 'bg-yellow-500/20'}`} />
              <div className={`w-6 h-6 rounded-full ${i === 3 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-green-500/20'}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
'''

files['src/components/dashboard/VehicleCountChart.tsx'] = '''import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function VehicleCountChart() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Vehicle Counts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
          [Line Chart Placeholder]
        </div>
      </CardContent>
    </Card>
  )
}
'''

files['src/components/dashboard/SpeedChart.tsx'] = '''import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SpeedChart() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Average Speed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
          [Area Chart Placeholder]
        </div>
      </CardContent>
    </Card>
  )
}
'''

files['src/components/cameras/CameraCard.tsx'] = '''import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, Settings } from "lucide-react"

export function CameraCard() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <div className="aspect-video bg-black relative">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Signal</div>
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="success">Online</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">Main St - North</h3>
            <p className="text-sm text-muted-foreground">RTSP / 1080p</p>
          </div>
          <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="default" className="w-full" size="sm"><Play className="w-4 h-4 mr-2"/> Start</Button>
          <Button variant="outline" className="w-full" size="sm"><Square className="w-4 h-4 mr-2"/> Stop</Button>
        </div>
      </CardContent>
    </Card>
  )
}
'''

files['src/components/cameras/AddCameraDialog.tsx'] = '''import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function AddCameraDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Camera</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Camera</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Camera Name</Label>
            <Input id="name" placeholder="Main St Intersection" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">RTSP URL</Label>
            <Input id="url" placeholder="rtsp://..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Camera</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'''

files['src/components/cameras/CameraPlayer.tsx'] = '''export function CameraPlayer() {
  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative border border-border">
      <div className="absolute inset-0 flex items-center justify-center text-white">Live Feed [Canvas]</div>
    </div>
  )
}
'''

files['src/components/charts/VehicleTypeDonut.tsx'] = '''export function VehicleTypeDonut() { return <div className="p-4 border rounded-xl">Vehicle Type Donut</div> }'''
files['src/components/charts/CongestionTimeline.tsx'] = '''export function CongestionTimeline() { return <div className="p-4 border rounded-xl">Congestion Timeline</div> }'''
files['src/components/charts/QueueLengthChart.tsx'] = '''export function QueueLengthChart() { return <div className="p-4 border rounded-xl">Queue Length</div> }'''
files['src/components/charts/SpeedDistribution.tsx'] = '''export function SpeedDistribution() { return <div className="p-4 border rounded-xl">Speed Distribution</div> }'''

files['src/app/(auth)/login/page.tsx'] = '''"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrafficCone } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-indigo-950/20 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-xl mb-4 shadow-lg">
            <TrafficCone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TrafficAI</h1>
          <p className="text-muted-foreground mt-2">Smart Traffic Management System</p>
        </div>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href='/dashboard'; }}>
          <div className="space-y-2">
            <Input placeholder="Username" className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Input type="password" placeholder="Password" className="bg-background/50" />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-none">
            Sign In
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Demo: admin / admin123
        </div>
      </div>
    </div>
  )
}
'''

files['src/app/(auth)/layout.tsx'] = '''export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
'''

files['src/app/dashboard/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { KpiCards } from "@/components/dashboard/KpiCards"
import { LiveVideoGrid } from "@/components/dashboard/LiveVideoGrid"
import { SignalStatusGrid } from "@/components/dashboard/SignalStatusGrid"
import { VehicleCountChart } from "@/components/dashboard/VehicleCountChart"
import { SpeedChart } from "@/components/dashboard/SpeedChart"
import { CongestionHeatmap } from "@/components/dashboard/CongestionHeatmap"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        <KpiCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LiveVideoGrid />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VehicleCountChart />
              <SpeedChart />
            </div>
          </div>
          <div className="space-y-6">
            <SignalStatusGrid />
            <AlertsPanel />
          </div>
        </div>

        <CongestionHeatmap />
      </div>
    </DashboardLayout>
  )
}
'''

files['src/app/cameras/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CameraCard } from "@/components/cameras/CameraCard"
import { AddCameraDialog } from "@/components/cameras/AddCameraDialog"

export default function CamerasPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Live Cameras</h1>
        <AddCameraDialog />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CameraCard />
        <CameraCard />
        <CameraCard />
      </div>
    </DashboardLayout>
  )
}
'''

files['src/app/cameras/[id]/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CameraPlayer } from "@/components/cameras/CameraPlayer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CameraDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Camera {params.id}</h1>
        <CameraPlayer />
        <Tabs defaultValue="live">
          <TabsList>
            <TabsTrigger value="live">Live Feed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="p-4 border rounded-xl mt-4">Live details</TabsContent>
          <TabsContent value="analytics" className="p-4 border rounded-xl mt-4">Charts here</TabsContent>
          <TabsContent value="config" className="p-4 border rounded-xl mt-4">Settings form</TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
'''

files['src/app/signals/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SignalStatusGrid } from "@/components/dashboard/SignalStatusGrid"

export default function SignalsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Traffic Signals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SignalStatusGrid />
      </div>
    </DashboardLayout>
  )
}
'''

files['src/app/analytics/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { VehicleTypeDonut } from "@/components/charts/VehicleTypeDonut"
import { CongestionTimeline } from "@/components/charts/CongestionTimeline"
import { QueueLengthChart } from "@/components/charts/QueueLengthChart"
import { SpeedDistribution } from "@/components/charts/SpeedDistribution"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VehicleTypeDonut />
        <CongestionTimeline />
        <QueueLengthChart />
        <SpeedDistribution />
      </div>
    </DashboardLayout>
  )
}
'''

files['src/app/alerts/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      <AlertsPanel />
    </DashboardLayout>
  )
}
'''

files['src/app/settings/page.tsx'] = '''"use client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="p-4 border rounded-xl mt-4">Account Settings</TabsContent>
        <TabsContent value="system" className="p-4 border rounded-xl mt-4">System Settings</TabsContent>
        <TabsContent value="ai" className="p-4 border rounded-xl mt-4">AI Model Config</TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
'''

files['src/app/not-found.tsx'] = '''export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-destructive">404</h1>
      <p className="text-xl text-muted-foreground">Road not found</p>
    </div>
  )
}
'''

files['src/components/providers.tsx'] = '''"use client"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
'''

files['Dockerfile'] = '''FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
'''

for rel_path, content in files.items():
    ensure_dir(rel_path)
    with open(os.path.join(base_dir, rel_path), 'w', encoding='utf-8') as f:
        f.write(content)

print('All files created successfully.')
