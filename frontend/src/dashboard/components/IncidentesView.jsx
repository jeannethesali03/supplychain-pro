/**
 * IncidentesView - Envoltura de panel con contexto
 */

import IncidentsPanel from "./IncidentsPanel.jsx";

export default function IncidentesView() {
  return (
    <div className="control-panel">
      <IncidentsPanel />
    </div>
  );
}
