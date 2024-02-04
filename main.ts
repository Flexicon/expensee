import { load } from "https://deno.land/std@0.214.0/dotenv/mod.ts";
import {
  Command,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

import {
  runClearCommand,
  runMarkCommand,
  runSnoozeCommand,
  runStatusCommand,
} from "./cmds.ts";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "november",
  "december",
];

const capitalize = (val: string) => val.charAt(0).toUpperCase() + val.slice(1);

if (import.meta.main) {
  await load({ export: true });

  const cmd = new Command()
    .name("expensee")
    .version("0.1.0")
    .description("Simplify checking and updating monthly expense statuses")
    .globalEnv(
      "EXPENSEE_SHEET_ID=<value:string>",
      "Google Sheets document ID to use as data source.",
      { required: true, prefix: "EXPENSEE_" },
    )
    .globalOption(
      "-m, --month <name:string>",
      "Month to use for most checks and updates.",
      {
        default: capitalize(MONTHS[new Date().getMonth()]),
        value: (input: string) => {
          const index = MONTHS.indexOf(input.toLowerCase());
          if (index === -1) {
            throw new ValidationError(
              `Month must be one of [${MONTHS}], but got "${input}".`,
            );
          }
          return index + 1;
        },
      },
    )
    .default("status")
    // Status cmd
    .command("status")
    .description("TODO")
    .action((opts) => runStatusCommand(opts))
    // Pay cmd
    .command("mark")
    .description("TODO")
    .action((_) => runMarkCommand())
    // Clear cmd
    .command("clear")
    .description("TODO")
    .action((_) => runClearCommand())
    // Ignore cmd
    .command("snooze")
    .description("TODO")
    .action((_) => runSnoozeCommand());

  // Run 🚀
  await cmd.parse(Deno.args);
}
