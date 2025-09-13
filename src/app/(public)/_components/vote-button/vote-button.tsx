import {Check} from "lucide-react"
import {twMerge} from "tailwind-merge"

import {Button} from "../button/button"

type VoteButtonProps = {
  optionId: string
  label: string
  pct: number
  isVoted: boolean
  isDisabled: boolean
  onVote: (optionId: string) => void
}

export function VoteButton({optionId, label, pct, isVoted, isDisabled, onVote, ...props}: VoteButtonProps) {
  return (
    <Button
      variant="secondary"
      className={twMerge(
        "relative flex w-3/4 cursor-pointer justify-between gap-2 rounded-none disabled:opacity-100 md:w-3/5",
        isVoted && "ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
      size="lg"
      onClick={() => onVote(optionId)}
      disabled={isDisabled || isVoted}
      {...props}
    >
      <span
        aria-hidden
        className="bg-primary pointer-events-none absolute inset-y-0 left-0"
        style={{width: `${pct}%`}}
      />
      <span className="z-5 inline-flex items-center gap-2">
        {label}
        {isVoted && <Check />}
      </span>
    </Button>
  )
}
