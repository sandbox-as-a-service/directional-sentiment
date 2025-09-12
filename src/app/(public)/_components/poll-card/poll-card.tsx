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
      <Card.Content>
        {poll.options.map((option) => (
          <Button key={option.optionId} variant="outline" className="rounded-none" size="lg">
            {option.label}
          </Button>
        ))}
      </Card.Content>
    </Card>
  )
}

export const PollCard = memo(RawPollCard)
