Implement a new prop on an existing component following the repo conventions:

1. Identify the prop type (Type 1 = plain value, Type 2 = computed, Type 3 = subcomponent).
2. For Type 1: update the options type (e.g. `BigNumberOptions`) in BOTH `vega-spec-builder` AND `vega-spec-builder-s2`. No adapter change needed.
3. Update the React component to consume the prop.
4. Add unit tests in the matching `*.test.ts` file (TZ=UTC).
5. Add a Storybook story showing the new prop in use.
6. Apache 2.0 header on any new file.
7. Run `yarn test --testPathPattern=<component>` to verify.

Plan first. Show me the file list and approach before writing code.
