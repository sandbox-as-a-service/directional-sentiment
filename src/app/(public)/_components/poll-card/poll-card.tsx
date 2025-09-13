import {memo, useState} from "react"
import {twMerge} from "tailwind-merge"

import type {PollPersonalizedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

import {Badge} from "../badge/badge"
import {Button} from "../button/button"
import {Card} from "../card/compound-pattern/card"

type PollCardProps = {
  poll: PollPersonalizedPageItem
  onVote: (pollId: string, optionId: string) => Promise<void>
}

function RawPollCard({poll, onVote}: PollCardProps) {
  // Initialize state based on whether user already voted (from server data)
  const [votingState, setVotingState] = useState<"idle" | "voting" | "voted">(poll.current ? "voted" : "idle")

  async function handleVote(optionId: string) {
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

  function handleChangeOpinion() {
    setVotingState("idle") // Reset to allow voting again
  }

  const showChangeOpinion = votingState !== "idle"

  return (
    <Card className="border-none">
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>{poll.question}</div>
        <div>
          <Badge variant="outline">{votingState === "voted" ? "Voted" : "Not Voted"}</Badge>
        </div>
      </Card.Header>
      <Card.Content className="flex-col gap-2">
        {poll.options.map((option) => {
          const isVoted = poll.current === option.optionId
          const isDisabled = votingState !== "idle"
          const result = poll.results.items.find((item) => item.optionId === option.optionId)
          const pct = result?.pct ?? 0

          return (
            <div key={option.optionId} className="flex items-center justify-between gap-4">
              <Button
                key={option.optionId}
                variant="secondary"
                className={twMerge(
                  "relative flex w-3/4 cursor-pointer justify-between gap-2 rounded-none disabled:opacity-70 md:w-3/5",
                  isVoted && "ring-primary ring-offset-background ring-2 ring-offset-2",
                )}
                size="lg"
                onClick={() => handleVote(option.optionId)}
                disabled={isDisabled || isVoted}
              >
                <span
                  aria-hidden
                  className="bg-primary pointer-events-none absolute inset-y-0 left-0"
                  style={{width: `${pct}%`}}
                />
                <span className="z-5">{option.label}</span>
              </Button>
              <span>{pct}%</span>
            </div>
          )
        })}
      </Card.Content>
      <Card.Footer className="h-8 flex-row items-end justify-between">
        <span className="text-muted-foreground text-xs">Votes: {poll.results.total}</span>
        <Button
          disabled={!showChangeOpinion}
          variant="destructive"
          size="sm"
          className="rounded-none"
          onClick={handleChangeOpinion}
        >
          Change Opinion
        </Button>
      </Card.Footer>
    </Card>
  )
}

export const PollCard = memo(RawPollCard)
