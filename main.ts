import { Command, EnumType, ValidationError } from "@cliffy/command";

import {
  runClearCommand,
  runConfigCommand,
  runConfigListCommand,
  runConfigResetCommand,
  runMarkCommand,
  runSnoozeCommand,
  runStatusCommand,
} from "./cmds.ts";
import { type Config, loadConfig } from "./config.ts";
import { MONTHS } from "./consts.ts";
import { capitalize } from "./formatting.ts";
import { DataKey } from "./sheets.ts";

const validateConfig = (config: Config) => {
  if (!config.sheetId) {
    throw new ValidationError(
      "Use sheetId option flag or run `config` command before interacting with data source.",
    );
  }
};

const parseKeys = (keys: unknown): DataKey[] => {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  return keyArray.map((k: unknown) => {
    const key = String(k).toLowerCase() as DataKey;
    if (!Object.values(DataKey).includes(key)) {
      throw new ValidationError(
        `Invalid key: ${key}. Valid keys: ${Object.values(DataKey).join(", ")}`,
      );
    }
    return key;
  });
};

if (import.meta.main) {
  const config = await loadConfig();

  const cmd = new Command()
    .name("expensee")
    .version("0.1.0")
    .description("Simplify checking and updating monthly expense statuses")
    .globalType("data-key", new EnumType(DataKey))
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
    // Default cmd (status) - needs to be explicit to work with global options
    .action((opts) => {
      validateConfig(opts);
      return runStatusCommand(opts);
    })
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
    .description("Mark one or more expenses as done (✔)")
    .arguments("[...keys]")
    .action((opts, ...keys) => {
      validateConfig(opts);
      return runMarkCommand({ ...opts, keys: parseKeys(keys) });
    })
    // Clear cmd
    .command("clear")
    .description("Clear one or more expense statuses")
    .arguments("[...keys]")
    .action((opts, ...keys) => {
      validateConfig(opts);
      return runClearCommand({ ...opts, keys: parseKeys(keys) });
    })
    // Snooze cmd
    .command("snooze")
    .description("Snooze one or more expenses (X)")
    .arguments("[...keys]")
    .action((opts, ...keys) => {
      validateConfig(opts);
      return runSnoozeCommand({ ...opts, keys: parseKeys(keys) });
    });

  // Run 🚀
  await cmd.parse(Deno.args);
}
