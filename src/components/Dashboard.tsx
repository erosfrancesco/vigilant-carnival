import { useState } from "react";
import { GpioMonitor } from "../gpio/GpioMonitor";
import { GpioWidget } from "../gpio/GpioWidget";
import { GpioCalibration } from "../gpio/GpioCalibration";
import { ShellWidget } from "./ShellWidget";
import { useWidgetLayout } from "../hooks/useWidgetLayout";
import { useWidgetVisibility } from "../hooks/useWidgetVisibility";
import { I2CWidget } from "../i2c/I2CWidget";
import { useWebSocketContext } from "../context/WebSocketContext";

const defaultWidgetOrder = ["pinout", "gpio", "calibration", "i2c", "shell"] as const;
type WidgetId = (typeof defaultWidgetOrder)[number];

const widgets: Record<WidgetId, React.ReactNode> = {
  pinout: <GpioMonitor />,
  gpio: <GpioWidget />,
  calibration: <GpioCalibration />,
  i2c: <I2CWidget />,
  shell: <ShellWidget />,
};

const widgetLabels: Record<WidgetId, string> = {
  pinout: "GPIO pinout",
  gpio: "GPIO monitoring",
  calibration: "PWM calibration",
  i2c: "I2C bus",
  shell: "Remote shell",
};

export function Dashboard() {
  const { isConnected } = useWebSocketContext();
  const { widgetOrder, moveWidget } = useWidgetLayout(
    "dashboard-widget-order",
    defaultWidgetOrder,
  );
  const { isWidgetVisible } = useWidgetVisibility();
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      {widgetOrder.filter(isWidgetVisible).map((widget) => (
        <div
          className="relative flex h-full lg:sticky lg:top-6"
          key={widget}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (draggedWidget) moveWidget(draggedWidget, widget);
            setDraggedWidget(null);
          }}
        >
          <button
            aria-label={`Move ${widgetLabels[widget]} widget`}
            className="absolute right-3 top-3 z-10 cursor-grab rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm leading-none text-slate-500 hover:text-slate-100 active:cursor-grabbing"
            disabled={!isConnected}
            draggable={isConnected}
            onDragEnd={() => setDraggedWidget(null)}
            onDragStart={() => setDraggedWidget(widget)}
            title={`Move ${widgetLabels[widget]} widget`}
            type="button"
          >
            ⋮⋮
          </button>
          <fieldset
            aria-label={`${widgetLabels[widget]} controls`}
            className="contents"
            disabled={!isConnected}
          >
            {widgets[widget]}
          </fieldset>
        </div>
      ))}
    </div>
  );
}