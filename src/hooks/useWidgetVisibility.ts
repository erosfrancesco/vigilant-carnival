import { useCookie } from "./useCookie";

export const dashboardWidgets = [
  { id: "pinout", label: "GPIO pinout" },
  { id: "gpio", label: "GPIO monitoring" },
  { id: "calibration", label: "PWM calibration" },
  { id: "i2c", label: "I2C bus" },
  { id: "shell", label: "Remote shell" },
] as const;

export type WidgetId = (typeof dashboardWidgets)[number]["id"];

const defaultVisibility: Record<WidgetId, boolean> = {
  pinout: true,
  gpio: true,
  calibration: true,
  i2c: true,
  shell: true,
};

export function useWidgetVisibility() {
  const [visibility, setVisibility] = useCookie(
    "dashboard-widget-visibility",
    defaultVisibility,
  );
  function setWidgetVisible(widget: WidgetId, visible: boolean) {
    setVisibility((current) => ({ ...current, [widget]: visible }));
  }

  function isWidgetVisible(widget: WidgetId) {
    return visibility[widget] !== false;
  }

  return { isWidgetVisible, setWidgetVisible };
}