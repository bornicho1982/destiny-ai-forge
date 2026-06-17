'use client';

// ============================================================
// Destiny AI Forge — Login Button Component
// ============================================================

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = '' }: LoginButtonProps) {
  const handleLogin = () => {
    // Redirect to our OAuth login route, which will redirect to Bungie
    window.location.href = '/api/auth/login';
  };

  return (
    <button
      id="login-button"
      onClick={handleLogin}
      className={`
        group relative inline-flex items-center justify-center gap-3
        px-8 py-4 rounded-xl
        font-semibold text-base
        bg-gradient-to-r from-[var(--forge-accent)] to-[#c4953a]
        text-[var(--forge-bg-primary)]
        shadow-lg shadow-[rgba(232,185,74,0.25)]
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-[rgba(232,185,74,0.4)]
        hover:scale-[1.03]
        active:scale-[0.98]
        cursor-pointer
        ${className}
      `}
    >
      {/* Bungie icon */}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18zM4 9.5l7 3.5v7.18l-7-3.5V9.5zm9 10.68V13l7-3.5v7.18l-7 3.5z" />
      </svg>

      <span>Sign in with Bungie</span>

      {/* Shimmer overlay */}
      <div
        className="
          absolute inset-0 rounded-xl overflow-hidden
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
      >
        <div
          className="
            absolute inset-0
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            animate-shimmer
          "
        />
      </div>
    </button>
  );
}
