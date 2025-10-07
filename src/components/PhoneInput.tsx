import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, disabled, className }: PhoneInputProps) {
  return (
    <div className={cn('phone-input-wrapper', className)}>
      <PhoneInputWithCountry
        international
        defaultCountry="BR"
        value={value}
        onChange={(value) => onChange(value || '')}
        disabled={disabled}
        className="flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        numberInputProps={{
          className: 'flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        }}
        countrySelectProps={{
          className: 'border-0 bg-transparent focus:ring-0 outline-none',
        }}
      />
      <style jsx global>{`
        .phone-input-wrapper .PhoneInputCountry {
          margin-right: 8px;
        }

        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
          border: 1px solid hsl(var(--border));
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .phone-input-wrapper .PhoneInputCountrySelect {
          padding: 0;
          margin-right: 4px;
        }

        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          opacity: 0.5;
          width: 12px;
          height: 12px;
        }

        .phone-input-wrapper .PhoneInputInput {
          font-family: inherit;
        }

        .phone-input-wrapper.valid {
          border-color: hsl(var(--success));
        }

        .phone-input-wrapper.invalid {
          border-color: hsl(var(--destructive));
        }
      `}</style>
    </div>
  );
}
