import React from "react";

interface CaptchaMockProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const CaptchaMock: React.FC<CaptchaMockProps> = ({ checked, onChange }) => {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surfaceSoft px-3 py-2">
      <input
        id="captcha-mock"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-brand-border text-brand-ink focus-visible:ring-brand-ink/25"
      />
      <label htmlFor="captcha-mock" className="text-xs text-brand-ink">
        No soy un robot (captcha simulado)
      </label>
    </div>
  );
};

/**
 * Para integrar reCAPTCHA/hCaptcha en el futuro:
 *
 * - Reemplazar este componente por el widget real.
 * - Obtener el token del captcha y pasarlo al servicio de login:
 *   login(policyNumber, dob, captchaToken)
 * - Enviar el token al backend real en authService.ts.
 */

