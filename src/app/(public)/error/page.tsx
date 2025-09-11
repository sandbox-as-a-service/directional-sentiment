import {TwoColumnLayout} from "@/app/(public)/_components/layout/two-column-layout"

export default function Page() {
  return (
    <TwoColumnLayout>
      <TwoColumnLayout.Main className="space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p>We couldn&apos;t complete your request. Please try again later.</p>
      </TwoColumnLayout.Main>
    </TwoColumnLayout>
  )
}
