import { Section, Subsection } from "../layouts/Section";
import { Button, Input } from "../layouts/StyledComponents";
import { useI2C } from "../hooks/useI2C";

const defaults = {
  address: "72",
  register: "0",
  value: "0",
  length: "8",
  data: "1, 2, 3, 4",
};

export function I2CSettings() {
  const { configuration, updateConfiguration, isConnected } = useI2C();

  return (
    <Section Title="I2C Settings">
      <fieldset
        className="flex flex-col gap-4"
        disabled={!isConnected}
      >
        <Subsection subtitle="Persistent operation defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Device address"
            min={0}
            max={127}
            onChange={(event) => updateConfiguration({ address: event.target.value })}
            type="number"
            value={configuration.address}
          />
          <Input
            label="Register"
            min={0}
            max={255}
            onChange={(event) => updateConfiguration({ register: event.target.value })}
            type="number"
            value={configuration.register}
          />
          <Input
            label="Register value"
            min={0}
            max={255}
            onChange={(event) => updateConfiguration({ value: event.target.value })}
            type="number"
            value={configuration.value}
          />
          <Input
            label="Block length"
            min={1}
            max={32}
            onChange={(event) => updateConfiguration({ length: event.target.value })}
            type="number"
            value={configuration.length}
          />
          <Input
            className="sm:col-span-2"
            label="Block data (comma-separated)"
            onChange={(event) => updateConfiguration({ data: event.target.value })}
            value={configuration.data}
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => updateConfiguration(defaults)}
          type="button"
        >
          Restore defaults
        </Button>
        </Subsection>
      </fieldset>
    </Section>
  );
}