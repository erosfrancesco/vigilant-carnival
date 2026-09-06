import { Section, Subsection } from "../layouts/Section";
import { Button, Input } from "../layouts/StyledComponents";
import { useI2C } from "../hooks/useI2C";

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function I2CWidget() {
  const {
    isConnected,
    configuration,
    updateConfiguration,
    scan,
    readRegister,
    writeRegister,
    readBlock,
    writeBlock,
    scanResponse,
    readRegisterResponse,
    writeRegisterResponse,
    readBlockResponse,
    writeBlockResponse,
  } = useI2C();
  const addressNumber = numberValue(configuration.address);
  const registerNumber = numberValue(configuration.register);

  function parseData() {
    return configuration.data
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item >= 0 && item <= 255);
  }

  return (
    <Section className="h-full" Title="I2C bus">
      <fieldset className="flex flex-col gap-4" disabled={!isConnected}>
        <Subsection subtitle="Bus scan">
          <div className="flex flex-wrap items-end gap-3">
            <Button onClick={scan} type="button">
              Scan bus
            </Button>
            {scanResponse && (
              <output className="font-mono text-sm text-slate-300">
                Bus {scanResponse.bus}: {scanResponse.addresses.join(", ") || "No devices"}
              </output>
            )}
          </div>
        </Subsection>

        <Subsection subtitle="Register operations">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Address" min={0} max={127} onChange={(event) => updateConfiguration({ address: event.target.value })} type="number" value={configuration.address} />
            <Input label="Register" min={0} max={255} onChange={(event) => updateConfiguration({ register: event.target.value })} type="number" value={configuration.register} />
            <Input label="Value" min={0} max={255} onChange={(event) => updateConfiguration({ value: event.target.value })} type="number" value={configuration.value} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => readRegister(addressNumber, registerNumber)} type="button">
              Read register
            </Button>
            <Button onClick={() => writeRegister(addressNumber, registerNumber, numberValue(configuration.value))} type="button">
              Write register
            </Button>
          </div>
          {(readRegisterResponse || writeRegisterResponse) && (
            <output className="mt-3 block font-mono text-sm text-slate-300">
              Value: {(readRegisterResponse ?? writeRegisterResponse)?.value}
            </output>
          )}
        </Subsection>

        <Subsection subtitle="Block operations">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Length" min={1} max={32} onChange={(event) => updateConfiguration({ length: event.target.value })} type="number" value={configuration.length} />
            <Input label="Data (comma-separated)" onChange={(event) => updateConfiguration({ data: event.target.value })} value={configuration.data} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => readBlock(addressNumber, registerNumber, numberValue(configuration.length, 1))} type="button">
              Read block
            </Button>
            <Button onClick={() => writeBlock(addressNumber, registerNumber, parseData())} type="button">
              Write block
            </Button>
          </div>
          {(readBlockResponse || writeBlockResponse) && (
            <output className="mt-3 block break-words font-mono text-sm text-slate-300">
              Data: [{(readBlockResponse ?? writeBlockResponse)?.data.join(", ")}]
            </output>
          )}
        </Subsection>
      </fieldset>
    </Section>
  );
}