import IconField from "./IconField.jsx";
import { TextInput } from "./Field.jsx";

// Icoon kiezen + naam in één regel, zoals bovenaan routine-, sjabloon- en
// notitieboek-sheets. Enter = opslaan.
export default function IconNameField({
  icon,
  onIcon,
  value,
  onChange,
  placeholder,
  onEnter,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <IconField value={icon} onChange={onIcon} />
      <TextInput
        value={value}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        style={{ flex: 1, minWidth: 140 }}
      />
    </div>
  );
}
