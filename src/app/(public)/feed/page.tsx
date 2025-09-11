"use client"

import {Fragment} from "react"

import {Card} from "../_components/card/compound-pattern/card"
import {NavLayout} from "../_components/layout/nav-layout"
import {TwoColumnLayout} from "../_components/layout/two-column-layout"
import {Separator} from "../_components/separator/separator"
import {usePollsFeed} from "../_hooks/use-public-polls-feed"

export default function Page() {
  const {data, isLoading, error} = usePollsFeed()

  return (
    <div>
      <NavLayout />
      <TwoColumnLayout className="pt-0">
        <TwoColumnLayout.Main>
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
            {data?.items.map((item, index) => (
              <Fragment key={item.pollId}>
                <Card className="border-none">
                  <Card.Header>{item.question}</Card.Header>
                  <Card.Content>{item.options.map((option) => option.label).join(", ")}</Card.Content>
                </Card>
                {index < data.items.length - 1 && <Separator />}
              </Fragment>
            ))}
          </div>
        </TwoColumnLayout.Main>
        <TwoColumnLayout.Aside stickyOffsetClassName="top-22">
          <div className="flex flex-col gap-8">
            <Card>
              <Card.Header>Search</Card.Header>
              <Card.Content>Technology</Card.Content>
            </Card>
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
