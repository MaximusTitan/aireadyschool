import PLPForm from "../components/plp-form";

// Ensure `PLPForm` is loaded correctly

export default function PLPPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">PLP Generator</h1>
      <PLPForm />
    </div>
  );
}
