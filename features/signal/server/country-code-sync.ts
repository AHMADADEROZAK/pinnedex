import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { CountryCode } from "@/features/signal/models/CountryCode";

const COUNTRY_CODES_URL =
  "https://gist.githubusercontent.com/anubhavshrimal/75f6183458db8c453306f93521e93d37/raw/CountryCodes.json";

interface ApiCountryCode {
  name: string;
  dial_code: string;
  code: string;
}

export async function syncCountryCodes() {
  await connectToDatabase();

  const count = await CountryCode.countDocuments();
  if (count > 0) return;

  const res = await fetch(COUNTRY_CODES_URL);
  if (!res.ok) {
    console.error("Failed to fetch country codes:", res.status);
    return;
  }

  const data = (await res.json()) as ApiCountryCode[];

  const docs = data.map((c) => ({
    name: c.name,
    dialCode: c.dial_code,
    code: c.code,
  }));

  await CountryCode.insertMany(docs, { ordered: false }).catch(() => {});
}
