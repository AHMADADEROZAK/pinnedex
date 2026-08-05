"use client";

import { useEffect, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

interface CountryOption {
  name: string;
  dialCode: string;
  code: string;
}

interface WorldPhoneCodeProps {
  onChange: (phone: string) => void;
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function WorldPhoneCode({ onChange }: WorldPhoneCodeProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [localNumber, setLocalNumber] = useState("");

  useEffect(() => {
    fetch("/api/country-codes")
      .then((r) => r.json())
      .then((data: CountryOption[]) => setCountries(data))
      .catch(() => {});
  }, []);

  const onSelect = (country: CountryOption | null) => {
    if (!country) return;
    setSelected(country);
    onChange(`${country.dialCode}${localNumber}`);
  };

  const onLocalNumber = (v: string) => {
    const digits = v.replace(/\D/g, "");
    setLocalNumber(digits);
    onChange(`${selected?.dialCode ?? ""}${digits}`);
  };

  return (
    <div className="flex gap-2">
      <Combobox<CountryOption>
        value={selected}
        onValueChange={onSelect}
        items={countries}
        itemToStringLabel={(c) => `${c.name} (${c.dialCode})`}
        itemToStringValue={(c) => c.code}
      >
        <ComboboxTrigger className="w-32 shrink-0 px-3">
          <ComboboxValue placeholder="Country">
            {(c: CountryOption | null) =>
              c ? (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden>{flagEmoji(c.code)}</span>
                  <span className="font-medium">{c.dialCode}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Country</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent align="start" className="w-72">
          <ComboboxInput placeholder="Search country..." className="h-8" />
          <ComboboxEmpty>No country found</ComboboxEmpty>
          <ComboboxList className="max-h-64 overflow-y-auto">
            {(country: CountryOption) => (
              <ComboboxItem key={country.code} value={country}>
                <span aria-hidden>{flagEmoji(country.code)}</span>
                <span className="flex-1">{country.name}</span>
                <span className="text-muted-foreground">
                  {country.dialCode}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <input
        type="tel"
        value={localNumber}
        onChange={(e) => onLocalNumber(e.target.value)}
        placeholder="Phone number"
        className="h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
      />
    </div>
  );
}
