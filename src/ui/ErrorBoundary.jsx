import { Component } from "react";
import Button from "./Button.jsx";
import { forgetResume } from "../lib/resume.js";

// Vangnet: een fout in een scherm (of een stuk app dat na een update niet
// meer te laden is) geeft een melding in plaats van een wit scherm. Je data
// staat in IndexedDB en blijft gewoon staan.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.error("[ErrorBoundary]", err);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          padding: "48px 24px",
          textAlign: "center",
          fontFamily: "var(--ff-body)",
          color: "var(--text)",
        }}
      >
        <h1 style={{ fontFamily: "var(--ff-head)", fontSize: "var(--fs-xl)" }}>
          Er ging iets mis
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "12px 0 24px" }}>
          Je gegevens zijn veilig. Opnieuw laden lost dit meestal op, ook na een
          update van de app.
        </p>
        <Button
          onClick={() => {
            forgetResume(); // niet terug naar het scherm dat crashte
            location.reload();
          }}
        >
          Opnieuw laden
        </Button>
      </div>
    );
  }
}
