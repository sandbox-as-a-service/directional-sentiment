import {TwoColumnLayout} from "@/app/(public)/_components/layout/two-column-layout"

export default function Page() {
  return (
    <TwoColumnLayout>
      <TwoColumnLayout.Main className="space-y-4">
        <h1 className="text-2xl font-bold">Sign In Failed</h1>
        <p>We couldn&apos;t complete your GitHub sign-in. This could be due to:</p>

        <ul className="list-inside list-disc">
          <li>Your GitHub account is less than 3 months old (required for voting).</li>
          <li>Network issues or GitHub services temporarily unavailable.</li>
        </ul>
      </TwoColumnLayout.Main>
    </TwoColumnLayout>
  )
}
