import { useEffect, useState } from "react";
import type { PinMode } from "../ws/protocol";
import { CardPanel, Section, Subsection } from "../layouts/Section";
import { Button, Checkbox, Input, Select } from "../layouts/StyledComponents";
import { useGpioUI } from "./useGpioUI";

export function GpioSettings() {
  const {
    refreshInterval,
    setRefreshInterval,
    allowedPins,
    pwmPins,
    selectedPwmPin,
    setSelectedPwmPin,
    pinModes,
    monitoredPins,
    setMonitoredPins,
    setPinMode,
    isConnected,
  } = useGpioUI();
  const [selectedPin, setSelectedPin] = useState(allowedPins[0]);
  const [selectedMode, setSelectedMode] = useState<PinMode>(
    pinModes.get(allowedPins[0]) ?? "input",
  );
  const supportsPwm = pwmPins.includes(selectedPin);

  useEffect(() => {
    if (!supportsPwm && selectedMode === "pwm") setSelectedMode("input");
  }, [selectedMode, supportsPwm]);

  function updateMonitoredPins(
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
    pin: number,
  ) {
    const checkboxValue = e.target.checked;
    monitoredPins.set(pin, checkboxValue);
    setMonitoredPins(monitoredPins);
  }

  return (
    <Section Title="GPIO Settings">
      <fieldset className="flex flex-col gap-6" disabled={!isConnected}>
        <Subsection>
        <Input
          aria-label="GPIO refresh interval in seconds"
          className="w-24"
          label="Refresh interval (s)"
          min={1}
          onChange={(event) => {
            setRefreshInterval(Math.max(1, Number(event.target.value) || 1));
          }}
          type="number"
          value={refreshInterval}
        />
        </Subsection>

        <Subsection subtitle="PWM calibration">
        <Select
          id="calibration-pin"
          label="PWM pin"
          onChange={(event) => setSelectedPwmPin(Number(event.target.value))}
          value={selectedPwmPin}
        >
          {pwmPins.map((pin) => (
            <option key={pin} value={pin}>
              GPIO {pin}
            </option>
          ))}
        </Select>
        </Subsection>

        <Subsection subtitle="Select which pins to monitor">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-3">
          {allowedPins.map((pin) => {
            return (
              <div className="flex min-w-0" key={pin}>
                <Checkbox
                  checked={monitoredPins.get(pin) ?? false}
                  label={`GPIO ${pin}`}
                  type="checkbox"
                  onChange={(e) => updateMonitoredPins(e, pin)}
                />
              </div>
            );
          })}
        </div>
        </Subsection>

        <Subsection subtitle="Select pin mode">
        <p className="mb-4 text-sm text-slate-500">
          PWM is available only on GPIO 18.
        </p>
        <fieldset
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          disabled={!isConnected}
        >
          <Select
            id="mode-pin"
            label="Pin"
            onChange={(event) => {
              const pin = Number(event.target.value);
              setSelectedPin(pin);
              setSelectedMode(pinModes.get(pin) ?? "input");
            }}
            value={selectedPin}
          >
              {allowedPins.map((pin) => (
                <option key={pin} value={pin}>
                  GPIO {pin}
                </option>
              ))}
          </Select>

          <Select
            id="pin-mode"
            label="Mode"
            onChange={(event) => setSelectedMode(event.target.value as PinMode)}
            value={selectedMode}
          >
              <option value="input">Input</option>
              <option value="output">Output</option>
              {supportsPwm && <option value="pwm">PWM</option>}
          </Select>

          <Checkbox
            checked={monitoredPins.get(selectedPin) ?? false}
            id="selected-pin-monitor"
            label="Monitor"
            onChange={(event) => updateMonitoredPins(event, selectedPin)}
          />

          <Button
            onClick={() => setPinMode(selectedPin, selectedMode)}
            type="button"
          >
            Apply mode
          </Button>
        </fieldset>
        </Subsection>

      </fieldset>
    </Section>
  );
}

export function GpioActions({ pin }: { pin: number }) {
  const {
    setPin,
    setPinPWM,
    togglePin,
    stopPinPWM,
    isConnected,
    pwmPins,
  } = useGpioUI();
  const supportsPwm = pwmPins.includes(pin);

  return (
    <CardPanel>
      <fieldset className="flex flex-col gap-4" disabled={!isConnected}>
        <div>GPIO {pin} Actions</div>
        <div className="flex gap-4">
          <Button onClick={() => setPin(pin, true)}>Set High</Button>
          <Button onClick={() => setPin(pin, false)}>Set Low</Button>
          <Button onClick={() => togglePin(pin)}>Toggle</Button>
        </div>

        {supportsPwm && (
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setPinPWM(pin, 50)}>PWM 50%</Button>
            <Button onClick={() => setPinPWM(pin, 75)}>PWM 75%</Button>
            <Button onClick={() => setPinPWM(pin, 100)}>PWM 100%</Button>
            <Button onClick={() => stopPinPWM(pin)}>Stop PWM</Button>
          </div>
        )}
      </fieldset>
    </CardPanel>
  );
}
