import { performFullImport } from "../../lib/backup.js";
import { showToast } from "../../lib/toast.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";

// Keuze bij het importeren van een backup: samenvoegen of volledig vervangen.
export default function ImportDialog({ data, onExport, onDone }) {
  const run = async (merge) => {
    try {
      // Vangnet: vóór "vervangen" de huidige staat downloaden, zodat een
      // verkeerde backup nooit het enige exemplaar van je data wist.
      if (!merge) await onExport();
      await performFullImport(data, merge);
    } catch (err) {
      showToast("Fout bij importeren: " + err.message);
    } finally {
      onDone();
    }
  };
  return (
    <ConfirmDialog
      title="Backup importeren"
      message="Samenvoegen vult aan wat je nog niet hebt; wat er al staat blijft zoals het is. Volledig vervangen wist eerst je huidige data — daarvoor wordt automatisch een veiligheidsbackup gedownload."
      danger={false}
      actions={[
        { label: "Samenvoegen", variant: "primary", onClick: () => run(true) },
        {
          label: "Volledig vervangen",
          variant: "dangerSolid",
          onClick: () => run(false),
        },
      ]}
      onCancel={onDone}
    />
  );
}
