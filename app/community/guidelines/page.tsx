import Link from "next/link"
import { ArrowLeft, BookOpenCheck, ShieldAlert } from "lucide-react"

import { Header } from "@/features/app-shell"

const guidelines = [
  {
    title: "Share ideas",
    description:
      "This community is built on the exchange of ideas. Share thoughts, discuss openly, and respect differing opinions.",
  },
  {
    title: "No racism",
    description:
      "Content that is racist or discriminates against any ethnicity, race, or group is strictly prohibited.",
  },
  {
    title: "Respect religion",
    description:
      "Do not post content that drags religion into discussion or offends the beliefs of others.",
  },
  {
    title: "No hatred",
    description:
      "Hate speech, bullying, harassment, or incitement of hatred toward individuals or groups is prohibited.",
  },
  {
    title: "No scams or fraud",
    description:
      "Content promoting scams or fraud is prohibited, including but not limited to scams in the crypto world.",
  },
  {
    title: "No cybercrime",
    description:
      "Content related to cybercrime, such as phishing, hacking, or other illegal activity, is prohibited.",
  },
]

export default function CommunityGuidelinesPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Community
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]">
            <BookOpenCheck className="size-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Community Guidelines
          </h1>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Pinnedex Community is a space to share and exchange ideas. To keep the
          space healthy and safe, every pin (post) and comment must follow the
          guidelines below.
        </p>

        <ol className="flex flex-col gap-3">
          {guidelines.map((g, i) => (
            <li key={g.title} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#9945FF]/10 font-mono text-xs font-semibold text-[#9945FF]">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold">{g.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {g.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="size-4" />
            Enforcement
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Pins or comments that violate the guidelines above will be
            automatically{" "}
            <span className="font-medium text-destructive">removed by the system</span>.
          </p>
        </div>
      </main>
    </div>
  )
}
