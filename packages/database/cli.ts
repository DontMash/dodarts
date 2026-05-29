const command = Deno.args[0];
const validCommands = ["generate", "push", "check", "studio"] as const;

if (
  !command || !validCommands.includes(command as (typeof validCommands)[number])
) {
  console.error(`Usage: deno run cli.ts <${validCommands.join("|")}>`);
  Deno.exit(1);
}

const configPath = new URL("./config.ts", import.meta.url).pathname;

const cmd = new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "--allow-read",
    "--allow-env",
    "--allow-sys",
    "--allow-write",
    "--allow-ffi",
    "--allow-net",
    "--allow-run",
    "npm:drizzle-kit",
    command,
    `--config=${configPath}`,
  ],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await cmd.spawn().status;
Deno.exit(code);
