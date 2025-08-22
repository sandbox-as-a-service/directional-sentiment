import type {PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

// Tiny seed for local memory mode
export const memoryPolls = [
  {pollId: "11111111-1111-1111-1111-111111111111", slug: "best-bj-flavor", status: "open" as PollStatus},
  {pollId: "22222222-2222-2222-2222-222222222222", slug: "ketchup-on-steak", status: "closed" as PollStatus},
]

export const memoryOptions = [
  // poll 1
  {
    optionId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    pollId: "11111111-1111-1111-1111-111111111111",
    label: "Half Baked",
  },
  {
    optionId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    pollId: "11111111-1111-1111-1111-111111111111",
    label: "Cherry Garcia",
  },
  {
    optionId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    pollId: "11111111-1111-1111-1111-111111111111",
    label: "Americone Dream",
  },
  // poll 2
  {
    optionId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    pollId: "22222222-2222-2222-2222-222222222222",
    label: "Yes",
  },
  {
    optionId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    pollId: "22222222-2222-2222-2222-222222222222",
    label: "No",
  },
]
