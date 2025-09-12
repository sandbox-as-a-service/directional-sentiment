import {Card} from "../card/compound-pattern/card"

export function HowItWorksCard() {
  return (
    <Card>
      <Card.Header>How it works</Card.Header>
      <Card.Content>
        <div className="space-y-3 text-sm">
          <p>
            <strong>1. Vote instantly</strong>: One click, no submit button. See results update in real-time.
          </p>
          <p>
            <strong>2. Warming up</strong>: Polls show percentages once they reach quorum (30+ voters).
          </p>
          <p>
            <strong>3. Never expires</strong>: All polls stay live forever. Voters are allowed to change their
            opinions.
          </p>
          <p className="pt-2 text-xs">
            This is directional sentiment, not scientific polling. Perfect for settling debates with receipts.
          </p>
        </div>
      </Card.Content>
    </Card>
  )
}
