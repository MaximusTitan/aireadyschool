import DocumentGenerator from "./DocumentGeneratorComponent";

export default function Page() {
  return (
    <div className="p-4">
      <h1 className=" mb-4 text-3xl font-bold text-rose-500">Document Generator</h1>
      <DocumentGenerator />
    </div>
  );
}
