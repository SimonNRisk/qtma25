interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  options?: string[];
}

export const FormInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options,
}: FormInputProps) => {
  if (type === 'select' && options) {
    return (
      <div>
        <label htmlFor={id} className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1">
          {label} {required && '*'}
        </label>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
        >
          <option value="" className="text-black">Select your {label.toLowerCase()}</option>
          {options.map(option => (
            <option key={option} value={option} className="text-black">
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1">
        {label} {required && '*'}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
        placeholder={placeholder}
      />
    </div>
  );
};
