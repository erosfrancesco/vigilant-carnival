import { useState } from "react";
import { Section, SectionError } from "../layouts/Section";
import { Button, Input } from "../layouts/StyledComponents";
import { useShell } from "../hooks/useShell";
import { AutoScrollPanel } from "./AutoScrollPanel";

export function ShellWidget() {
  const {
    shellErrors,
    shellMessages,
    shellStarted,
    isConnected,
    startShell,
    runCommand,
    cancelCommand,
  } = useShell();
  const [command, setCommand] = useState("");
  const shellOutputText = shellMessages.map((message) => message.data).join("\n");

  return (
    <Section
      className="flex h-full flex-col gap-2"
      Title="Remote shell"
      Accessory={
        !shellStarted && (
          <Button onClick={startShell} type="button" disabled={!isConnected}>
            Start shell
          </Button>
        )
      }
    >
      <div className="mt-4 flex items-start gap-3">
        <fieldset
          className="min-w-0 flex-1"
          disabled={!isConnected || !shellStarted}
        >
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              runCommand(command, () => setCommand(""));
            }}
          >
            <Input
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.ctrlKey && event.key.toLowerCase() === "c") {
                  event.preventDefault();
                  cancelCommand();
                  setCommand("");
                }
              }}
              placeholder="Enter a shell command. Ctrl+C to cancel."
              value={command}
            />
            <Button disabled={!command} type="submit" variant="filled">
              Run
            </Button>
          </form>
        </fieldset>
      </div>

      {shellErrors.length > 0 && (
        <SectionError className="max-h-48 overflow-y-auto" title="Shell Errors">
          {shellErrors.map((error, index) => (
            <p
              key={`${"message" in error ? error.message : error.error}-${index}`}
              className="mb-2 last:mb-0"
            >
              {"message" in error ? error.message : error.error}
            </p>
          ))}
        </SectionError>
      )}

      <AutoScrollPanel
        className="h-80"
        contentKey={shellMessages.length}
        copyText={shellOutputText}
      >
        {shellMessages.length === 0
          ? ""
          : shellMessages.map((message, index) => (
              <pre
                key={`${message.type}-${index}`}
                className="mb-3 whitespace-pre-wrap last:mb-0"
              >
                {message.data}
              </pre>
            ))}
      </AutoScrollPanel>
    </Section>
  );
}
