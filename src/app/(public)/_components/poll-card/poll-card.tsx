import {memo, useState} from "react"

import type {PollPersonalizedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

import {useGetUser} from "../../_hooks/use-get-user"
import {Button} from "../button/button"
import {Card} from "../card/compound-pattern/card"
import {SignInDialog} from "../sign-in-dialog/sign-in-dialog"
import {VoteButton} from "../vote-button/vote-button"

type PollCardProps = {
  poll: PollPersonalizedPageItem
  onVote: (pollId: string, optionId: string) => Promise<void>
}

function RawPollCard({poll, onVote}: PollCardProps) {
  // Initialize state based on whether user already voted (from server data)
  const [votingState, setVotingState] = useState<"idle" | "voting" | "voted">(poll.current ? "voted" : "idle")
  const {data: user} = useGetUser()

  async function handleVote(optionId: string) {
    if (!user) return
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
      <Card.Header>{poll.question}</Card.Header>
      <Card.Content className="flex-col gap-2">
        {poll.options.map((option) => {
          const isVoted = poll.current === option.optionId
          const isDisabled = votingState !== "idle"
          const result = poll.results.items.find((item) => item.optionId === option.optionId)
          const pct = result?.pct ?? 0

          return (
            <div key={option.optionId} className="flex items-center justify-between gap-4">
              {user ? (
                <VoteButton
                  optionId={option.optionId}
                  label={option.label}
                  pct={pct}
                  isVoted={isVoted}
                  isDisabled={isDisabled}
                  onVote={handleVote}
                />
              ) : (
                <SignInDialog>
                  <VoteButton
                    optionId={option.optionId}
                    label={option.label}
                    pct={pct}
                    isVoted={isVoted}
                    isDisabled={false}
                    onVote={handleVote}
                  />
                </SignInDialog>
              )}
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
