export function PawLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} relative animate-pulse`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Main pad */}
          <ellipse 
            cx="50" 
            cy="60" 
            rx="18" 
            ry="22" 
            fill="currentColor" 
            className="text-primary opacity-80"
          />
          
          {/* Toe pads */}
          <ellipse 
            cx="30" 
            cy="35" 
            rx="10" 
            ry="13" 
            fill="currentColor" 
            className="text-primary opacity-60 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1000ms" }}
          />
          <ellipse 
            cx="50" 
            cy="28" 
            rx="10" 
            ry="13" 
            fill="currentColor" 
            className="text-primary opacity-60 animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1000ms" }}
          />
          <ellipse 
            cx="70" 
            cy="35" 
            rx="10" 
            ry="13" 
            fill="currentColor" 
            className="text-primary opacity-60 animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1000ms" }}
          />
          <ellipse 
            cx="60" 
            cy="50" 
            rx="9" 
            ry="11" 
            fill="currentColor" 
            className="text-primary opacity-60 animate-bounce"
            style={{ animationDelay: "600ms", animationDuration: "1000ms" }}
          />
        </svg>
      </div>
    </div>
  );
}

export function FullPageLoader({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 text-center">
        <PawLoader size="lg" />
        <p className="mt-4 text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <PawLoader size="md" />
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
