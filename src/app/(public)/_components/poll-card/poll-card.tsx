import {memo} from "react"

import type {PollPersonalizedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

import {Button} from "../button/button"
import {Card} from "../card/compound-pattern/card"

type PollCardProps = {
  poll: PollPersonalizedPageItem
}

function RawPollCard({poll}: PollCardProps) {
  return (
    <Card className="border-none">
      <Card.Header>{poll.question}</Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {poll.options.map((option) => {
          const isVoted = poll.current === option.optionId
          return (
            <div key={option.optionId} className="flex items-center justify-between gap-4">
              <Button
                key={option.optionId}
                variant="outline"
                className="w-2/4 rounded-none md:w-4/5"
                size="lg"
              >
                {option.label}
              </Button>
              <div className="flex gap-4">
                {isVoted && <span>Voted</span>}
                <span>{poll.results.items.find((item) => item.optionId === option.optionId)?.pct}%</span>
              </div>
            </div>
          )
        })}
      </Card.Content>
      <Card.Footer>
        <span className="text-muted-foreground text-sm">Votes: {poll.results.total}</span>
      </Card.Footer>
    </Card>
  )
}

export const PollCard = memo(RawPollCard)
