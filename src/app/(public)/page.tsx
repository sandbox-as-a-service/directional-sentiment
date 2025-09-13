"use client"

import {Fragment, useEffect, useRef} from "react"

import {Card} from "./_components/card/compound-pattern/card"
import {HowItWorksCard} from "./_components/how-it-works-card/how-it-works-card"
import {HeaderLayout} from "./_components/layout/header-layout"
import {TwoColumnLayout} from "./_components/layout/two-column-layout"
import {PollCard} from "./_components/poll-card/poll-card"
import {PollCardSkeleton} from "./_components/poll-card/poll-card-skeleton"
import {Separator} from "./_components/separator/separator"
import {usePollsFeed} from "./_hooks/use-public-polls-feed"

export default function Page() {
  // Grab flat items + helpers from the infinite hook
  const {items, isLoading, isLoadingMore, error, hasMore, loadMore, castVote} = usePollsFeed()

  // This ref points to a tiny div at the end of the list.
  // When it enters the viewport, we fetch the next page.
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore) return // nothing else to load
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      {
        // Start loading a bit before the sentinel is fully visible
        rootMargin: "200px",
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="w-full">
      <HeaderLayout />
      <TwoColumnLayout className="pt-0 xl:pt-0">
        <TwoColumnLayout.Main>
          <div className="border">
            {isLoading &&
              Array.from({length: 10}).map((_, index) => (
                <Fragment key={index}>
                  <PollCardSkeleton />
                  {index < 9 && <Separator />}
                </Fragment>
              ))}

            {error && (
              <Card className="border-none">
                <Card.Header>Something went wrong.</Card.Header>
                <Card.Content>Please try again later.</Card.Content>
              </Card>
            )}

            {!isLoading &&
              items.map((item, index) => (
                <Fragment key={item.pollId}>
                  <PollCard poll={item} onVote={castVote} />
                  {index < items.length - 1 && <Separator />}
                </Fragment>
              ))}

            {!isLoading && isLoadingMore && (
              <>
                <Separator />
                <PollCardSkeleton />
              </>
            )}

            {!isLoading && <div ref={loadMoreRef} aria-hidden />}
          </div>
        </TwoColumnLayout.Main>
        <TwoColumnLayout.Aside stickyOffsetClassName="top-24">
          <div className="flex flex-col gap-8">
            <HowItWorksCard />
          </div>
        </TwoColumnLayout.Aside>
      </TwoColumnLayout>
    </div>
  )
}
