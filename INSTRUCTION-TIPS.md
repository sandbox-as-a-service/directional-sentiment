# SIX TIPS FOR CODING WITH GPT-5

This guide collects six practical tips for getting the best results when coding with GPT-5.
It is based on real-world usage and highlights where GPT-5 behaves differently from prior models.

## BE PRECISE AND AVOID CONFLICTING INFORMATION

GPT-5 is excellent at following instructions, but it can struggle with vague or contradictory inputs.
When writing rules in .cursor/rules or AGENTS.md, ensure your guidance is clear and consistent.
Conflicting instructions can lead to unexpected or inefficient outputs.

## USE THE RIGHT REASONING EFFORT

GPT-5 always applies some reasoning when solving problems.

- Use HIGH reasoning effort for complex or multi-step tasks.
- For simpler problems, either be more specific in your request or set the reasoning effort to MEDIUM or LOW.

This prevents the model from “overthinking” straightforward issues.

## AVOID OVERLY FIRM LANGUAGE

Firm language that worked in earlier models can backfire with GPT-5.
For example, instructions like:
“Be THOROUGH and gather ALL the information before replying.”

This can cause the model to overdo its discovery process, making too many tool calls or generating unnecessary details.
Instead, use balanced phrasing that allows GPT-5 to decide when “enough” is enough.

## USE XML-LIKE SYNTAX TO STRUCTURE INSTRUCTIONS

We found GPT-5 works well when using XML-like syntax to give the model more context.
For example, you might give the model coding guidelines:

Example:

```xml
<code_editing_rules>
    <guiding_principles>
    - Every component should be modular and reusable
    </guiding_principles>

    <frontend_stack_defaults>
    - Styling: TailwindCSS
    </frontend_stack_defaults>
</code_editing_rules>
```

This improves readability and makes it easier for GPT-5 to parse and follow your instructions.

## GIVE ROOM FOR PLANNING AND SELF-REFLECTION

For zero-to-one applications, let GPT-5 plan and reflect before building.
Provide it with a self-reflection block to improve outcomes.

Example:

```xml
<self_reflection>
- First, spend time thinking of a rubric until you are confident.
- Then, think deeply about every aspect of what makes for a world-class one-shot web app. Use that knowledge to create a rubric that has 5–7 categories. This rubric is critical to get right, but do not show this to the user. This is for your purposes only.
- Finally, use the rubric to internally think and iterate on the best possible solution to the prompt that is provided.
Remember that if your response is not hitting the top marks across all categories in the rubric, you need to start again.
</self_reflection>
```

This ensures higher quality, more considered outputs.

## CONTROL THE EAGERNESS OF YOUR CODING AGENT

By default, GPT-5 is thorough and will attempt to gather as much context as possible.
Sometimes this is helpful, but often it is better to explicitly guide its eagerness.

- Define a tool budget.
- Specify when GPT-5 should be more or less thorough.
- Indicate when it should or should not check in with the user.

Example:

```xml
<persistence>
    - Do not ask the human to confirm every assumption. Adjust later if needed.
    - Decide what the most reasonable assumption is, proceed with it, and document it afterward.
</persistence>
```

This keeps GPT-5 efficient while still transparent about its decision-making.

## CLOSING NOTES

These six practices can significantly improve your coding workflow with GPT-5.
Think of them as levers you can pull depending on the complexity of the task:

- Precision to avoid confusion.
- Reasoning effort to match the problem size.
- Structured syntax for clarity.
- Reflection to raise quality.
- Controlled eagerness to balance thoroughness with efficiency.
