import { Section, Subsection } from "../layouts/Section";
import { Checkbox } from "../layouts/StyledComponents";
import { dashboardWidgets, useWidgetVisibility } from "../hooks/useWidgetVisibility";

export function DashboardSettings() {
  const { isWidgetVisible, setWidgetVisible } = useWidgetVisibility();

  return (
    <Section Title="Dashboard Settings">
      <Subsection subtitle="Visible widgets">
        <div className="grid gap-3 sm:grid-cols-2">
          {dashboardWidgets.map(({ id, label }) => (
            <Checkbox
              checked={isWidgetVisible(id)}
              key={id}
              label={label}
              onChange={(event) => setWidgetVisible(id, event.target.checked)}
            />
          ))}
        </div>
      </Subsection>
    </Section>
  );
}