import type {PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

// Tiny seed for local memory mode (UUIDs are RFC-4122 compliant)
export const memoryPolls = [
  {pollId: "11111111-1111-4111-8111-111111111111", slug: "best-bj-flavor", status: "open" as PollStatus},
  {pollId: "22222222-2222-4222-8222-222222222222", slug: "ketchup-on-steak", status: "open" as PollStatus},
]

export const memoryOptions = [
  // poll 1
  {
    optionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    pollId: "11111111-1111-4111-8111-111111111111",
    label: "Half Baked",
  },
  {
    optionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    pollId: "11111111-1111-4111-8111-111111111111",
    label: "Cherry Garcia",
  },
  {
    optionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    pollId: "11111111-1111-4111-8111-111111111111",
    label: "Americone Dream",
  },

  // poll 2
  {
    optionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    pollId: "22222222-2222-4222-8222-222222222222",
    label: "Yes",
  },
  {
    optionId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    pollId: "22222222-2222-4222-8222-222222222222",
    label: "No",
  },
]
