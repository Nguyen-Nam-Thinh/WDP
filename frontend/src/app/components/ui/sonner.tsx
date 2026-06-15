import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
  <Sonner
    position="top-right"
    offset="80px"
    gap={8}
    toastOptions={{
      style: {
        borderRadius: "0",
        border: "1px solid #E3DCCB",
        background: "#FFFFFF",
        color: "#23201A",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "13px",
        fontWeight: "500",
        boxShadow: "0 2px 8px rgba(35,32,26,0.08)",
        padding: "12px 16px",
      },
      classNames: {
        success: "!border-l-4 !border-l-[#1F3D2B]",
        error:   "!border-l-4 !border-l-[#B42318]",
        warning: "!border-l-4 !border-l-[#C9A227]",
        info:    "!border-l-4 !border-l-[#1F3D2B]",
        icon:    "!text-current",
      },
    }}
    style={
      {
        "--normal-bg": "#FFFFFF",
        "--normal-text": "#23201A",
        "--normal-border": "#E3DCCB",
        "--success-bg": "#FFFFFF",
        "--success-text": "#1F3D2B",
        "--success-border": "#E3DCCB",
        "--error-bg": "#FFFFFF",
        "--error-text": "#B42318",
        "--error-border": "#E3DCCB",
        "--warning-bg": "#FFFFFF",
        "--warning-text": "#8F7318",
        "--warning-border": "#E3DCCB",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
