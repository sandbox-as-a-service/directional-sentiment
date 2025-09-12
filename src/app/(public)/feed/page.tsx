"use client"

import {Fragment, useEffect, useRef} from "react"

import {Card} from "../_components/card/compound-pattern/card"
import {HeaderLayout} from "../_components/layout/header-layout"
import {TwoColumnLayout} from "../_components/layout/two-column-layout"
import {PollCard} from "../_components/poll-card/poll-card"
import {Separator} from "../_components/separator/separator"
import {usePollsFeed} from "../_hooks/use-public-polls-feed"

export default function Page() {
  // Grab flat items + helpers from the infinite hook
  const {items, isLoading, isLoadingMore, error, hasMore, loadMore} = usePollsFeed()

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
    <div>
      <HeaderLayout />
      <TwoColumnLayout className="pt-0">
        <TwoColumnLayout.Main className="pt-1">
          <div className="border">
            {isLoading && (
              <Card className="border-none">
                <Card.Header>Loading</Card.Header>
              </Card>
            )}

            {error && (
              <Card className="border-none">
                <Card.Header>Something went wrong.</Card.Header>
                <Card.Content>Please try again later.</Card.Content>
              </Card>
            )}

            {!isLoading &&
              items.map((item, index) => (
                <Fragment key={item.pollId}>
                  <PollCard poll={item} />
                  {index < items.length - 1 && <Separator />}
                </Fragment>
              ))}

            {!isLoading && isLoadingMore && (
              <Card className="border-none">
                <Card.Header>Loading more…</Card.Header>
              </Card>
            )}

            {!isLoading && <div ref={loadMoreRef} aria-hidden />}
          </div>
        </TwoColumnLayout.Main>

        <TwoColumnLayout.Aside stickyOffsetClassName="top-24">
          <div className="flex flex-col gap-8">
            <Card>
              <Card.Header>Trending</Card.Header>
              <Card.Content>12</Card.Content>
            </Card>
            <Card>
              <Card.Header>How it works</Card.Header>
              <Card.Content>lorem</Card.Content>
            </Card>
          </div>
        </TwoColumnLayout.Aside>
      </TwoColumnLayout>
    </div>
  )
}
