/**
 * IncidentesView - Envoltura de panel con contexto
 */

import IncidentsPanel from "./IncidentsPanel.jsx";

export default function IncidentesView({ onShowIncident, selectedIncident }) {
  return (
    <div className="control-panel">
      <IncidentsPanel onShowIncident={onShowIncident} selectedIncident={selectedIncident} />
    </div>
  );
}
