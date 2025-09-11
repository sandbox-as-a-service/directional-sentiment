import {describe, expect, it} from "@jest/globals"

import {getInitials} from "../get-initials"

describe("getInitials", () => {
  describe("with valid names", () => {
    it("returns single initial for single word", () => {
      expect(getInitials("John")).toBe("J")
    })

    it("returns first and last initials for two words", () => {
      expect(getInitials("John Doe")).toBe("JD")
    })

    it("returns first and last initials for multiple words", () => {
      expect(getInitials("John Michael Doe")).toBe("JD")
      expect(getInitials("Mary Jane Watson Smith")).toBe("MS")
    })

    it("handles mixed case correctly", () => {
      expect(getInitials("john doe")).toBe("JD")
      expect(getInitials("JOHN DOE")).toBe("JD")
      expect(getInitials("jOhN dOe")).toBe("JD")
    })

    it("handles extra whitespace", () => {
      expect(getInitials("  John   Doe  ")).toBe("JD")
      expect(getInitials("John\t\nDoe")).toBe("JD")
    })
  })

  describe("with invalid inputs", () => {
    it("returns ? for null", () => {
      expect(getInitials(null)).toBe("?")
    })

    it("returns ? for undefined", () => {
      expect(getInitials(undefined)).toBe("?")
    })

    it("returns ? for empty string", () => {
      expect(getInitials("")).toBe("?")
    })

    it("returns ? for whitespace-only string", () => {
      expect(getInitials("   ")).toBe("?")
      expect(getInitials("\t\n")).toBe("?")
    })
  })

  describe("edge cases", () => {
    it("handles single character names", () => {
      expect(getInitials("J")).toBe("J")
      expect(getInitials("J D")).toBe("JD")
    })

    it("handles names with special characters", () => {
      expect(getInitials("Jean-Claude Van Damme")).toBe("JD")
      expect(getInitials("Mary O'Connor")).toBe("MO")
    })
  })
})
