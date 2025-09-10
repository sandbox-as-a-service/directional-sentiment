import {TwoColumnLayout} from "@/app/(public)/_components/layout/two-column-layout"

export default function Page() {
  return (
    <TwoColumnLayout className="container mx-auto">
      <TwoColumnLayout.Main className="font-mono tracking-wide">
        <h1 className="mb-4 text-2xl font-bold">Sign In Failed</h1>
        <p className="mb-4">We couldn&apos;t complete your GitHub sign-in. This could be due to:</p>

        <ul className="list-inside list-disc text-center text-sm/6 sm:text-left">
          <li>Your GitHub account is less than 3 months old (required for voting).</li>
          <li>Network issues or GitHub services temporarily unavailable.</li>
        </ul>
      </TwoColumnLayout.Main>
    </TwoColumnLayout>
  )
}
