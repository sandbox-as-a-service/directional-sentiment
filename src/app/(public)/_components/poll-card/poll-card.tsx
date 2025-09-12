import {memo, useState} from "react"

import type {PollPersonalizedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

import {Button} from "../button/button"
import {Card} from "../card/compound-pattern/card"

type PollCardProps = {
  poll: PollPersonalizedPageItem
  onVote: (pollId: string, optionId: string) => Promise<void>
}

function RawPollCard({poll, onVote}: PollCardProps) {
  // Initialize state based on whether user already voted (from server data)
  const [votingState, setVotingState] = useState<"idle" | "voting" | "voted">(poll.current ? "voted" : "idle")

  const handleVote = async (optionId: string) => {
    if (votingState !== "idle") return // Only allow voting when idle

    setVotingState("voting")
    try {
      await onVote(poll.pollId, optionId)
      setVotingState("voted") // Disable further voting after success
    } catch (error) {
      console.error(error)
      setVotingState("idle") // Reset to allow retry on error
    }
  }

  const handleChangeOpinion = () => {
    setVotingState("idle") // Reset to allow voting again
  }

  const showChangeOpinion = votingState !== "idle"

  return (
    <Card className="border-none">
      <Card.Header>{poll.question}</Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {poll.options.map((option) => {
          const isVoted = poll.current === option.optionId
          const isDisabled = votingState !== "idle"

          return (
            <div key={option.optionId} className="flex items-center justify-between gap-4">
              <Button
                key={option.optionId}
                variant="outline"
                className="w-2/4 rounded-none md:w-4/5"
                size="lg"
                onClick={() => handleVote(option.optionId)}
                disabled={isDisabled || isVoted}
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
      <Card.Footer className="flex h-8 flex-row items-end justify-between">
        <span className="text-muted-foreground text-sm">Votes: {poll.results.total}</span>
        {showChangeOpinion && (
          <Button variant="destructive" size="sm" className="rounded-none" onClick={handleChangeOpinion}>
            Change Opinion
          </Button>
        )}
      </Card.Footer>
    </Card>
  )
}

export const PollCard = memo(RawPollCard)
