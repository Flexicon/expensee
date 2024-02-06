import { load } from "https://deno.land/std@0.214.0/dotenv/mod.ts";
import {
  Command,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

import {
  runClearCommand,
  runConfigCommand,
  runConfigListCommand,
  runConfigResetCommand,
  runMarkCommand,
  runSnoozeCommand,
  runStatusCommand,
} from "./cmds.ts";
import { Config, loadConfig } from "./config.ts";

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

const validateConfig = (config: Config) => {
  if (!config.sheetId) {
    throw new ValidationError(
      "Use sheetId option flag or run `config` command before interacting with data source.",
    );
  }
};

if (import.meta.main) {
  await load({ export: true });
  const config = await loadConfig();

  const cmd = new Command()
    .name("expensee")
    .version("0.1.0")
    .description("Simplify checking and updating monthly expense statuses")
    .globalOption(
      "-s, --sheetId <sheet_id:string>",
      "Sheet ID to use as data source.",
      { default: config.sheetId },
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
    .description("Report on the expenses current status for the month.")
    .action((opts) => {
      validateConfig(opts);
      return runStatusCommand(opts);
    })
    // Config cmd
    .command("config")
    .description("Configure credentials and settings.")
    .option(
      "-r, --reset",
      "Reset all settings by deleting user config files.",
      {
        standalone: true,
        action: (_) => runConfigResetCommand(),
      },
    )
    .option("-l, --list", "List current config settings.", {
      standalone: true,
      action: (_) => runConfigListCommand(config),
    })
    .action((_) => runConfigCommand(config))
    // Mark cmd
    .command("mark")
    .description("TODO")
    .action((opts) => {
      validateConfig(opts);
      return runMarkCommand();
    })
    // Clear cmd
    .command("clear")
    .description("TODO")
    .action((opts) => {
      validateConfig(opts);
      return runClearCommand();
    })
    // Snooze cmd
    .command("snooze")
    .description("TODO")
    .action((opts) => {
      validateConfig(opts);
      return runSnoozeCommand();
    });

  // Run 🚀
  await cmd.parse(Deno.args);
}
